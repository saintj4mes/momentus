# MOMENTUS acceptance criteria

**Status:** Approved acceptance direction Q1–Q75 with U2/U3/U4/U5/U6/U7/U8/U9/U10/U11/U12 refinements. The app includes Supabase Auth signup/sign-in and TOTP MFA, organization/event actions, capacity-reserved invitations, one-time private RSVP source code, QR rendering, NFC test-tag writing, and an authenticated staff NFC feasibility prototype. Local-demo login and synthetic client/event workflows remain isolated. The Designer Studio has an MFA-protected real-event route, tenant-scoped PostgreSQL draft/version tables, RLS, create/load/save RPCs, JSON project validation, and optimistic-revision autosave. A manager-scoped real-event guest directory reads attendees under existing RLS and provides filtered CSV export. `.env` identifies project ref `zktyesiawrwfybcllnkr` but does not prove it is isolated synthetic development; remote migration history is unknown, and Supabase CLI/psql/Docker are unavailable. No remote connection or migration was made. Nine local-demo Playwright scenarios pass; this does not verify database behavior. Publication, public rendering, media, real event bindings, and durable Batch 4/5 RSVP operations remain outstanding. Production self-hosts Next.js and Supabase services; platform/recovery remain deferred (Q76).

Completion requires evidence for each applicable item, including physical-device and supervised-pilot work. A mock scan, stubbed email, successful build, or populated demo dashboard alone does not establish a working platform.

## References and architecture

- [x] Preserve the baseline PDF unchanged; original and project copy SHA-256 match.
- [x] Record accepted Q1–Q71 outcomes and user clarifications.
- [x] Settle production service boundary: self-host Next.js plus Supabase PostgreSQL/Auth/Storage.
- [ ] Identify the host platform and recovery policy; confirm the written plan/shared understanding.
- [x] Scaffold the Next.js app with pnpm and demonstrate `pnpm dev` on Windows at localhost:3000 (HTTP 200).
- [x] Configure Biome lint/format and TypeScript checks; both lint and typecheck pass.
- [x] Configure local Supabase URL/publishable key in ignored `.env`; Auth settings endpoint returned HTTP 200. No credentials are committed.
- [x] Build an authenticated Web NFC feasibility page with local-only invitation URL parsing, permission/error handling, and a manual URL fallback. It performs no guest lookup or event mutation.
- [ ] Open the prototype on the selected Android Chrome phone over localhost/on-device or a trusted HTTPS test origin and record actual tag read, permission, foreground, and QR fallback behavior.
- [x] Implement initial typed Drizzle schema, reviewed SQL/RLS/RPC migrations, auth/MFA and organizer/guest code paths.
- [ ] Apply migrations to the separate synthetic development database and verify the full organizer-to-RSVP workflow against it.
- [ ] Configure the Supabase Auth redirect allowlist for `http://localhost:3000/auth/callback` and verify signup/email confirmation/MFA on a real account.
- [ ] Confirm the project is the separate synthetic development project; run reviewed migrations and connect feature workflows.
- [ ] Feature modules expose declared actions/queries/types; routes contain no duplicated business workflow.
- [ ] Server inputs, resource authorization and trusted context are enforced inside the use cases, including alternate transports.
- [ ] Reviewed migrations recreate the schema and required policies/constraints from a clean non-production database.
- [x] Add an ignored-`.env`, development-only synthetic demo login and client microsite console; the console labels browser-only demo data and does not query Supabase.
- [ ] Verify local demo credentials, signed session expiry/rejection, production disablement, and that `.env` remains untracked.

- [x] Author event-scoped exclusive mode controls, stable invitation-card mode resolution, and manager card inventory/assignment/replacement/revocation actions with audited database RPCs; runtime verification is pending.
- [x] Author the local mock Client → Event admin flow, direct `/event/<slug>` guest landing, customizable RSVP/Meal & Booth/album experiences, mock RSVP companion entry, and per-attendee guest planning fields; runtime verification is pending.
- [ ] Protected local-demo Designer Studio loads GrapesJS Core client-side without SSR errors and destroys the editor cleanly.
- [ ] `docs/GRAPESJS_CAPABILITIES.md` tracks the installed GrapesJS API surface and marks runtime evidence separately from API availability.
- [ ] Core visual editor browser checks cover editable component blocks, selection/actions, style/trait/class managers, layer operations, canvas controls, responsive breakpoints, and project save/restore.
- [ ] MOMENTUS event blocks remain presentation-only until an authorized event-data binding contract is approved and tested; media uploads remain disabled until event-scoped storage and quota checks are implemented.
- [x] Authored a real-event designer route, microsite draft/version schema, manager/MFA-scoped RLS and RPCs, 2 MB/content safety validation, and revision-checked autosave action. The migration is not applied and runtime database behavior is not verified.
- [ ] Authenticated event workspace opens Designer Studio for an existing event only after verified email and MFA; manager/event/tenant authorization is enforced server-side and by RLS/RPC.
- [ ] Complete GrapesJS project JSON drafts save and restore from PostgreSQL per event; source templates remain unchanged.
- [ ] Debounced autosave and optimistic revision checks prevent accidental overwrites; conflict behavior is clear and preserves the user's unsaved canvas.
- [ ] Twelve distinct original templates support preview, category/search filters, and editable copies in the real-event workflow.
- [ ] MOMENTUS blocks and event bindings expose only approved public event data; guest-private data never enters public project output.
- [ ] Controlled animation presets respect reduced motion and do not execute arbitrary scripts.
- [ ] HTML/CSS/ZIP/project imports enforce type/size limits, path traversal protections, sanitization, safe URL rules, no script execution, and preview.
- [ ] Media uses tenant-scoped existing storage, validation, quotas and lifecycle deletion.
- [ ] Durable tenant/event-owned drafts, stable published versions, restore/history, preview and publish/unpublish use reviewed migrations and authorized actions.
- [ ] Published pages use a safe rendering pipeline, preserve NFC URLs, and keep RSVP/claims/identity authorization in existing services.
- [ ] Designer workflow, import/publish security and existing event regression cases have meaningful automated and manual evidence.
- [ ] Microsite migrations apply and recreate cleanly on the confirmed isolated synthetic development database; no production target is used.

## Platform admin and client microsites (U2/U4/U5)

- [ ] Platform admin dashboard lists only authorized client organizations, their events, and each event microsite's publication/lifecycle state.
- [ ] Each client event has a distinct guest microsite and one mutually exclusive active NFC mode: RSVP, Meal & Booth, or Post-event Album.
- [ ] Every invitation card keeps a stable URL; the server resolves the invitation and current event mode. Mode changes take effect without rewriting cards, including under concurrent requests.
- [ ] Album mode is unavailable until memories mode and host publication; no arbitrary external redirect can be configured.
- [ ] The meal guest experience displays the attendee's applicable meal information/pass; it cannot redeem the entitlement or bypass station staff confirmation.
- [ ] Card inventory supports multiple physical cards across invitations/events, assignment, replacement and revocation; only one active card remains per invitation and a card cannot be rebound to another invitation.
- [ ] Booth guests can submit permitted photos/videos into private pending-review storage; host approval is required before album publication, quotas apply, and media can be purged/exported with the event lifecycle.
- [ ] Platform configuration edits are role-checked, event-scoped, and audited; guest identities, RSVP details, seating, and operational claims remain behind an approved, bounded support grant.

## Identity, tenants and permissions

- [ ] One user can switch between organizations without carrying permissions or cached data from another.
- [ ] Negative cases cover cross-tenant/event IDs, manipulated station/attendee IDs, direct endpoints and unauthorized exports.
- [ ] Actual least-privilege database connections/RLS and composite references prevent cross-scope access; administrator bypass is not the test path.
- [ ] Owner/admin/manager access requires verified email and server-enforced MFA assurance; revoked memberships/sessions cease granting access.
- [ ] Staff accounts are individual and restricted to assigned event/station/data; guest categories do not grant staff authority.
- [ ] Platform content access requires an approved, bounded, audited support grant; expiry/revocation is enforced.

## Invitation, companions and RSVP

- [ ] A card resolves one private invitation with exactly one primary slot and configured zero/one/many companions.
- [ ] Concurrent issuance reserves full allowances without exceeding capacity; draft/imported invitations do not accidentally reserve/send.
- [ ] Invitation details open before RSVP; submission captures names and primary email, supports additional contacts and guardian-managed children without child email/DOB.
- [ ] Count is constrained to allowance; companions can attend when primary declines.
- [ ] Per-person attending/declined/undecided statuses and meal/optional-note settings behave correctly.
- [ ] Optional sensitive notes include specific permission and representative/guardian handling; unauthorized roles cannot read/export them.
- [ ] First RSVP commits and queues confirmation atomically. Subsequent edits need the primary emailed management credential and stop at deadline.
- [ ] Individual attendee passes do not permit editing companions; card possession alone cannot take over an existing RSVP.
- [ ] At deadline, unused reserved places release correctly without depending on a timely cron job. Manager/walk-in changes enforce current capacity.
- [ ] CSV preview catches invalid allowances/fields, warns about possible duplicates, never silently merges names/emails, and sends no unrequested email.
- [ ] Pre-live reschedule preserves URLs/history, preflights capacity, requests reconfirmation with new deadline, and sends only approved updates.
- [ ] Cancellation blocks entry/redemption and unwanted subsequent lifecycle sends while preserving required history.

## NFC, QR, check-in and seating

- [ ] Real NDEF cards open the HTTPS invitation on the chosen guest iPhone/Android devices; record exact tested device/OS cases.
- [ ] Staff Android Chrome reads actual tags within authenticated event/station flow; permission denial, unsupported hardware, backgrounding, lock and NFC-disabled cases have usable handling.
- [ ] QR camera scanning works on the chosen fallback devices; authorized manual lookup is available.
- [ ] Scanned external URLs, revoked/replaced cards, another event's pass and malformed tokens are rejected safely.
- [ ] Only one physical card remains active after replacement; invitation revocation invalidates all associated access/passes.
- [ ] A card shows relevant named people; staff confirm selected people, not an automatic whole-party operation.
- [ ] Concurrent/retried check-ins produce one first arrival per attendee; re-entry displays correct status without inflating attendance.
- [ ] Table/seat assignment, unique seat constraints and capacity checks work for named attendees.
- [ ] Offline/timeouts never display a committed success without server acknowledgement; manual exception and reconciliation procedure is exercised.

## Meal and booth operations

- [ ] Confirmed/eligible individual may redeem the assigned meal and each assigned booth once; one attendee's claim never consumes a companion's.
- [ ] Simultaneous requests from multiple devices, double taps and network retries cannot consume one entitlement twice.
- [ ] Reused idempotency key with changed input is rejected; replay of identical input returns the original result.
- [ ] Staff must be assigned to the correct station, and role/credential/event/RSVP is rechecked inside the mutation.
- [ ] Manager reversal/change requires reason, preserves immutable history, and changes only the intended entitlement/operation.
- [ ] Audit/outbox failures roll back the safety-critical operation rather than leaving contradictory success records.

## Email and background jobs

- [ ] Real verified-domain email reaches designated primary/additional recipients, with organizer reply-to and appropriately scoped links/passes.
- [ ] Confirmations reflect committed RSVP revision and normally deliver within two minutes in the measured healthy setup.
- [ ] Crashed workers, provider timeout/rate limit, repeated jobs/webhooks, bounce/suppression and out-of-order events are handled without duplicate logical sends or corrupted status.
- [ ] Scheduled processing recovers durable pending work; default development SMTP is not presented as production delivery.
- [ ] Memories notices respect active invitations, opted-in recipients including declined guests, opt-out, publication state and duplicate protection.
- [ ] No guest marketing/open/link-tracking behavior is silently added.

## Microsites, memories and privacy lifecycle

- [ ] Three accepted themes share working functionality, draft/preview/publish, responsive layouts and accessible/reduced-motion behavior.
- [ ] Representative organizer/guest/staff designs are reviewed before all screens are expanded.
- [ ] Photos upload to private storage, validate file type/size, enforce 10 MB/photo and 5 GB/event including variants, and show quota/warnings.
- [ ] Guests can take/select photo/video contributions from the live booth mode; uploads remain private and pending host review/rights confirmation until approved for the memories album.
- [ ] Video file size/duration limits are selected and documented before enabling production guest uploads; all media counts toward the 5 GB/event quota.
- [ ] Hosts confirm publishing rights; photo downloads default off; external video links remain supported.
- [ ] Same physical card opens published memories; private media cannot be enumerated or accessed through another invitation/event.
- [ ] Guest hosting expires at 12 months; host export/extension window lasts 30 more days; notices and arranged extensions are correct.
- [ ] Sensitive notes purge after 30 days; event data/media purge after hosting window; valid exceptions are explicit, scoped and logged.
- [ ] Purge covers credentials, objects/variants, identifiable audit data, outbox/export artifacts and recovery copies according to policy.
- [ ] Verified access/correction/deletion request workflow and administrative tools work without exposing information to an unverified requester.
- [ ] Only genuinely anonymized aggregates survive event-data deletion; restored backups do not silently resurrect deleted records.

## Performance and recovery

- [ ] Publish representative test data/load: 1,000 attendees/event, 10 simultaneous events, 100 staff devices, 10 aggregate confirmed operations/second.
- [ ] Measure p95 check-in/redemption decision requests at or below one second in the stated environment/load; separate human/tap time from request timing.
- [ ] Live count changes become visible within five seconds; counters remain correct under retries/concurrency/reversal.
- [ ] Capture measured provider usage and cost; adjust compute/pooling/indexes or targets transparently if the first configuration fails.
- [ ] Verify the selected self-host database backup/WAL/recovery configuration actually operates; report achieved recovery point and measured restore time, including downtime.
- [ ] Restore database AND media bytes/paths/permissions into an isolated recovery target; verify guest gallery access and claim/attendance consistency.
- [ ] Reapply deletion/expiry state after restore; do not re-enable expired/revoked passes or purge-protected personal data.
- [ ] Alert on stale/missing backups; document manual service fallback, recovery owners, and reconciliation before reopening operations.

## Database preparation (U13 / Batch 5B)

- [x] Review existing organizations, events, invitations, attendees, capacity counter, RPCs, and RLS before adding the design.
- [x] Author additive Drizzle tables/columns/indexes, compatibility backfill, versioned form config, answer-aware private RSVP endpoint, open registration/idempotency/capacity/status RPCs, and tenant/event manager read policies.
- [x] Prepare synthetic multi-client fixtures and a local-only integration suite that refuses a non-local database host.
- [x] Author manager approval/rejection/cancellation/promotion and guest open-registration cancellation using a hashed event-scoped capability; runtime authorization, retries, and capacity release remain unverified.
- [x] Record `.env` as the default, project identity uncertainty, migration inventory, authorization matrix, transaction assumptions, restore/forward repair, and exact migration approval language.
- [ ] Confirm an isolated synthetic database identity and inspect its applied migration history. Do not connect to the configured project before that confirmation.
- [ ] Obtain explicit approval before applying migrations 0007–0009; run only on the confirmed isolated target.
- [ ] Execute cross-tenant isolation, RSVP form persistence, duplicate retry, concurrent capacity, transitions, and restore tests on an approved Supabase-compatible database. No database runtime verification has occurred.

## Release and supervised pilot

- [ ] Final controlled domain checked before production card programming; test tags never masquerade as real invitation cards.
- [ ] Provider accounts/DNS/senders/secrets and privacy/operating documents prepared; production and synthetic non-production are isolated.
- [ ] Self-host target supports persistent database/media, HTTPS/reverse proxy, secrets, worker scheduling, upgrades and rollback; production backup ownership is explicit.
- [ ] If Supabase services move from managed to self-hosted, test schema/extension compatibility, transferred object bytes/metadata/permissions, Auth/password behavior, MFA continuity and session reauthentication; no synthetic fixtures enter production.
- [ ] Private repository/CI/staging checks are green and reviewed; no secrets or production fixtures in source.
- [ ] Actual phones/tags/venue connectivity and staff training are ready, with physical/manual fallback demonstrated.
- [ ] Prepare release evidence and obtain explicit production-release approval during the pilot.
- [ ] Supervise one real event through invitations, operations and memories; record and fix material failures before wider rollout.

## Designer Studio Batch 2 and AI assistant (U9)

- [x] Local-demo browser flow covers page create, switch, rename, duplicate, delete, homepage, slug update, full project save/reload, plus local navigation insertion and cross-page preview navigation.
- [ ] Verify title/description metadata persistence; mobile menu, back-to-home, and section-anchor navigation flows.
- [ ] Rich text browser evidence currently covers heading formatting. Verify link/list/alignment controls, plain-text paste safety, and formatting persistence after reload.
- [ ] Undo/redo/save/delete/duplicate/escape shortcuts work and do not intercept normal editable text input.
- [ ] Component copy/paste, duplicate, movement, lock, rename, hierarchy, presets, context actions and selection indicators work.
- [x] Assistant endpoint rejects unauthenticated callers and rejects malformed operation payloads in the local browser test.
- [x] Deterministic demo proposal preview/apply/snapshot undo and manual draft save are covered without a live OpenAI call or database access.
- [ ] The OpenAI provider uses Responses structured output, explicit model/configuration and a server-side feature gate; Codex execution is not embedded in the product.

## Multi-client event platform and experience management (U10)

- [x] Local browser workflow creates a client, onboards a first event, selects independent services, and submits a synthetic RSVP without Supabase calls (Playwright). Client filter/archive restore and multi-event creation need dedicated browser coverage.
- [ ] Event type, lifecycle and independent service flags persist across reload; lifecycle changes do not implicitly toggle services.
- [ ] Registration question edits, required-field validation, and synthetic preview submission restore from browser storage.
- [ ] Before/during/after Designer Studio local drafts use stage-specific keys (key creation tested); verify independent restore across stages and event IDs.
- [ ] Client contact fields are not treated as account permissions; production tenant access remains membership/RLS-bound.
- [ ] Durable onboarding, registration, invitations, capacity, event claims, NFC, payment/ticketing, public microsite routing and audit trails remain pending reviewed schemas, service actions and server/database verification. No migration was applied for U10.

## RSVP and guest management (U11)

- [x] Existing private invitations store token hashes; public lookup and RSVP submission use existing server RPCs; submission enforces one-time response, event status/deadline and invitation companion allowance. This source code is not runtime-verified against a confirmed isolated database.
- [x] Organizer route includes an event-scoped guest list and dashboard query, status/search/invitation/date filtering, reservation metrics, invitation submission history, and filtered CSV export under the existing authenticated/MFA route and RLS policies. Database execution and tenant isolation remain unverified.
- [x] Local synthetic RSVP preview validates required answers, duplicate email, configured capacity and local waitlist/approval display; records survive browser storage. It is not an atomic or secure public registration service.
- [ ] Durable client/event editing and archive, persisted RSVP configuration/questions, answer migration/history, database guest edits, open registration, approval transitions, waitlist operations, and cross-tenant database tests require reviewed schema/RPC changes and an explicitly confirmed isolated target.
- [ ] Private invitation issuance and RSVP, companion rules, duplicate rejection, capacity concurrency, and guest dashboard are exercised against synthetic PostgreSQL with RLS. No database connection or migration was run for U11.

## Database foundation and complete RSVP operations (U12)

- [x] Inspected `.env` configuration names safely, schema, local migration journal, SQL policies/RPCs, Supabase adapters, and available CLI/database tools without printing credentials.
- [x] Identified configured project ref `zktyesiawrwfybcllnkr` and database host `db.zktyesiawrwfybcllnkr.supabase.co` / database `postgres`; environment identity and synthetic-only data are not independently established. No remote request was made.
- [x] Local Drizzle migration history is 0000–0006. Remote applied history is unknown. Supabase CLI, `psql`, and Docker are unavailable. No migration was added or applied.
- [x] Browser-local guest operations capture each companion's attendance, maintain local status history, and exercise approval with a capacity check in Playwright. This is demonstration-only and does not establish an atomic workflow.
- [ ] Browser-local custom form browser tests cover radio/multi-select options, conditional visibility, question reordering, deadlines, and config save/restore.
- [ ] Independently confirm the project owner/environment and that the target is isolated synthetic development. Do not connect before confirmation.
- [ ] Review additive schema, tenant RLS/policies, RPC changes, affected tables, compatibility, and rollback/restore plan; obtain explicit migration approval before applying.
- [ ] Test durable client/event and form configuration across sessions; private/open registration, approval/waitlist, guest status operations, and history against PostgreSQL.
- [ ] Test RLS cross-tenant denial and concurrent final-seat registration/approval/waitlist promotion on the confirmed isolated database. Browser localStorage tests do not satisfy these criteria.
