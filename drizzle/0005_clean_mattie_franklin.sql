ALTER TABLE "nfc_cards" DROP CONSTRAINT "nfc_cards_assignment_valid";--> statement-breakpoint
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_assignment_valid" CHECK ((
        "nfc_cards"."status" = 'unassigned'
        AND "nfc_cards"."event_id" IS NULL
        AND "nfc_cards"."invitation_id" IS NULL
        AND "nfc_cards"."credential_hash" IS NULL
      ) OR (
        "nfc_cards"."status" <> 'unassigned'
        AND "nfc_cards"."organization_id" IS NOT NULL
        AND "nfc_cards"."event_id" IS NOT NULL
        AND "nfc_cards"."invitation_id" IS NOT NULL
        AND "nfc_cards"."credential_hash" IS NOT NULL
        AND "nfc_cards"."assigned_at" IS NOT NULL
      ));

--> statement-breakpoint
insert into public.nfc_cards (
  organization_id, event_id, invitation_id, label, credential_hash, status,
  assigned_at, revoked_at
)
select
  e.organization_id, e.id, i.id, i.label, i.token_hash,
  case when i.revoked_at is null then 'active'::public.nfc_card_status
    else 'revoked'::public.nfc_card_status end,
  i.issued_at, i.revoked_at
from public.invitations i
join public.events e on e.id = i.event_id;

--> statement-breakpoint
create or replace function private.record_invitation_nfc_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
begin
  select e.organization_id into v_organization_id
  from public.events e where e.id = new.event_id;

  insert into public.nfc_cards (
    organization_id, event_id, invitation_id, label, credential_hash,
    status, assigned_at, revoked_at
  ) values (
    v_organization_id, new.event_id, new.id, new.label, new.token_hash,
    case when new.revoked_at is null then 'active'::public.nfc_card_status
      else 'revoked'::public.nfc_card_status end,
    new.issued_at, new.revoked_at
  );
  return new;
end;
$$;

--> statement-breakpoint
create trigger invitations_create_nfc_card
after insert on public.invitations
for each row execute function private.record_invitation_nfc_card();

--> statement-breakpoint
create or replace function private.revoke_invitation_nfc_cards()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.revoked_at is null and new.revoked_at is not null then
    update public.nfc_cards
    set status = 'revoked', revoked_at = new.revoked_at
    where invitation_id = new.id and status = 'active';
  end if;
  return new;
end;
$$;

--> statement-breakpoint
create trigger invitations_revoke_nfc_cards
after update of revoked_at on public.invitations
for each row execute function private.revoke_invitation_nfc_cards();

--> statement-breakpoint
alter table public.nfc_cards enable row level security;
revoke all on table public.nfc_cards from public, anon, authenticated;
grant select (
  id, organization_id, event_id, invitation_id, label, status,
  replaced_by_id, assigned_at, replaced_at, revoked_at, created_at
) on public.nfc_cards to authenticated;
create policy nfc_cards_scoped_manager_read on public.nfc_cards
  for select to authenticated
  using (
    (event_id is not null and private.can_manage_event(event_id))
    or (event_id is null and private.can_manage_org(organization_id))
  );

--> statement-breakpoint
revoke all on function private.record_invitation_nfc_card() from public, anon, authenticated;
revoke all on function private.revoke_invitation_nfc_cards() from public, anon, authenticated;
grant usage on type public.event_guest_mode to authenticated;

--> statement-breakpoint
create or replace function public.set_event_guest_mode(
  p_event_id uuid,
  p_mode public.event_guest_mode
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
begin
  if not private.can_manage_event(p_event_id) then
    raise exception 'You do not have permission to change this event experience.' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null then
    raise exception 'Event not found.' using errcode = '22023';
  end if;
  if v_event.guest_mode = p_mode then return; end if;

  if p_mode = 'rsvp' and v_event.status <> 'published' then
    raise exception 'RSVP mode is available while an event is published and before it goes live.' using errcode = '22023';
  elsif p_mode = 'meal_booth' and v_event.status <> 'live' then
    raise exception 'Meal & Booth mode is available only while the event is live.' using errcode = '22023';
  elsif p_mode = 'album' and v_event.status <> 'memories' then
    raise exception 'Post-event Album mode is available only in memories.' using errcode = '22023';
  end if;

  update public.events set guest_mode = p_mode where id = p_event_id;
  insert into public.audit_events (
    organization_id, event_id, actor_user_id, actor_type, action, subject_id, metadata
  ) values (
    v_event.organization_id, p_event_id, (select auth.uid()), 'user',
    'event.guest_mode.changed', p_event_id,
    jsonb_build_object('from', v_event.guest_mode, 'to', p_mode)
  );
end;
$$;

--> statement-breakpoint
create or replace function public.get_public_event_guest_mode(p_token text)
returns public.event_guest_mode
language sql
stable
security definer
set search_path = ''
as $$
  select e.guest_mode
  from public.invitations i
  join public.events e on e.id = i.event_id
  where i.token_hash = encode(
    extensions.digest(convert_to(coalesce(p_token, ''), 'UTF8'), 'sha256'), 'hex'
  )
    and i.revoked_at is null
    and e.status in ('published', 'live', 'memories')
    and exists (
      select 1 from public.nfc_cards c
      where c.invitation_id = i.id
        and c.credential_hash = i.token_hash
        and c.status = 'active'
    );
$$;

--> statement-breakpoint
create or replace function public.register_nfc_card(
  p_organization_id uuid,
  p_label text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card_id uuid;
  v_label text := btrim(coalesce(p_label, ''));
begin
  if not private.can_manage_org(p_organization_id) then
    raise exception 'You do not have permission to register cards for this organization.' using errcode = '42501';
  end if;
  if length(v_label) < 2 or length(v_label) > 100 then
    raise exception 'Card label must be between 2 and 100 characters.' using errcode = '22023';
  end if;

  insert into public.nfc_cards (organization_id, label, status)
  values (p_organization_id, v_label, 'unassigned')
  returning id into v_card_id;

  insert into public.audit_events (
    organization_id, actor_user_id, actor_type, action, subject_id, metadata
  ) values (
    p_organization_id, (select auth.uid()), 'user', 'nfc_card.registered', v_card_id,
    jsonb_build_object('label', v_label)
  );
  return v_card_id;
end;
$$;

--> statement-breakpoint
create or replace function public.assign_nfc_card(
  p_card_id uuid,
  p_invitation_id uuid
)
returns table (card_id uuid, invitation_token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card public.nfc_cards%rowtype;
  v_invitation public.invitations%rowtype;
  v_event public.events%rowtype;
  v_old_card_id uuid;
  v_token text;
  v_hash text;
begin
  select * into v_invitation from public.invitations
  where id = p_invitation_id for update;
  if v_invitation.id is null or v_invitation.revoked_at is not null then
    raise exception 'This invitation is unavailable.' using errcode = '22023';
  end if;
  select * into v_event from public.events where id = v_invitation.event_id for update;
  select * into v_card from public.nfc_cards where id = p_card_id for update;
  if v_card.id is null or v_card.status <> 'unassigned' then
    raise exception 'This physical card is unavailable for assignment.' using errcode = '22023';
  end if;
  if v_event.organization_id <> v_card.organization_id
    or not private.can_manage_event(v_event.id) then
    raise exception 'This card and invitation are outside your authorized organization.' using errcode = '42501';
  end if;
  if v_event.status not in ('draft', 'published', 'live') then
    raise exception 'Cards can be assigned before the event is archived.' using errcode = '22023';
  end if;

  select id into v_old_card_id from public.nfc_cards
  where invitation_id = v_invitation.id and status = 'active'
  for update;
  if v_old_card_id is not null then
    update public.nfc_cards
    set status = 'replaced', replaced_at = now()
    where id = v_old_card_id;
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  update public.invitations set token_hash = v_hash where id = v_invitation.id;
  update public.nfc_cards
  set event_id = v_event.id,
      invitation_id = v_invitation.id,
      credential_hash = v_hash,
      status = 'active',
      assigned_at = now()
  where id = v_card.id;
  if v_old_card_id is not null then
    update public.nfc_cards set replaced_by_id = v_card.id where id = v_old_card_id;
  end if;

  insert into public.audit_events (
    organization_id, event_id, actor_user_id, actor_type, action, subject_id, metadata
  ) values (
    v_event.organization_id, v_event.id, (select auth.uid()), 'user',
    case when v_old_card_id is null then 'nfc_card.assigned' else 'nfc_card.replaced' end,
    v_card.id, jsonb_build_object('invitationId', v_invitation.id, 'label', v_card.label)
  );
  return query select v_card.id, v_token;
end;
$$;

--> statement-breakpoint
create or replace function public.revoke_nfc_card(
  p_card_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card public.nfc_cards%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if length(v_reason) < 3 or length(v_reason) > 500 then
    raise exception 'Provide a reason between 3 and 500 characters.' using errcode = '22023';
  end if;
  select * into v_card from public.nfc_cards where id = p_card_id;
  if v_card.id is null or v_card.invitation_id is null then
    raise exception 'This physical card is unavailable.' using errcode = '22023';
  end if;
  perform 1 from public.invitations where id = v_card.invitation_id for update;
  select * into v_card from public.nfc_cards where id = p_card_id for update;
  if v_card.status <> 'active' or not private.can_manage_event(v_card.event_id) then
    raise exception 'This active card is unavailable or outside your authorization.' using errcode = '42501';
  end if;

  update public.nfc_cards set status = 'revoked', revoked_at = now()
  where id = v_card.id;
  update public.invitations
  set token_hash = encode(extensions.digest(extensions.gen_random_bytes(32), 'sha256'), 'hex')
  where id = v_card.invitation_id;
  insert into public.audit_events (
    organization_id, event_id, actor_user_id, actor_type, action, subject_id, metadata
  ) values (
    v_card.organization_id, v_card.event_id, (select auth.uid()), 'user',
    'nfc_card.revoked', v_card.id,
    jsonb_build_object('invitationId', v_card.invitation_id, 'reason', v_reason)
  );
end;
$$;

--> statement-breakpoint
revoke all on function public.set_event_guest_mode(uuid, public.event_guest_mode) from public, anon;
revoke all on function public.get_public_event_guest_mode(text) from public;
revoke all on function public.register_nfc_card(uuid, text) from public, anon;
revoke all on function public.assign_nfc_card(uuid, uuid) from public, anon;
revoke all on function public.revoke_nfc_card(uuid, text) from public, anon;
grant execute on function public.set_event_guest_mode(uuid, public.event_guest_mode) to authenticated;
grant execute on function public.get_public_event_guest_mode(text) to anon, authenticated;
grant execute on function public.register_nfc_card(uuid, text) to authenticated;
grant execute on function public.assign_nfc_card(uuid, uuid) to authenticated;
grant execute on function public.revoke_nfc_card(uuid, text) to authenticated;

--> statement-breakpoint
create or replace function public.submit_public_rsvp(
  p_token text,
  p_primary_email text,
  p_attendees jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations%rowtype;
  v_event public.events%rowtype;
  v_email text := lower(btrim(coalesce(p_primary_email, '')));
  v_count integer;
begin
  if p_token is null or length(p_token) <> 64 then
    raise exception 'This invitation link is invalid or no longer available.' using errcode = '22023';
  end if;
  select * into v_invitation
  from public.invitations i
  where i.token_hash = encode(
    extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex'
  )
  for update;

  if v_invitation.id is null or v_invitation.revoked_at is not null then
    raise exception 'This invitation link is invalid or no longer available.' using errcode = '22023';
  end if;
  if v_invitation.rsvp_submitted_at is not null then
    raise exception 'An RSVP has already been submitted for this invitation.' using errcode = '22023';
  end if;

  select * into v_event from public.events e
  where e.id = v_invitation.event_id for share;
  if v_event.status not in ('published', 'live') or v_event.guest_mode <> 'rsvp' then
    raise exception 'This event is not accepting RSVPs.' using errcode = '22023';
  end if;
  if v_event.rsvp_deadline is not null and now() > v_event.rsvp_deadline then
    raise exception 'The RSVP deadline has passed.' using errcode = '22023';
  end if;
  if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_email) > 320 then
    raise exception 'Enter a valid primary email address.' using errcode = '22023';
  end if;
  if p_attendees is null or jsonb_typeof(p_attendees) <> 'array' then
    raise exception 'Add the names and responses for your party.' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_attendees);
  if v_count < 1 or v_count > v_invitation.reserved_places then
    raise exception 'The number of responses exceeds this invitation allowance.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_attendees) as item(value)
    where jsonb_typeof(item.value) <> 'object'
      or length(btrim(coalesce(item.value ->> 'name', ''))) < 1
      or length(btrim(coalesce(item.value ->> 'name', ''))) > 120
      or coalesce(item.value ->> 'attendanceStatus', '') not in ('attending', 'declined', 'undecided')
  ) then
    raise exception 'Each guest needs a name and a valid attendance response.' using errcode = '22023';
  end if;

  insert into public.attendees (
    event_id, invitation_id, slot, name, attendance_status
  )
  select v_event.id, v_invitation.id, item.ordinality::integer,
    btrim(item.value ->> 'name'), item.value ->> 'attendanceStatus'
  from jsonb_array_elements(p_attendees) with ordinality as item(value, ordinality);

  update public.invitations
    set primary_email = v_email, rsvp_submitted_at = now()
    where id = v_invitation.id;

  insert into public.audit_events (
    organization_id, event_id, actor_type, action, subject_id, metadata
  ) values (
    v_event.organization_id, v_event.id, 'guest', 'rsvp.submitted', v_invitation.id,
    jsonb_build_object('attendeeCount', v_count)
  );

  insert into public.notification_outbox (
    organization_id, event_id, aggregate_id, aggregate_version, kind, payload
  ) values (
    v_event.organization_id, v_event.id, v_invitation.id, 1, 'rsvp.confirmation',
    jsonb_build_object('invitationId', v_invitation.id)
  );
end;
$$;
