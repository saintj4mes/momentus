CREATE TYPE "public"."client_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('wedding', 'birthday', 'corporate', 'concert', 'fun_run', 'conference', 'community', 'custom');--> statement-breakpoint
CREATE TYPE "public"."open_registration_status" AS ENUM('pending', 'confirmed', 'declined', 'waitlisted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."registration_mode" AS ENUM('private_invitation', 'open', 'approval');--> statement-breakpoint
CREATE TYPE "public"."registration_question_type" AS ENUM('short_text', 'long_text', 'email', 'phone', 'number', 'date', 'dropdown', 'radio', 'checkbox', 'multi_select', 'consent');--> statement-breakpoint
CREATE TABLE "client_profiles" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"category" text DEFAULT 'unclassified' NOT NULL,
	"primary_contact_name" text,
	"primary_contact_email" text,
	"primary_contact_phone" text,
	"details" text DEFAULT '' NOT NULL,
	"status" "client_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_profiles_contact_email_valid" CHECK ("client_profiles"."primary_contact_email" is null OR length("client_profiles"."primary_contact_email") <= 320),
	CONSTRAINT "client_profiles_contact_name_valid" CHECK ("client_profiles"."primary_contact_name" is null OR length("client_profiles"."primary_contact_name") <= 160)
);
--> statement-breakpoint
CREATE TABLE "event_registration_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"mode" "registration_mode" DEFAULT 'private_invitation' NOT NULL,
	"approval_required" boolean DEFAULT false NOT NULL,
	"waitlist_enabled" boolean DEFAULT false NOT NULL,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_registration_configs_version_valid" CHECK ("event_registration_configs"."version" >= 1),
	CONSTRAINT "event_registration_configs_window_valid" CHECK ("event_registration_configs"."closes_at" IS NULL OR "event_registration_configs"."opens_at" IS NULL OR "event_registration_configs"."closes_at" > "event_registration_configs"."opens_at")
);
--> statement-breakpoint
CREATE TABLE "event_registration_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"stable_key" text NOT NULL,
	"label" text NOT NULL,
	"question_type" "registration_question_type" NOT NULL,
	"position" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"validation" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visibility" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_registration_questions_position_valid" CHECK ("event_registration_questions"."position" >= 0),
	CONSTRAINT "event_registration_questions_key_valid" CHECK ("event_registration_questions"."stable_key" ~ '^[a-z][a-z0-9_]{1,63}$'),
	CONSTRAINT "event_registration_questions_label_valid" CHECK (length(btrim("event_registration_questions"."label")) between 1 and 160)
);
--> statement-breakpoint
CREATE TABLE "event_settings" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" "event_type" DEFAULT 'custom' NOT NULL,
	"registration_enabled" boolean DEFAULT true NOT NULL,
	"admission_enabled" boolean DEFAULT false NOT NULL,
	"entitlements_enabled" boolean DEFAULT false NOT NULL,
	"memories_enabled" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "open_registration_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"slot" integer NOT NULL,
	"name" text NOT NULL,
	"attendance_status" text DEFAULT 'attending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "open_registration_people_slot_valid" CHECK ("open_registration_people"."slot" between 1 and 21),
	CONSTRAINT "open_registration_people_name_valid" CHECK (length(btrim("open_registration_people"."name")) between 1 and 120),
	CONSTRAINT "open_registration_people_attendance_valid" CHECK ("open_registration_people"."attendance_status" in ('attending', 'declined', 'undecided'))
);
--> statement-breakpoint
CREATE TABLE "open_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"config_id" uuid NOT NULL,
	"status" "open_registration_status" NOT NULL,
	"primary_email" text NOT NULL,
	"idempotency_key_hash" text NOT NULL,
	"payload_hash" text NOT NULL,
	"requested_places" integer NOT NULL,
	"reserved_places" integer DEFAULT 0 NOT NULL,
	"status_version" integer DEFAULT 1 NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "open_registrations_places_valid" CHECK ("open_registrations"."requested_places" >= 1 AND "open_registrations"."reserved_places" >= 0 AND "open_registrations"."reserved_places" <= "open_registrations"."requested_places"),
	CONSTRAINT "open_registrations_version_valid" CHECK ("open_registrations"."status_version" >= 1),
	CONSTRAINT "open_registrations_idempotency_hash_valid" CHECK ("open_registrations"."idempotency_key_hash" ~ '^[0-9a-f]{64}$' AND "open_registrations"."payload_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "registration_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"config_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"from_status" "open_registration_status",
	"to_status" "open_registration_status" NOT NULL,
	"actor_user_id" uuid,
	"actor_type" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_configs" ADD CONSTRAINT "event_registration_configs_event_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Composite unique indexes are required as targets of event-scoped foreign keys below.
CREATE UNIQUE INDEX "event_registration_configs_id_event_unique" ON "event_registration_configs" USING btree ("id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_questions_id_event_unique" ON "event_registration_questions" USING btree ("id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_questions_id_config_unique" ON "event_registration_questions" USING btree ("id","config_id");--> statement-breakpoint
CREATE UNIQUE INDEX "open_registrations_id_event_unique" ON "open_registrations" USING btree ("id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "open_registration_people_id_event_unique" ON "open_registration_people" USING btree ("id","event_id");--> statement-breakpoint
ALTER TABLE "event_registration_questions" ADD CONSTRAINT "event_registration_questions_config_event_fk" FOREIGN KEY ("config_id","event_id") REFERENCES "public"."event_registration_configs"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_settings" ADD CONSTRAINT "event_settings_event_organization_fk" FOREIGN KEY ("event_id","organization_id") REFERENCES "public"."events"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_registration_people" ADD CONSTRAINT "open_registration_people_registration_event_fk" FOREIGN KEY ("registration_id","event_id") REFERENCES "public"."open_registrations"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_registrations" ADD CONSTRAINT "open_registrations_config_event_fk" FOREIGN KEY ("config_id","event_id") REFERENCES "public"."event_registration_configs"("id","event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_person_event_fk" FOREIGN KEY ("person_id","event_id") REFERENCES "public"."open_registration_people"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_registration_event_fk" FOREIGN KEY ("registration_id","event_id") REFERENCES "public"."open_registrations"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_question_event_fk" FOREIGN KEY ("question_id","event_id") REFERENCES "public"."event_registration_questions"("id","event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_question_config_fk" FOREIGN KEY ("question_id","config_id") REFERENCES "public"."event_registration_questions"("id","config_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_config_event_fk" FOREIGN KEY ("config_id","event_id") REFERENCES "public"."event_registration_configs"("id","event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_history" ADD CONSTRAINT "registration_history_registration_id_open_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."open_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_configs_event_version_unique" ON "event_registration_configs" USING btree ("event_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_configs_one_current_unique" ON "event_registration_configs" USING btree ("event_id") WHERE "event_registration_configs"."is_current";--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_questions_key_unique" ON "event_registration_questions" USING btree ("config_id","stable_key");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_questions_position_unique" ON "event_registration_questions" USING btree ("config_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "open_registration_people_slot_unique" ON "open_registration_people" USING btree ("registration_id","slot");--> statement-breakpoint
CREATE UNIQUE INDEX "open_registrations_event_idempotency_unique" ON "open_registrations" USING btree ("event_id","idempotency_key_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "open_registrations_event_active_email_unique" ON "open_registrations" USING btree ("event_id",lower("primary_email")) WHERE "open_registrations"."status" in ('pending', 'confirmed', 'waitlisted');--> statement-breakpoint
CREATE UNIQUE INDEX "registration_answers_person_question_unique" ON "registration_answers" USING btree ("person_id","question_id");
