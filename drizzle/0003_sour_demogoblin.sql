CREATE TYPE "public"."event_guest_mode" AS ENUM('rsvp', 'meal_booth', 'album');--> statement-breakpoint
CREATE TYPE "public"."nfc_card_status" AS ENUM('unassigned', 'active', 'replaced', 'revoked');--> statement-breakpoint
CREATE TABLE "nfc_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"event_id" uuid,
	"invitation_id" uuid,
	"label" text NOT NULL,
	"credential_hash" text,
	"status" "nfc_card_status" DEFAULT 'unassigned' NOT NULL,
	"replaced_by_id" uuid,
	"assigned_at" timestamp with time zone,
	"replaced_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nfc_cards_assignment_valid" CHECK ((
        "nfc_cards"."status" = 'unassigned'
        AND "nfc_cards"."organization_id" IS NULL
        AND "nfc_cards"."event_id" IS NULL
        AND "nfc_cards"."invitation_id" IS NULL
        AND "nfc_cards"."credential_hash" IS NULL
      ) OR (
        "nfc_cards"."status" <> 'unassigned'
        AND "nfc_cards"."organization_id" IS NOT NULL
        AND "nfc_cards"."event_id" IS NOT NULL
        AND "nfc_cards"."invitation_id" IS NOT NULL
      ))
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "guest_mode" "event_guest_mode" DEFAULT 'rsvp' NOT NULL;--> statement-breakpoint
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_event_organization_fk" FOREIGN KEY ("event_id","organization_id") REFERENCES "public"."events"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_invitation_event_fk" FOREIGN KEY ("invitation_id","event_id") REFERENCES "public"."invitations"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_replaced_by_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "public"."nfc_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nfc_cards_credential_hash_unique" ON "nfc_cards" USING btree ("credential_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "nfc_cards_one_active_per_invitation_unique" ON "nfc_cards" USING btree ("invitation_id") WHERE "nfc_cards"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "events_id_organization_unique" ON "events" USING btree ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_id_event_unique" ON "invitations" USING btree ("id","event_id");