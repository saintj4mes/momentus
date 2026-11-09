ALTER TABLE "nfc_cards" DROP CONSTRAINT "nfc_cards_assignment_valid";--> statement-breakpoint
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_terminal_timestamp_valid" CHECK ((
        ("nfc_cards"."status" = 'replaced' AND "nfc_cards"."replaced_at" IS NOT NULL)
        OR ("nfc_cards"."status" <> 'replaced' AND "nfc_cards"."replaced_at" IS NULL)
      ) AND (
        ("nfc_cards"."status" = 'revoked' AND "nfc_cards"."revoked_at" IS NOT NULL)
        OR ("nfc_cards"."status" <> 'revoked' AND "nfc_cards"."revoked_at" IS NULL)
      ));--> statement-breakpoint
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_assignment_valid" CHECK ((
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
        AND "nfc_cards"."credential_hash" IS NOT NULL
        AND "nfc_cards"."assigned_at" IS NOT NULL
      ));