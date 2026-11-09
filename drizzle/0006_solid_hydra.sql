CREATE TYPE "public"."microsite_status" AS ENUM('draft', 'published', 'unpublished');--> statement-breakpoint
CREATE TABLE "microsite_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"microsite_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"project_data" jsonb NOT NULL,
	"published_by" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "microsite_versions_number_valid" CHECK ("microsite_versions"."version_number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "microsites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"public_slug" text NOT NULL,
	"status" "microsite_status" DEFAULT 'draft' NOT NULL,
	"draft_project" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"draft_revision" integer DEFAULT 0 NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"published_revision" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "microsites_revision_valid" CHECK ("microsites"."draft_revision" >= 0 AND ("microsites"."published_revision" IS NULL OR "microsites"."published_revision" >= 1))
);
--> statement-breakpoint
ALTER TABLE "microsite_versions" ADD CONSTRAINT "microsite_versions_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsites" ADD CONSTRAINT "microsites_event_organization_fk" FOREIGN KEY ("event_id","organization_id") REFERENCES "public"."events"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "microsite_versions_number_unique" ON "microsite_versions" USING btree ("microsite_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "microsites_event_unique" ON "microsites" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "microsites_public_slug_unique" ON "microsites" USING btree ("public_slug");
--> statement-breakpoint
ALTER TABLE public.microsites ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.microsite_versions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

GRANT SELECT ON public.microsites, public.microsite_versions TO authenticated;
--> statement-breakpoint

CREATE POLICY microsites_event_manager_read ON public.microsites
  FOR SELECT TO authenticated
  USING (private.can_manage_event(event_id));
--> statement-breakpoint

CREATE POLICY microsite_versions_event_manager_read ON public.microsite_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.microsites m
      WHERE m.id = microsite_id
        AND private.can_manage_event(m.event_id)
    )
  );
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.ensure_event_microsite(p_event_id uuid)
RETURNS TABLE (
  microsite_id uuid,
  organization_id uuid,
  event_id uuid,
  public_slug text,
  status public.microsite_status,
  draft_project jsonb,
  draft_revision integer,
  published_revision integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event public.events%rowtype;
  v_site public.microsites%rowtype;
  v_created boolean := false;
BEGIN
  IF NOT private.can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'You do not have permission to edit this event microsite.' USING errcode = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = (SELECT auth.uid()) AND u.email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Verify your email before editing an event microsite.' USING errcode = '42501';
  END IF;

  SELECT * INTO v_event FROM public.events e WHERE e.id = p_event_id;
  INSERT INTO public.microsites (organization_id, event_id, public_slug)
  VALUES (
    v_event.organization_id,
    v_event.id,
    encode(extensions.gen_random_bytes(16), 'hex')
  )
  ON CONFLICT (event_id) DO NOTHING
  RETURNING * INTO v_site;

  IF v_site.id IS NOT NULL THEN
    v_created := true;
  ELSE
    SELECT * INTO v_site FROM public.microsites m WHERE m.event_id = p_event_id;
  END IF;

  IF v_created THEN
    INSERT INTO public.audit_events (
      organization_id, event_id, actor_user_id, actor_type, action, subject_id
    ) VALUES (
      v_site.organization_id, v_site.event_id, (SELECT auth.uid()),
      'user', 'microsite.created', v_site.id
    );
  END IF;

  RETURN QUERY SELECT
    v_site.id, v_site.organization_id, v_site.event_id, v_site.public_slug,
    v_site.status, v_site.draft_project, v_site.draft_revision,
    v_site.published_revision;
END;
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.save_microsite_draft(
  p_event_id uuid,
  p_project_data jsonb,
  p_expected_revision integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_site public.microsites%rowtype;
  v_next_revision integer;
  v_project_text text;
BEGIN
  IF p_expected_revision IS NULL OR p_expected_revision < 0 THEN
    RAISE EXCEPTION 'Invalid draft revision.' USING errcode = '22023';
  END IF;
  IF jsonb_typeof(p_project_data) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Designer project must be a JSON object.' USING errcode = '22023';
  END IF;
  v_project_text := p_project_data::text;
  IF octet_length(v_project_text) > 2097152 THEN
    RAISE EXCEPTION 'Designer project exceeds the 2 MB draft limit.' USING errcode = '22023';
  END IF;
  IF v_project_text ~* '"(script(-export)?|on[a-z]+|srcdoc)"\s*:|<\s*(script|svg|math|form|base|meta|link|iframe|object|embed)\b|\bon[a-z]+\s*=|javascript\s*:|vbscript\s*:|data:text/html|url\s*\(|@import|expression\s*\(' THEN
    RAISE EXCEPTION 'Scripts, active HTML, and external CSS resources are not allowed in drafts.' USING errcode = '22023';
  END IF;

  SELECT * INTO v_site
  FROM public.microsites m
  WHERE m.event_id = p_event_id
  FOR UPDATE;

  IF v_site.id IS NULL OR NOT private.can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'You do not have permission to edit this event microsite.' USING errcode = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = (SELECT auth.uid()) AND u.email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Verify your email before editing an event microsite.' USING errcode = '42501';
  END IF;
  IF v_site.draft_revision <> p_expected_revision THEN
    RAISE EXCEPTION 'This draft changed in another session. Reload the latest draft before saving.' USING errcode = '40001';
  END IF;

  v_next_revision := v_site.draft_revision + 1;
  UPDATE public.microsites
  SET draft_project = p_project_data,
      draft_revision = v_next_revision,
      updated_by = (SELECT auth.uid()),
      updated_at = now()
  WHERE id = v_site.id;

  RETURN v_next_revision;
END;
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.ensure_event_microsite(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.save_microsite_draft(uuid, jsonb, integer) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.ensure_event_microsite(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.save_microsite_draft(uuid, jsonb, integer) TO authenticated;
