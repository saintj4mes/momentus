-- Custom SQL migration file, put your code below! --
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create or replace function private.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_manage_org(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = p_organization_id
        and m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin', 'manager')
    );
$$;

create or replace function private.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and private.can_manage_org(e.organization_id)
  );
$$;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.can_manage_org(uuid) to authenticated;
grant execute on function private.can_manage_event(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.events enable row level security;
alter table public.invitations enable row level security;
alter table public.attendees enable row level security;
alter table public.audit_events enable row level security;
alter table public.notification_outbox enable row level security;

grant select on public.organizations, public.organization_memberships,
  public.events, public.invitations, public.attendees, public.audit_events
  to authenticated;

create policy organizations_member_read on public.organizations
  for select to authenticated using (private.is_org_member(id));

create policy memberships_scoped_read on public.organization_memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.can_manage_org(organization_id)
  );

create policy events_member_read on public.events
  for select to authenticated using (private.is_org_member(organization_id));

create policy invitations_manager_read on public.invitations
  for select to authenticated using (private.can_manage_event(event_id));

create policy attendees_manager_read on public.attendees
  for select to authenticated using (private.can_manage_event(event_id));

create policy audit_manager_read on public.audit_events
  for select to authenticated using (private.can_manage_org(organization_id));

-- No table-level privileges/policies are granted to browser roles for the outbox.

create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_organization_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_user_id is null then
    raise exception 'Sign in is required.' using errcode = '42501';
  end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'Set up authenticator MFA before creating an organization.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = v_user_id and u.email_confirmed_at is not null
  ) then
    raise exception 'Verify your email before creating an organization.' using errcode = '42501';
  end if;
  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Organization name must be between 2 and 100 characters.' using errcode = '22023';
  end if;

  insert into public.organizations (name, created_by)
  values (v_name, v_user_id)
  returning id into v_organization_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (v_organization_id, v_user_id, 'owner');

  insert into public.audit_events (
    organization_id, actor_user_id, actor_type, action, subject_id
  ) values (
    v_organization_id, v_user_id, 'user', 'organization.created', v_organization_id
  );

  return v_organization_id;
end;
$$;

create or replace function public.create_event(
  p_organization_id uuid,
  p_name text,
  p_event_date date,
  p_event_time time,
  p_timezone text,
  p_venue text,
  p_capacity integer,
  p_rsvp_deadline_local timestamp without time zone
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if not private.can_manage_org(p_organization_id) then
    raise exception 'You do not have permission to create events in this organization.' using errcode = '42501';
  end if;
  if length(v_name) < 2 or length(v_name) > 140 then
    raise exception 'Event name must be between 2 and 140 characters.' using errcode = '22023';
  end if;
  if p_event_date is null or p_event_time is null then
    raise exception 'Event date and time are required.' using errcode = '22023';
  end if;
  if p_timezone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names t where t.name = p_timezone
  ) then
    raise exception 'Choose a valid event timezone.' using errcode = '22023';
  end if;
  if p_capacity is null or p_capacity < 1 or p_capacity > 100000 then
    raise exception 'Capacity must be between 1 and 100000.' using errcode = '22023';
  end if;
  if p_rsvp_deadline_local is not null
    and (p_rsvp_deadline_local at time zone p_timezone) <= now() then
    raise exception 'RSVP deadline must be in the future.' using errcode = '22023';
  end if;

  insert into public.events (
    organization_id, name, event_date, event_time, timezone, venue,
    capacity, rsvp_deadline
  ) values (
    p_organization_id, v_name, p_event_date, p_event_time, p_timezone,
    nullif(btrim(coalesce(p_venue, '')), ''), p_capacity,
    case when p_rsvp_deadline_local is null then null
      else p_rsvp_deadline_local at time zone p_timezone end
  ) returning id into v_event_id;

  insert into public.audit_events (
    organization_id, event_id, actor_user_id, actor_type, action, subject_id
  ) values (
    p_organization_id, v_event_id, (select auth.uid()), 'user', 'event.created', v_event_id
  );

  return v_event_id;
end;
$$;

create or replace function public.publish_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
begin
  if not private.can_manage_event(p_event_id) then
    raise exception 'You do not have permission to publish this event.' using errcode = '42501';
  end if;
  update public.events
    set status = 'published'
    where id = p_event_id and status = 'draft'
    returning organization_id into v_organization_id;
  if v_organization_id is null then
    raise exception 'Only a draft event can be published.' using errcode = '22023';
  end if;
  insert into public.audit_events (
    organization_id, event_id, actor_user_id, actor_type, action, subject_id
  ) values (
    v_organization_id, p_event_id, (select auth.uid()), 'user', 'event.published', p_event_id
  );
end;
$$;

create or replace function public.create_private_invitation(
  p_event_id uuid,
  p_label text,
  p_companion_allowance integer
)
returns table (invitation_id uuid, guest_token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_invitation_id uuid;
  v_token text;
  v_label text := btrim(coalesce(p_label, ''));
begin
  if not private.can_manage_event(p_event_id) then
    raise exception 'You do not have permission to issue invitations for this event.' using errcode = '42501';
  end if;
  if length(v_label) < 2 or length(v_label) > 140 then
    raise exception 'Invitation label must be between 2 and 140 characters.' using errcode = '22023';
  end if;
  if p_companion_allowance is null or p_companion_allowance < 0 or p_companion_allowance > 20 then
    raise exception 'Companion allowance must be between 0 and 20.' using errcode = '22023';
  end if;

  select * into v_event
  from public.events e
  where e.id = p_event_id
  for update;

  if v_event.id is null or v_event.status not in ('draft', 'published') then
    raise exception 'Invitations can only be issued for draft or published events.' using errcode = '22023';
  end if;
  if v_event.reserved_places + 1 + p_companion_allowance > v_event.capacity then
    raise exception 'This invitation exceeds the remaining event capacity.' using errcode = '22023';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.invitations (
    event_id, label, companion_allowance, reserved_places, token_hash
  ) values (
    p_event_id, v_label, p_companion_allowance, 1 + p_companion_allowance,
    encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex')
  ) returning id into v_invitation_id;

  update public.events
    set reserved_places = reserved_places + 1 + p_companion_allowance
    where id = p_event_id;

  insert into public.audit_events (
    organization_id, event_id, actor_user_id, actor_type, action, subject_id,
    metadata
  ) values (
    v_event.organization_id, p_event_id, (select auth.uid()), 'user',
    'invitation.issued', v_invitation_id,
    jsonb_build_object('companionAllowance', p_companion_allowance)
  );

  return query select v_invitation_id, v_token;
end;
$$;

create or replace function public.get_public_invitation(p_token text)
returns table (
  invitation_label text,
  event_name text,
  event_date date,
  event_time time,
  timezone text,
  venue text,
  event_status text,
  rsvp_deadline timestamptz,
  companion_allowance integer,
  already_submitted boolean,
  submitted_attendees jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.label,
    e.name,
    e.event_date,
    e.event_time,
    e.timezone,
    e.venue,
    e.status::text,
    e.rsvp_deadline,
    i.companion_allowance,
    i.rsvp_submitted_at is not null,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', a.name,
          'attendanceStatus', a.attendance_status,
          'slot', a.slot
        ) order by a.slot
      )
      from public.attendees a
      where a.invitation_id = i.id
    ), '[]'::jsonb)
  from public.invitations i
  join public.events e on e.id = i.event_id
  where i.token_hash = encode(
      extensions.digest(convert_to(coalesce(p_token, ''), 'UTF8'), 'sha256'), 'hex'
    )
    and i.revoked_at is null
    and e.status in ('published', 'live', 'memories');
$$;

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

  select * into v_event from public.events e where e.id = v_invitation.event_id;
  if v_event.status not in ('published', 'live') then
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
  select
    v_event.id,
    v_invitation.id,
    item.ordinality::integer,
    btrim(item.value ->> 'name'),
    item.value ->> 'attendanceStatus'
  from jsonb_array_elements(p_attendees) with ordinality as item(value, ordinality);

  update public.invitations
    set primary_email = v_email, rsvp_submitted_at = now()
    where id = v_invitation.id;

  insert into public.audit_events (
    organization_id, event_id, actor_type, action, subject_id,
    metadata
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

revoke all on function public.create_organization(text) from public, anon;
revoke all on function public.create_event(uuid, text, date, time, text, text, integer, timestamp without time zone) from public, anon;
revoke all on function public.publish_event(uuid) from public, anon;
revoke all on function public.create_private_invitation(uuid, text, integer) from public, anon;
revoke all on function public.get_public_invitation(text) from public;
revoke all on function public.submit_public_rsvp(text, text, jsonb) from public;

grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.create_event(uuid, text, date, time, text, text, integer, timestamp without time zone) to authenticated;
grant execute on function public.publish_event(uuid) to authenticated;
grant execute on function public.create_private_invitation(uuid, text, integer) to authenticated;
grant execute on function public.get_public_invitation(text) to anon, authenticated;
grant execute on function public.submit_public_rsvp(text, text, jsonb) to anon, authenticated;
