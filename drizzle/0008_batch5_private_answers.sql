CREATE TABLE "private_registration_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendee_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"config_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Composite unique indexes are required as targets of event-scoped foreign keys below.
CREATE UNIQUE INDEX "attendees_id_event_unique" ON "attendees" USING btree ("id","event_id");--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "registration_config_id" uuid;--> statement-breakpoint
ALTER TABLE "private_registration_answers" ADD CONSTRAINT "private_registration_answers_attendee_event_fk" FOREIGN KEY ("attendee_id","event_id") REFERENCES "public"."attendees"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_registration_answers" ADD CONSTRAINT "private_registration_answers_invitation_event_fk" FOREIGN KEY ("invitation_id","event_id") REFERENCES "public"."invitations"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_registration_answers" ADD CONSTRAINT "private_registration_answers_question_config_fk" FOREIGN KEY ("question_id","config_id") REFERENCES "public"."event_registration_questions"("id","config_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_registration_answers" ADD CONSTRAINT "private_registration_answers_config_event_fk" FOREIGN KEY ("config_id","event_id") REFERENCES "public"."event_registration_configs"("id","event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

-- Additive compatibility backfill: preserve all current events/invitations and pin them to a v1 private form.
INSERT INTO public.client_profiles (organization_id)
SELECT o.id FROM public.organizations o
ON CONFLICT (organization_id) DO NOTHING;--> statement-breakpoint

INSERT INTO public.event_settings (event_id, organization_id)
SELECT e.id, e.organization_id FROM public.events e
ON CONFLICT (event_id) DO NOTHING;--> statement-breakpoint

INSERT INTO public.event_registration_configs (event_id, version, mode, is_current)
SELECT e.id, 1, 'private_invitation', true FROM public.events e
ON CONFLICT (event_id, version) DO NOTHING;--> statement-breakpoint

UPDATE public.invitations i
SET registration_config_id = c.id
FROM public.event_registration_configs c
WHERE c.event_id = i.event_id AND c.is_current
  AND i.registration_config_id IS NULL;--> statement-breakpoint

-- The v2 functions keep direct browser table access disabled. Tenant mutations run through audited RPCs.
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.event_registration_configs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.event_registration_questions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.open_registrations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.open_registration_people ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.registration_answers ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.private_registration_answers ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.registration_history ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

REVOKE ALL ON public.client_profiles, public.event_settings, public.event_registration_configs,
  public.event_registration_questions, public.open_registrations, public.open_registration_people,
  public.registration_answers, public.private_registration_answers, public.registration_history
  FROM PUBLIC, anon, authenticated;--> statement-breakpoint

GRANT SELECT ON public.client_profiles, public.event_settings, public.event_registration_configs,
  public.event_registration_questions, public.open_registrations, public.open_registration_people,
  public.registration_answers, public.private_registration_answers, public.registration_history
  TO authenticated;--> statement-breakpoint

CREATE POLICY client_profiles_manager_read ON public.client_profiles
  FOR SELECT TO authenticated USING (private.can_manage_org(organization_id));--> statement-breakpoint
CREATE POLICY event_settings_manager_read ON public.event_settings
  FOR SELECT TO authenticated USING (private.can_manage_event(event_id));--> statement-breakpoint
CREATE POLICY event_registration_configs_manager_read ON public.event_registration_configs
  FOR SELECT TO authenticated USING (private.can_manage_event(event_id));--> statement-breakpoint
CREATE POLICY event_registration_questions_manager_read ON public.event_registration_questions
  FOR SELECT TO authenticated USING (private.can_manage_event(event_id));--> statement-breakpoint
CREATE POLICY open_registrations_manager_read ON public.open_registrations
  FOR SELECT TO authenticated USING (private.can_manage_event(event_id));--> statement-breakpoint
CREATE POLICY open_registration_people_manager_read ON public.open_registration_people
  FOR SELECT TO authenticated USING (private.can_manage_event(event_id));--> statement-breakpoint
CREATE POLICY registration_answers_manager_read ON public.registration_answers
  FOR SELECT TO authenticated USING (private.can_manage_event(event_id));--> statement-breakpoint
CREATE POLICY private_registration_answers_manager_read ON public.private_registration_answers
  FOR SELECT TO authenticated USING (private.can_manage_event(event_id));--> statement-breakpoint
CREATE POLICY registration_history_manager_read ON public.registration_history
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.open_registrations r WHERE r.id = registration_history.registration_id AND private.can_manage_event(r.event_id))
  );--> statement-breakpoint

CREATE OR REPLACE FUNCTION private.validate_registration_answers(p_config_id uuid, p_answers jsonb)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE q record; v_value jsonb; v_visible boolean;
BEGIN
  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RAISE EXCEPTION 'Answers must be a JSON object.' USING errcode = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_answers) AS answer_key(key)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.event_registration_questions question
      WHERE question.config_id = p_config_id AND question.stable_key = answer_key.key
    )
  ) THEN RAISE EXCEPTION 'An answer references an unknown question.' USING errcode = '22023'; END IF;
  FOR q IN SELECT * FROM public.event_registration_questions WHERE config_id = p_config_id ORDER BY position LOOP
    v_value := p_answers -> q.stable_key;
    v_visible := true;
    IF q.visibility IS NOT NULL THEN
      v_visible := coalesce(
        p_answers -> (q.visibility ->> 'questionKey') = q.visibility -> 'value', false
      );
    END IF;
    IF NOT v_visible THEN
      IF v_value IS NOT NULL THEN RAISE EXCEPTION 'A hidden question cannot be answered.' USING errcode = '22023'; END IF;
      CONTINUE;
    END IF;
    IF q.required AND (v_value IS NULL OR v_value = 'null'::jsonb OR v_value = '""'::jsonb OR v_value = '[]'::jsonb) THEN
      RAISE EXCEPTION 'A required registration answer is missing.' USING errcode = '22023';
    END IF;
    IF v_value IS NULL OR v_value = 'null'::jsonb THEN CONTINUE; END IF;
    IF q.question_type IN ('dropdown', 'radio') AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.options) AS options(value)
      WHERE options.value = v_value OR options.value -> 'value' = v_value
    ) THEN RAISE EXCEPTION 'Choose one of the available options.' USING errcode = '22023'; END IF;
    IF q.question_type IN ('checkbox', 'multi_select') THEN
      IF jsonb_typeof(v_value) <> 'array' THEN RAISE EXCEPTION 'Choose only available options.' USING errcode = '22023'; END IF;
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_value) selected(value)
        WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(q.options) AS options(value) WHERE options.value = selected.value OR options.value -> 'value' = selected.value)
      ) THEN RAISE EXCEPTION 'Choose only available options.' USING errcode = '22023'; END IF;
    END IF;
    IF q.question_type IN ('short_text','long_text','email','phone','date','consent') AND jsonb_typeof(v_value) <> 'string' THEN
      RAISE EXCEPTION 'A text answer has the wrong format.' USING errcode = '22023';
    END IF;
    IF q.question_type = 'number' AND jsonb_typeof(v_value) <> 'number' THEN
      RAISE EXCEPTION 'A numeric answer has the wrong format.' USING errcode = '22023';
    END IF;
    IF q.question_type = 'email' AND (v_value #>> '{}') !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
      RAISE EXCEPTION 'Enter a valid email answer.' USING errcode = '22023';
    END IF;
    IF q.question_type IN ('short_text','long_text','email','phone','date','consent') AND length(v_value #>> '{}') > coalesce((q.validation ->> 'maxLength')::integer, 4000) THEN
      RAISE EXCEPTION 'An answer exceeds the allowed length.' USING errcode = '22023';
    END IF;
  END LOOP;
END; $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.get_open_registration_form(p_event_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'eventId', e.id, 'name', e.name, 'eventDate', e.event_date, 'eventTime', e.event_time,
    'timezone', e.timezone, 'configId', c.id, 'version', c.version, 'mode', c.mode,
    'questions', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', q.id, 'key', q.stable_key, 'label', q.label, 'type', q.question_type,
      'position', q.position, 'required', q.required, 'options', q.options,
      'validation', q.validation, 'visibility', q.visibility
    ) ORDER BY q.position) FROM public.event_registration_questions q WHERE q.config_id = c.id), '[]'::jsonb)
  )
  FROM public.events e JOIN public.event_settings s ON s.event_id = e.id
  JOIN public.event_registration_configs c ON c.event_id = e.id AND c.is_current
  WHERE e.id = p_event_id AND e.status IN ('published','live') AND e.guest_mode = 'rsvp'
    AND s.registration_enabled AND c.mode IN ('open','approval')
    AND (c.opens_at IS NULL OR c.opens_at <= now())
    AND (c.closes_at IS NULL OR c.closes_at >= now());
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.save_client_profile(
  p_organization_id uuid,p_category text,p_contact_name text,p_contact_email text,p_contact_phone text,p_details text,p_status public.client_status
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_name text:=nullif(btrim(coalesce(p_contact_name,'')),''); v_email text:=nullif(lower(btrim(coalesce(p_contact_email,''))),'');
BEGIN
  IF NOT private.can_manage_org(p_organization_id) THEN RAISE EXCEPTION 'You do not have permission to edit this client.' USING errcode='42501'; END IF;
  IF length(btrim(coalesce(p_category,''))) NOT BETWEEN 2 AND 60 OR length(coalesce(v_name,''))>160 OR length(coalesce(v_email,''))>320 OR length(coalesce(p_contact_phone,''))>40 OR length(coalesce(p_details,''))>4000 THEN RAISE EXCEPTION 'Client profile values exceed supported limits.' USING errcode='22023'; END IF;
  INSERT INTO public.client_profiles(organization_id,category,primary_contact_name,primary_contact_email,primary_contact_phone,details,status,updated_at)
    VALUES(p_organization_id,btrim(p_category),v_name,v_email,nullif(btrim(coalesce(p_contact_phone,'')),''),coalesce(p_details,''),p_status,now())
  ON CONFLICT (organization_id) DO UPDATE SET category=excluded.category,primary_contact_name=excluded.primary_contact_name,primary_contact_email=excluded.primary_contact_email,primary_contact_phone=excluded.primary_contact_phone,details=excluded.details,status=excluded.status,updated_at=now();
  INSERT INTO public.audit_events(organization_id,actor_user_id,actor_type,action,subject_id,metadata)
    VALUES(p_organization_id,(SELECT auth.uid()),'user','client.profile.updated',p_organization_id,jsonb_build_object('status',p_status,'category',p_category));
END; $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.save_event_settings(
  p_event_id uuid,p_type public.event_type,p_registration_enabled boolean,p_admission_enabled boolean,p_entitlements_enabled boolean,p_memories_enabled boolean,p_settings jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_event public.events%rowtype;
BEGIN
  IF NOT private.can_manage_event(p_event_id) THEN RAISE EXCEPTION 'You do not have permission to edit this event.' USING errcode='42501'; END IF;
  IF jsonb_typeof(coalesce(p_settings,'{}'::jsonb))<>'object' OR octet_length(coalesce(p_settings,'{}'::jsonb)::text)>16384 THEN RAISE EXCEPTION 'Event settings must be a JSON object under 16 KB.' USING errcode='22023'; END IF;
  SELECT * INTO v_event FROM public.events WHERE id=p_event_id FOR UPDATE;
  INSERT INTO public.event_settings(event_id,organization_id,event_type,registration_enabled,admission_enabled,entitlements_enabled,memories_enabled,settings,updated_at)
    VALUES(v_event.id,v_event.organization_id,p_type,p_registration_enabled,p_admission_enabled,p_entitlements_enabled,p_memories_enabled,coalesce(p_settings,'{}'::jsonb),now())
  ON CONFLICT(event_id) DO UPDATE SET event_type=excluded.event_type,registration_enabled=excluded.registration_enabled,admission_enabled=excluded.admission_enabled,entitlements_enabled=excluded.entitlements_enabled,memories_enabled=excluded.memories_enabled,settings=excluded.settings,updated_at=now();
  INSERT INTO public.audit_events(organization_id,event_id,actor_user_id,actor_type,action,subject_id)
    VALUES(v_event.organization_id,v_event.id,(SELECT auth.uid()),'user','event.settings.updated',v_event.id);
END; $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.submit_open_registration(
  p_event_id uuid, p_idempotency_key text, p_primary_email text, p_people jsonb
) RETURNS TABLE(registration_id uuid, registration_status public.open_registration_status, replayed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_event public.events%rowtype; v_config public.event_registration_configs%rowtype;
  v_id uuid; v_existing public.open_registrations%rowtype; v_status public.open_registration_status;
  v_email text := lower(btrim(coalesce(p_primary_email,''))); v_key_hash text;
  v_payload_hash text; v_requested integer; v_people integer := 0; v_reserved integer := 0;
  v_item jsonb; v_person_id uuid; v_slot integer := 0; v_answers jsonb;
BEGIN
  IF coalesce(p_idempotency_key,'') !~ '^[A-Za-z0-9_-]{32,128}$' THEN
    RAISE EXCEPTION 'A high-entropy idempotency key is required.' USING errcode = '22023';
  END IF;
  IF v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(v_email) > 320 THEN
    RAISE EXCEPTION 'Enter a valid primary email address.' USING errcode = '22023';
  END IF;
  IF jsonb_typeof(p_people) <> 'array' OR jsonb_array_length(p_people) < 1 OR jsonb_array_length(p_people) > 21 THEN
    RAISE EXCEPTION 'Registration must include one to twenty-one people.' USING errcode = '22023';
  END IF;
  v_key_hash := encode(extensions.digest(convert_to(p_idempotency_key,'UTF8'),'sha256'),'hex');
  v_payload_hash := encode(extensions.digest(convert_to(jsonb_build_object('email',v_email,'people',p_people)::text,'UTF8'),'sha256'),'hex');

  -- Lock order is event then registration; invitation issuance uses the same event row lock.
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'Registration is unavailable.' USING errcode = '22023'; END IF;
  SELECT * INTO v_existing FROM public.open_registrations r
    WHERE r.event_id = p_event_id AND r.idempotency_key_hash = v_key_hash;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.payload_hash <> v_payload_hash THEN RAISE EXCEPTION 'The idempotency key was already used for another request.' USING errcode = '22023'; END IF;
    RETURN QUERY SELECT v_existing.id, v_existing.status, true; RETURN;
  END IF;
  SELECT * INTO v_config FROM public.event_registration_configs c
    WHERE c.event_id = p_event_id AND c.is_current FOR SHARE;
  IF v_event.status NOT IN ('published','live') OR v_event.guest_mode <> 'rsvp'
    OR NOT EXISTS (SELECT 1 FROM public.event_settings s WHERE s.event_id=p_event_id AND s.registration_enabled)
    OR v_config.id IS NULL OR v_config.mode NOT IN ('open','approval')
    OR (v_config.opens_at IS NOT NULL AND v_config.opens_at > now())
    OR (v_config.closes_at IS NOT NULL AND v_config.closes_at < now())
    OR (v_event.rsvp_deadline IS NOT NULL AND v_event.rsvp_deadline < now()) THEN
    RAISE EXCEPTION 'This event is not accepting registrations.' USING errcode = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_people) p(value) WHERE jsonb_typeof(value) <> 'object' OR length(btrim(coalesce(value->>'name',''))) NOT BETWEEN 1 AND 120 OR coalesce(value->>'attendanceStatus','attending') NOT IN ('attending','declined','undecided')) THEN
    RAISE EXCEPTION 'Each person needs a name and valid attendance status.' USING errcode = '22023';
  END IF;
  SELECT count(*)::integer INTO v_requested FROM jsonb_array_elements(p_people) p(value)
    WHERE coalesce(value->>'attendanceStatus','attending') IN ('attending','undecided');
  v_people := jsonb_array_length(p_people);
  IF v_requested < 1 THEN RAISE EXCEPTION 'At least one person must be attending or undecided.' USING errcode = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.open_registrations r WHERE r.event_id=p_event_id AND lower(r.primary_email)=v_email AND r.status IN ('pending','confirmed','waitlisted')) THEN
    RAISE EXCEPTION 'A registration already exists for this email.' USING errcode = '23505';
  END IF;
  v_reserved := v_requested;
  IF v_config.mode = 'approval' OR v_config.approval_required THEN v_status := 'pending';
  ELSIF v_event.reserved_places + v_reserved <= v_event.capacity THEN v_status := 'confirmed';
  ELSIF v_config.waitlist_enabled THEN v_status := 'waitlisted'; v_reserved := 0;
  ELSE RAISE EXCEPTION 'Event capacity has been reached.' USING errcode = '23514'; END IF;
  IF v_status = 'pending' AND v_event.reserved_places + v_reserved > v_event.capacity THEN
    IF v_config.waitlist_enabled THEN v_status := 'waitlisted'; v_reserved := 0;
    ELSE RAISE EXCEPTION 'Event capacity has been reached.' USING errcode = '23514'; END IF;
  END IF;
  INSERT INTO public.open_registrations(event_id,config_id,status,primary_email,idempotency_key_hash,payload_hash,requested_places,reserved_places)
    VALUES(p_event_id,v_config.id,v_status,v_email,v_key_hash,v_payload_hash,v_requested,v_reserved) RETURNING id INTO v_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_people) LOOP
    v_slot := v_slot + 1;
    INSERT INTO public.open_registration_people(registration_id,event_id,slot,name,attendance_status)
      VALUES(v_id,p_event_id,v_slot,btrim(v_item->>'name'),coalesce(v_item->>'attendanceStatus','attending')) RETURNING id INTO v_person_id;
    v_answers := coalesce(v_item->'answers','{}'::jsonb);
    PERFORM private.validate_registration_answers(v_config.id,v_answers);
    INSERT INTO public.registration_answers(registration_id,person_id,question_id,config_id,event_id,answer)
      SELECT v_id,v_person_id,q.id,v_config.id,p_event_id,v_answers->q.stable_key
      FROM public.event_registration_questions q
      WHERE q.config_id=v_config.id AND v_answers ? q.stable_key;
  END LOOP;
  UPDATE public.events SET reserved_places=reserved_places+v_reserved WHERE id=p_event_id;
  INSERT INTO public.registration_history(registration_id,from_status,to_status,actor_type)
    VALUES(v_id,NULL,v_status,'guest');
  INSERT INTO public.audit_events(organization_id,event_id,actor_type,action,subject_id,metadata)
    VALUES(v_event.organization_id,p_event_id,'guest','registration.submitted',v_id,jsonb_build_object('status',v_status,'people',v_people,'reservedPlaces',v_reserved));
  INSERT INTO public.notification_outbox(organization_id,event_id,aggregate_id,aggregate_version,kind,payload)
    VALUES(v_event.organization_id,p_event_id,v_id,1,'registration.submitted',jsonb_build_object('registrationId',v_id,'status',v_status));
  RETURN QUERY SELECT v_id,v_status,false;
END; $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.cancel_open_registration(p_event_id uuid,p_idempotency_key text)
RETURNS public.open_registration_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_event public.events%rowtype; v_reg public.open_registrations%rowtype; v_hash text;
BEGIN
  IF coalesce(p_idempotency_key,'') !~ '^[A-Za-z0-9_-]{32,128}$' THEN RAISE EXCEPTION 'Registration is unavailable.' USING errcode='22023'; END IF;
  v_hash:=encode(extensions.digest(convert_to(p_idempotency_key,'UTF8'),'sha256'),'hex');
  SELECT * INTO v_event FROM public.events WHERE id=p_event_id FOR UPDATE;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'Registration is unavailable.' USING errcode='22023'; END IF;
  SELECT * INTO v_reg FROM public.open_registrations WHERE event_id=p_event_id AND idempotency_key_hash=v_hash FOR UPDATE;
  IF v_reg.id IS NULL THEN RAISE EXCEPTION 'Registration is unavailable.' USING errcode='22023'; END IF;
  IF v_reg.status='cancelled' THEN RETURN v_reg.status; END IF;
  IF v_reg.status NOT IN ('pending','confirmed','waitlisted') THEN RAISE EXCEPTION 'Registration is unavailable.' USING errcode='22023'; END IF;
  UPDATE public.events SET reserved_places=reserved_places-v_reg.reserved_places WHERE id=p_event_id;
  UPDATE public.open_registrations SET status='cancelled',reserved_places=0,status_version=status_version+1,updated_at=now() WHERE id=v_reg.id;
  INSERT INTO public.registration_history(registration_id,from_status,to_status,actor_type,reason)
    VALUES(v_reg.id,v_reg.status,'cancelled','guest','Guest cancellation');
  INSERT INTO public.audit_events(organization_id,event_id,actor_type,action,subject_id,metadata)
    VALUES(v_event.organization_id,p_event_id,'guest','registration.cancelled',v_reg.id,jsonb_build_object('source','guest_capability'));
  INSERT INTO public.notification_outbox(organization_id,event_id,aggregate_id,aggregate_version,kind,payload)
    VALUES(v_event.organization_id,p_event_id,v_reg.id,v_reg.status_version+1,'registration.cancelled',jsonb_build_object('registrationId',v_reg.id,'status','cancelled'));
  RETURN 'cancelled';
END; $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.transition_open_registration(p_registration_id uuid,p_action text,p_reason text DEFAULT NULL)
RETURNS public.open_registration_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_reg public.open_registrations%rowtype; v_event public.events%rowtype; v_to public.open_registration_status; v_delta integer := 0; v_reason text := btrim(coalesce(p_reason,''));
BEGIN
  SELECT e.* INTO v_event FROM public.events e JOIN public.open_registrations r ON r.event_id=e.id WHERE r.id=p_registration_id;
  IF v_event.id IS NULL OR NOT private.can_manage_event(v_event.id) THEN RAISE EXCEPTION 'You do not have permission to manage this registration.' USING errcode='42501'; END IF;
  SELECT * INTO v_event FROM public.events WHERE id=v_event.id FOR UPDATE;
  SELECT * INTO v_reg FROM public.open_registrations WHERE id=p_registration_id FOR UPDATE;
  IF p_action NOT IN ('approve','reject','cancel','promote') THEN RAISE EXCEPTION 'Unsupported registration transition.' USING errcode='22023'; END IF;
  IF p_action='approve' AND v_reg.status='pending' THEN v_to:='confirmed';
  ELSIF p_action='promote' AND v_reg.status='waitlisted' THEN v_to:='confirmed';
  ELSIF p_action='reject' AND v_reg.status IN ('pending','waitlisted') THEN v_to:='declined';
  ELSIF p_action='cancel' AND v_reg.status IN ('pending','confirmed','waitlisted') THEN v_to:='cancelled';
  ELSE RAISE EXCEPTION 'This registration cannot make that transition.' USING errcode='22023'; END IF;
  IF p_action IN ('approve','promote') THEN
    IF v_reg.reserved_places=0 AND v_event.reserved_places+v_reg.requested_places>v_event.capacity THEN RAISE EXCEPTION 'There is not enough capacity to confirm this registration.' USING errcode='23514'; END IF;
    IF v_reg.reserved_places=0 THEN v_delta:=v_reg.requested_places; END IF;
  ELSIF p_action IN ('reject','cancel') THEN v_delta := -v_reg.reserved_places;
  END IF;
  IF length(v_reason)>500 THEN RAISE EXCEPTION 'Reason is too long.' USING errcode='22023'; END IF;
  UPDATE public.events SET reserved_places=reserved_places+v_delta WHERE id=v_event.id;
  UPDATE public.open_registrations SET status=v_to,reserved_places=greatest(0,reserved_places+v_delta),status_version=status_version+1,updated_at=now() WHERE id=v_reg.id;
  INSERT INTO public.registration_history(registration_id,from_status,to_status,actor_user_id,actor_type,reason)
    VALUES(v_reg.id,v_reg.status,v_to,(SELECT auth.uid()),'user',nullif(v_reason,''));
  INSERT INTO public.audit_events(organization_id,event_id,actor_user_id,actor_type,action,subject_id,metadata)
    VALUES(v_event.organization_id,v_event.id,(SELECT auth.uid()),'user','registration.'||p_action,v_reg.id,jsonb_build_object('from',v_reg.status,'to',v_to,'reason',nullif(v_reason,'')));
  INSERT INTO public.notification_outbox(organization_id,event_id,aggregate_id,aggregate_version,kind,payload)
    VALUES(v_event.organization_id,v_event.id,v_reg.id,v_reg.status_version+1,'registration.'||p_action,jsonb_build_object('registrationId',v_reg.id,'status',v_to));
  RETURN v_to;
END; $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.save_event_registration_config(
  p_event_id uuid, p_mode public.registration_mode, p_approval_required boolean,
  p_waitlist_enabled boolean, p_opens_at timestamptz, p_closes_at timestamptz,
  p_settings jsonb, p_questions jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_event public.events%rowtype; v_current public.event_registration_configs%rowtype; v_id uuid; v_version integer; v_question jsonb; v_position integer := 0; v_key text;
BEGIN
  IF NOT private.can_manage_event(p_event_id) THEN RAISE EXCEPTION 'You do not have permission to edit registration for this event.' USING errcode='42501'; END IF;
  IF p_closes_at IS NOT NULL AND p_opens_at IS NOT NULL AND p_closes_at <= p_opens_at THEN RAISE EXCEPTION 'Registration close time must be after open time.' USING errcode='22023'; END IF;
  IF jsonb_typeof(coalesce(p_settings,'{}'::jsonb)) <> 'object' OR jsonb_typeof(coalesce(p_questions,'[]'::jsonb)) <> 'array' OR jsonb_array_length(coalesce(p_questions,'[]'::jsonb)) > 100 THEN RAISE EXCEPTION 'Registration settings or questions have an invalid format.' USING errcode='22023'; END IF;
  SELECT * INTO v_event FROM public.events WHERE id=p_event_id FOR UPDATE;
  SELECT * INTO v_current FROM public.event_registration_configs WHERE event_id=p_event_id AND is_current FOR UPDATE;
  SELECT coalesce(max(version),0)+1 INTO v_version FROM public.event_registration_configs WHERE event_id=p_event_id;
  UPDATE public.event_registration_configs SET is_current=false WHERE id=v_current.id;
  INSERT INTO public.event_registration_configs(event_id,version,mode,approval_required,waitlist_enabled,opens_at,closes_at,settings,is_current,created_by)
    VALUES(p_event_id,v_version,p_mode,coalesce(p_approval_required,false),coalesce(p_waitlist_enabled,false),p_opens_at,p_closes_at,coalesce(p_settings,'{}'::jsonb),true,(SELECT auth.uid())) RETURNING id INTO v_id;
  FOR v_question IN SELECT value FROM jsonb_array_elements(coalesce(p_questions,'[]'::jsonb)) LOOP
    v_position:=v_position+1; v_key:=v_question->>'key';
    IF v_key !~ '^[a-z][a-z0-9_]{1,63}$' OR length(btrim(coalesce(v_question->>'label',''))) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Question key or label is invalid.' USING errcode='22023'; END IF;
    IF jsonb_typeof(coalesce(v_question->'options','[]'::jsonb))<>'array' OR jsonb_typeof(coalesce(v_question->'validation','{}'::jsonb))<>'object' OR (v_question->'visibility' IS NOT NULL AND jsonb_typeof(v_question->'visibility')<>'object') THEN RAISE EXCEPTION 'Question options, validation, or visibility has an invalid format.' USING errcode='22023'; END IF;
    INSERT INTO public.event_registration_questions(config_id,event_id,stable_key,label,question_type,position,required,options,validation,visibility)
      VALUES(v_id,p_event_id,v_key,btrim(v_question->>'label'),(v_question->>'type')::public.registration_question_type,v_position,coalesce((v_question->>'required')::boolean,false),coalesce(v_question->'options','[]'::jsonb),coalesce(v_question->'validation','{}'::jsonb),v_question->'visibility');
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM public.event_registration_questions q
    WHERE q.config_id=v_id AND q.visibility IS NOT NULL AND (
      NOT EXISTS (SELECT 1 FROM public.event_registration_questions parent WHERE parent.config_id=v_id AND parent.stable_key=q.visibility->>'questionKey')
      OR (q.visibility->>'operator') IS NOT NULL AND q.visibility->>'operator'<>'equals'
    )
  ) THEN RAISE EXCEPTION 'Conditional question references an unknown question key.' USING errcode='22023'; END IF;
  INSERT INTO public.audit_events(organization_id,event_id,actor_user_id,actor_type,action,subject_id,metadata)
    VALUES(v_event.organization_id,p_event_id,(SELECT auth.uid()),'user','registration.config.created',v_id,jsonb_build_object('version',v_version,'mode',p_mode,'questionCount',v_position));
  RETURN v_id;
END; $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION private.pin_invitation_registration_config()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.registration_config_id IS NULL THEN
    SELECT id INTO NEW.registration_config_id FROM public.event_registration_configs
      WHERE event_id=NEW.event_id AND is_current;
  END IF;
  RETURN NEW;
END; $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.initialize_event_registration_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.event_settings(event_id,organization_id) VALUES(NEW.id,NEW.organization_id) ON CONFLICT(event_id) DO NOTHING;
  INSERT INTO public.event_registration_configs(event_id,version,mode,is_current) VALUES(NEW.id,1,'private_invitation',true) ON CONFLICT(event_id,version) DO NOTHING;
  RETURN NEW;
END; $$;--> statement-breakpoint
CREATE TRIGGER events_initialize_registration_defaults
  AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION private.initialize_event_registration_defaults();--> statement-breakpoint
CREATE TRIGGER invitations_pin_registration_config
  BEFORE INSERT ON public.invitations FOR EACH ROW EXECUTE FUNCTION private.pin_invitation_registration_config();--> statement-breakpoint

CREATE OR REPLACE FUNCTION private.guard_legacy_private_rsvp_questions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_config_id uuid;
BEGIN
  IF current_setting('momentus.rsvp_answers_rpc',true)='true' THEN RETURN NEW; END IF;
  SELECT registration_config_id INTO v_config_id FROM public.invitations WHERE id=NEW.invitation_id;
  IF EXISTS (SELECT 1 FROM public.event_registration_questions WHERE config_id=v_config_id AND required) THEN
    RAISE EXCEPTION 'This registration form requires the current answer-aware RSVP endpoint.' USING errcode='22023';
  END IF;
  RETURN NEW;
END; $$;--> statement-breakpoint
CREATE TRIGGER attendees_require_versioned_form_answers
  BEFORE INSERT ON public.attendees FOR EACH ROW EXECUTE FUNCTION private.guard_legacy_private_rsvp_questions();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.submit_public_rsvp_v2(
  p_token text,p_primary_email text,p_attendees jsonb,p_answers jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_invitation public.invitations%rowtype; v_answer_row jsonb; v_attendee jsonb; v_slot integer; v_answers jsonb; v_attendee_id uuid;
BEGIN
  IF p_token IS NULL OR length(p_token)<>64 THEN RAISE EXCEPTION 'This invitation link is invalid or unavailable.' USING errcode='22023'; END IF;
  SELECT * INTO v_invitation FROM public.invitations WHERE token_hash=encode(extensions.digest(convert_to(p_token,'UTF8'),'sha256'),'hex') AND revoked_at IS NULL FOR UPDATE;
  IF v_invitation.id IS NULL OR v_invitation.registration_config_id IS NULL THEN RAISE EXCEPTION 'This invitation link is invalid or unavailable.' USING errcode='22023'; END IF;
  IF jsonb_typeof(coalesce(p_answers,'[]'::jsonb))<>'array' OR jsonb_array_length(coalesce(p_answers,'[]'::jsonb))<>jsonb_array_length(p_attendees) THEN RAISE EXCEPTION 'Provide answers for each attendee.' USING errcode='22023'; END IF;
  FOR v_answer_row IN SELECT value FROM jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) LOOP
    IF jsonb_typeof(v_answer_row)<>'object' OR coalesce(v_answer_row->>'slot','') !~ '^\d+$' THEN RAISE EXCEPTION 'Attendee answer entries require a numeric slot.' USING errcode='22023'; END IF;
    v_slot:=(v_answer_row->>'slot')::integer; v_answers:=coalesce(v_answer_row->'answers','{}'::jsonb);
    IF v_slot<1 OR v_slot>jsonb_array_length(p_attendees) OR (SELECT count(*) FROM jsonb_array_elements(p_answers) other(value) WHERE (other.value->>'slot')::integer=v_slot)>1 THEN RAISE EXCEPTION 'Attendee answer slots must be unique and in range.' USING errcode='22023'; END IF;
    PERFORM private.validate_registration_answers(v_invitation.registration_config_id,v_answers);
  END LOOP;
  PERFORM set_config('momentus.rsvp_answers_rpc','true',true);
  PERFORM public.submit_public_rsvp(p_token,p_primary_email,p_attendees);
  PERFORM set_config('momentus.rsvp_answers_rpc','false',true);
  FOR v_answer_row IN SELECT value FROM jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) LOOP
    v_slot:=(v_answer_row->>'slot')::integer; v_answers:=coalesce(v_answer_row->'answers','{}'::jsonb);
    SELECT id INTO v_attendee_id FROM public.attendees WHERE invitation_id=v_invitation.id AND slot=v_slot;
    INSERT INTO public.private_registration_answers(attendee_id,invitation_id,event_id,config_id,question_id,answer)
      SELECT v_attendee_id,v_invitation.id,v_invitation.event_id,v_invitation.registration_config_id,q.id,v_answers->q.stable_key
      FROM public.event_registration_questions q WHERE q.config_id=v_invitation.registration_config_id AND v_answers ? q.stable_key;
  END LOOP;
END; $$;--> statement-breakpoint

REVOKE ALL ON FUNCTION private.validate_registration_answers(uuid,jsonb) FROM PUBLIC,anon,authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION private.pin_invitation_registration_config() FROM PUBLIC,anon,authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION private.initialize_event_registration_defaults() FROM PUBLIC,anon,authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION private.guard_legacy_private_rsvp_questions() FROM PUBLIC,anon,authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.save_event_registration_config(uuid,public.registration_mode,boolean,boolean,timestamptz,timestamptz,jsonb,jsonb) FROM PUBLIC,anon;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.submit_public_rsvp_v2(text,text,jsonb,jsonb) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.get_open_registration_form(uuid) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.save_client_profile(uuid,text,text,text,text,text,public.client_status) FROM PUBLIC,anon;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.save_event_settings(uuid,public.event_type,boolean,boolean,boolean,boolean,jsonb) FROM PUBLIC,anon;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.submit_open_registration(uuid,text,text,jsonb) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.cancel_open_registration(uuid,text) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.transition_open_registration(uuid,text,text) FROM PUBLIC,anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.get_open_registration_form(uuid) TO anon,authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.save_client_profile(uuid,text,text,text,text,text,public.client_status) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.save_event_settings(uuid,public.event_type,boolean,boolean,boolean,boolean,jsonb) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.submit_open_registration(uuid,text,text,jsonb) TO anon,authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.cancel_open_registration(uuid,text) TO anon,authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.transition_open_registration(uuid,text,text) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.save_event_registration_config(uuid,public.registration_mode,boolean,boolean,timestamptz,timestamptz,jsonb,jsonb) TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.submit_public_rsvp_v2(text,text,jsonb,jsonb) TO anon,authenticated;--> statement-breakpoint
CREATE UNIQUE INDEX "private_registration_answers_attendee_question_unique" ON "private_registration_answers" USING btree ("attendee_id","question_id");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_registration_config_event_fk" FOREIGN KEY ("registration_config_id","event_id") REFERENCES "public"."event_registration_configs"("id","event_id") ON DELETE restrict ON UPDATE no action;
