# Batch 5B — Database Design and Development Readiness

Status: migration authored for review only. No connection was made and no migration was applied.

## Environment and safety boundary

Drizzle loads `dotenv/config`, which reads the ignored project-root `.env` by default. `.env.example` is a placeholder reference only and is not the active configuration. Never print connection strings or secret values. The configured URL identifies project ref `zktyesiawrwfybcllnkr`, host `db.zktyesiawrwfybcllnkr.supabase.co`, database `postgres`; these values do not prove that the project is isolated development or contains synthetic-only data. No database connection was attempted. The local Drizzle journal has migrations 0000–0009; the remote history is unknown. Supabase CLI, `psql`, and Docker were not found in PATH.

## Existing model preserved

`organizations` and `organization_memberships` remain the tenant/client boundary. Existing `events` retain lifecycle (`event_status`), guest experience (`event_guest_mode`), capacity, and `reserved_places`. `invitations` remain the private RSVP/NFC credential record (hashed token, companion allowance, allocated places); `attendees` remain individual guests with independent attendance/check-in. NFC cards, audit events, notification outbox, and microsite draft/version records are unchanged. Existing private RSVP RPCs remain in place; the new answer-aware private RPC is additive.

The migration backfills one descriptive client profile and one independent event-settings row per existing organization/event, plus a version 1 **private invitation** registration configuration per existing event. Existing invitation rows are pinned to that config. The legacy three-argument RSVP RPC is blocked by a trigger from submitting against a config with required custom questions; it remains compatible for the backfilled form with no custom required questions. New forms with answer requirements use `submit_public_rsvp_v2`.

## Additive schema

| Table/type | Purpose and key constraints |
|---|---|
| `client_profiles` / `client_status` | Optional descriptive metadata keyed to organization; contact fields grant no authorization. |
| `event_settings` / `event_type` | Per-event category, independent service switches, bounded JSON settings; composite event/organization FK. |
| `event_registration_configs` / `registration_mode` | Immutable-in-use versioned form rules, one current version per event, open/close window, approval and waitlist rules. |
| `event_registration_questions` / `registration_question_type` | Stable key, label, order, required/options/validation/visibility JSON; unique key and position within a config. |
| `open_registrations` / `open_registration_status` | Event/config scoped open submissions, payload and idempotency hashes, requested/reserved headcount, versioned status; unique event/key and active email. |
| `open_registration_people` | Individual attendees and attendance response per registration. |
| `registration_answers` | One answer per open-registration person and versioned question. |
| `private_registration_answers` | One answer per existing attendee and invitation/config question; existing attendee rows remain canonical. |
| `registration_history` | Append-only status transition history for open registrations. |

Composite foreign keys prevent cross-event joins between registrations, people, answers, questions, invitation, and config. Old form versions are retained while referenced. Client and event service data is additive; the existing event lifecycle and guest-mode fields are not reinterpreted.

## Transaction and concurrency design

- Private invitation creation already locks its event row and increments `events.reserved_places` by the full invitation allowance. `submit_open_registration` uses the **same event-row lock** before checking capacity or writing. This serializes open submissions with invitation issuance and uses one capacity counter. This assumes all capacity-writing code follows that same lock protocol.
- An open submission hashes the idempotency key and normalized request payload. After acquiring the event lock, a matching key/payload returns the prior registration; the same key with a different payload is rejected. The unique index is a second guard. Active duplicate email is separately rejected.
- The entire submission (registration, people, answers, capacity change, history, audit row, and outbox row) runs in the RPC transaction. Pending approvals reserve available headcount. A waitlisted registration reserves zero; promotion checks and reserves capacity under the event lock. Reject/cancel releases exactly the saved reservation. PostgreSQL transaction rollback prevents partial reservation or audit/outbox writes.
- `transition_open_registration` locks the event before its registration, matching the submission lock order. Allowed transitions are pending→confirmed, pending→declined, pending/confirmed/waitlisted→cancelled, and waitlisted→confirmed. Promotion and approval fail atomically if capacity is no longer available.
- Private RSVP remains one-time and invitation-locked in the existing function. `submit_public_rsvp_v2` validates per-slot answer maps, sets a transaction-local flag only while invoking the legacy atomic attendee insert, then writes private answers in the same transaction. A trigger prevents the older RPC from bypassing newly required fields.
- Guest open-registration cancellation uses the original high-entropy idempotency key as an event-scoped bearer capability. Only its SHA-256 hash is stored; `cancel_open_registration` locks the event, idempotently cancels, releases the reservation, and appends history/audit/outbox rows atomically. The application must generate the key with a cryptographically secure random source, retain it for cancellation, and never log or expose it. Loss of the key currently has no recovery flow.
- Question visibility supports the documented simple equality object `{ "questionKey": "stable_key", "value": <JSON value> }`. More complex Boolean expressions, regex rules, and arbitrary validation expressions are deliberately not executable SQL; extend through reviewed typed rules.
- Public submission throttling/CAPTCHA belongs at the application/edge boundary and is not implemented by this schema. Do not expose registration ids as authorization.

## Authorization and RLS matrix

| Data/action | Anonymous | Authenticated member | Event manager with MFA | Enforcement |
|---|---:|---:|---:|---|
| Client/event/config/guest/answer/history direct SELECT | No | No, unless `private.can_manage_event/org` permits manager-read policy | Yes, tenant/event scoped | RLS and explicit SELECT grants |
| Direct INSERT/UPDATE/DELETE on new tables | No | No | No | Table privileges revoked; mutations use RPC |
| Open public form | Published open/approval RSVP fields only | Same | Same | `get_open_registration_form` SECURITY DEFINER, restricted result |
| Open registration submit | Yes, validated public inputs | Yes | Yes | `submit_open_registration`, capacity lock, schema constraints |
| Open registration cancellation | High-entropy event-scoped bearer key | Same | Same | `cancel_open_registration`, key hash, event/registration locks |
| Private invitation form response | Valid token scope only | Same | Same | Existing hash lookup/RPC plus answer-aware v2 |
| Client metadata/config/event settings write | No | No | Organization/event manager with MFA | SECURITY DEFINER RPC calls `private.can_manage_*`, audit row |
| Approval/rejection/cancel/promotion | No | No | Event manager with MFA | `transition_open_registration` authorization and row locks |
| Audit/outbox writes | No | No | No direct writes | Only mutation RPCs, same transaction |

RLS is row visibility; table grants and SECURITY DEFINER RPCs are separately restricted. Public RPCs must never return private invitation labels, attendee identities, registration answers, or organizer contact fields. Supabase `auth.uid()`/`auth.jwt()` helpers and the existing private authorization functions are expected, so runtime tests require an isolated Supabase-compatible database.

## Migration inventory

| File | Change |
|---|---|
| `0007_batch5_rsvp_foundation.sql` | Drizzle schema/types, additive tables/columns/FKs/indexes; composite unique indexes are placed before dependent FKs. |
| `0008_batch5_private_answers.sql` | Invitation config pin; synthetic-safe additive backfill from existing organizations/events; RLS, grants, policies, form/config/client/settings RPCs, open registration and transition RPCs, private answer RPC and legacy guard. |
| `0009_batch5_composite_fk_indexes.sql` | Snapshot/journal alignment note; required indexes were moved earlier in 0007/0008 so FKs can be created in order. No standalone SQL change. |

All migration SQL is unexecuted. Inspect `drizzle/meta` with each migration and compare the remote migration history only after environment confirmation.

## Backward compatibility, restore, and repair

No existing organization, event, invitation, attendee, NFC, audit, outbox, or microsite row is deleted or rewritten except the nullable `invitations.registration_config_id` backfill. Capacity is not changed by backfill. A failed migration transaction should roll back atomically where the migration runner wraps DDL; verify runner transaction behavior before execution. Take and verify a restorable snapshot first. For rollback before any new records, remove the newly added objects in reverse dependency order only after review. Once configs, answers, registrations, history, or outbox records exist, prefer a forward repair; restoring a snapshot is the last resort and may discard later writes. Never drop shared operational data as an automatic rollback.

## Development environment checklist

1. Keep root `.env` as the default source (`dotenv/config`); `.env.example` contains names/placeholders only. Confirm `.env` remains ignored and do not echo values.
2. Independently confirm the Supabase project owner, ref, environment designation, and synthetic-only status. Do not use the currently configured remote project until confirmed.
3. For a disposable local target, add the Supabase CLI as a project-local dev dependency and use the supported local stack, which requires a Docker-compatible runtime; Docker Desktop is the recommended runtime on Windows. Installing/enabling Docker Desktop needs separate approval. `psql` can be supplied by the CLI/container or a separately approved local package. No tools/services were installed or started here. See the [Supabase local development guide](https://supabase.com/docs/guides/local-development) and [CLI getting started guide](https://supabase.com/docs/guides/local-development/cli/getting-started).
4. Use a dedicated local database and credentials, never a production URL. Confirm identity from local status and inspect database name before applying anything.
5. Review migration diffs and existing migration history; snapshot and rehearse restore; apply only after the exact approval below. Run RLS, concurrency, and full workflow tests on disposable synthetic fixtures.

Reproducible commands after tooling/target approval (PowerShell, from repository root). The migration command below is valid only when the target already has every prerequisite migration 0000–0006 applied; if not, stop and separately review/approve the prerequisite set because Drizzle applies pending journal entries in order.

```powershell
pnpm install --frozen-lockfile
# After approval to add the local CLI dependency:
pnpm add -D supabase
pnpm exec supabase init
pnpm exec supabase start
pnpm exec supabase status
# Verify the local database endpoint/name before assigning DATABASE_URL in .env.
pnpm exec drizzle-kit check
pnpm exec drizzle-kit migrate
$env:MOMENTUS_TEST_DATABASE = "1"
pnpm test:db:local
```

`pnpm exec drizzle-kit migrate` is intentionally not run as part of Batch 5B. Never copy `.env.example` over `.env` to choose database settings.

## Exact approval needed before execution

> I confirm that the database target is the isolated synthetic development database **[state local Supabase or confirmed project ref and database name]**, and that its identity has been independently verified. I confirm migrations 0000–0006 are already applied there and approve applying reviewed migrations `0007_batch5_rsvp_foundation.sql` through `0009_batch5_composite_fk_indexes.sql` after a verified backup, then running the Batch 5B integration suite. If any prerequisite is missing, stop and request separate approval for that exact prerequisite set. This approval does not authorize production changes, unrelated migrations, deployment, or data deletion.

Until this statement is given for a verified target, do not connect or migrate.
