# MOMENTUS decision record

**Interview date:** 4 November 2026, Asia/Manila.  
**Status:** Q1–Q75 accepted. Local implementation is under way with pnpm. Production host/recovery Q76 is deferred until the local workflow is ready to deploy.

The user answered yes to each round, with explicit clarifications incorporated below. These outcomes refine the original PDF. They authorize planning choices; they do not establish that software, devices, provider accounts, or performance have already been validated.

## Design tree

```text
MOMENTUS
├─ Product and launch
│  ├─ Philippine weddings/debuts and PDF MVP: Q3–Q5
│  ├─ Online pilot, budget, manual business operations: Q6–Q9
│  └─ Scale, language, lifecycle, changes: Q16–Q18, Q69–Q71
├─ Private invitation and people
│  ├─ Primary guest + configured companions: Q11, Q19–Q23, Q60–Q62
│  ├─ Guest access, privacy, email editing: Q12, Q15, Q37–Q38
│  └─ Card, device, security, production, lifetime: Q13, Q27–Q30, Q63–Q64
├─ Event operations
│  ├─ Roles, organizations, support: Q10, Q32, Q34–Q36, Q46–Q47, Q65
│  └─ Seating, individual claims, confirmation, re-entry: Q24–Q25, Q31, Q33
├─ Content, communications, memories, privacy
│  ├─ Themes and gallery: Q14, Q26, Q44, Q59
│  ├─ Email and gallery hosting: Q39–Q41
│  └─ Permission, children, rights, retention, quota: Q42–Q43, Q45, Q56–Q58
└─ Engineering and delivery
   ├─ Source reference and architecture: Q1–Q2, Q48–Q52
   ├─ Jobs, region, environments: Q53–Q55
   └─ Domain, GitHub, import, release evidence: Q66–Q68, Q70–Q71
```

## Accepted outcomes

| ID | Final decision |
| --- | --- |
| Q1 | Next.js modular monolith, with each business feature a module and each application action a named use case. Next.js Server Actions are transport adapters. |
| Q2 | Preserve an unchanged PDF at `docs/MOMENTUS_Product_Specification.pdf`; record approved changes separately. |
| Q3 | Organization is the tenant and may own multiple events. A direct couple may own a one-event organization. Couples can receive event-specific access. |
| Q4 | Initial market: Philippine weddings and debuts. |
| Q5 | Deliver the PDF MVP as a complete production pilot; implement later roadmap features later. |
| Q6 | Online verification for check-in/redemption, documented manual fallback for outages; full offline syncing later. |
| Q7 | Paid managed infrastructure is permitted after reviewing actual costs. No separate monthly ceiling was supplied. |
| Q8 | No fixed deadline; prioritize a reliable pilot and explicit completion criteria. |
| Q9 | Manually onboard customers and handle payments outside the application initially. |
| Q10 | Organization owners/admins, event managers, and event-restricted station staff. Couples may manage their assigned event. |
| Q11 | Guests enter their own name and companion names, plus email contact information. Maintain individual attendee records within the private invitation. |
| Q12 | Guests do not create accounts. Use private links, automated RSVP confirmation, and later memories email; the same NFC card also opens memories. |
| Q13 | User clarification: both guests and staff use NFC by default; QR is fallback. |
| Q14 | Three polished themes with a structured editor for supported colors, fonts, media, text, and sections; preview/publish. Freeform builder later. |
| Q15 | Unlisted events by default. Personal guest, RSVP, and seating information requires the appropriate invitation or staff access. |
| Q16 | Planning targets: 1,000 attendees/event, 10 scanner devices/event, 10 concurrent events across the platform. Validate before promising support. |
| Q17 | English first, event timezone configurable, default Asia/Manila. |
| Q18 | Authorized explicit transitions: draft, published, live, memories, archived. Q69 adds cancellation before live. |
| Q19 | Each private invitation has a unique link and an organizer-set attendee allowance. Guest-entered names cannot exceed it. |
| Q20 | One required primary email per invitation; optional additional attendee emails. Send to explicitly supplied recipients. |
| Q21 | Show the invitation immediately; collect required names/email when RSVP is submitted. |
| Q22 | Guests edit until the organizer's deadline; email confirmation after successful changes. Managers handle changes afterward. Q38 protects subsequent edits with an emailed management link. |
| Q23 | Attendance per person; configured meal selection; optional dietary, accessibility, and special-request fields, restricted to authorized personnel. |
| Q24 | Manual table assignment, optional numbered seats, capacity checks. Graphical floor plans and seating optimization later. |
| Q25 | Entitlements belong to individual attendees: one meal and one redemption at each assigned booth in the MVP. |
| Q26 | Host/organizer-curated photo gallery and external video links. Guest uploads and guestbook later. Hosts control downloads. |
| Q27 | Staff Web NFC targets tested NFC-enabled Android phones with Chrome. iPhone/other supported staff devices use QR. Native iPhone NFC later. |
| Q28 | User clarification: one physical NFC card equals one private invitation for one primary guest; organizer configures zero, one, or multiple companions. This replaces a generic household-card interpretation. |
| Q29 | Standard copyable/forwardable private NFC URLs are acceptable for MVP. Staff review names; server blocks duplicate claims. No clone-proof identity assurance is promised. |
| Q30 | App manages assignment, activation, replacement, revocation; external tools handle procurement, printing, programming. Export URLs and QR assets. |
| Q31 | Scan shows eligibility and attendees; staff explicitly confirm selected check-in/redemption. |
| Q32 | Managers resolve exceptional admissions, entitlement changes, and reversals with reasons and audit records. Ordinary station staff cannot override. |
| Q33 | Re-entry allowed. Record first arrival; subsequent scans show already checked in. No exit tracking or live occupancy in MVP. |
| Q34 | Managers may register walk-ins within capacity, requiring names and primary email; audit the action. Station staff cannot add guests. |
| Q35 | Staff session is scoped to assigned event and station, with only necessary information and permitted actions. |
| Q36 | Confirmed attending RSVP required for normal admission/redemption. Managers resolve pending/declined status. |
| Q37 | Each named attendee receives an individual digital QR pass through the primary contact and their optional email. Support separate arrivals with QR or authorized lookup. |
| Q38 | After first RSVP, edits to names, attendance, or contact details require an emailed private management link. Physical invitation stays viewable. |
| Q39 | Verified MOMENTUS sending domain, event-branded email, organizer reply-to. Customer sending domains later. |
| Q40 | Publishing memories notifies active invitation contacts who opted in, including declined attendees. Provide opt-out and duplicate protection. |
| Q41 | Gallery hosted for 12 months after event, expiry notices, export, manually arranged extensions. |
| Q42 | Sensitive RSVP notes optional, purpose explained, specific permission captured. A submitter must be authorized to provide another adult's sensitive notes. |
| Q43 | Children may be named under a guardian-managed invitation; no separate email or full birth date required; entitlements configurable. |
| Q44 | Hosts confirm rights/permissions to publish photos. Downloads default off; no screenshot/copy-prevention claim. |
| Q45 | Published contact channel and verified manual handling for privacy requests, supported by administrative export/deletion tools. |
| Q46 | Mandatory MFA for owners/admins/event managers. Individual station-staff accounts, optional staff MFA; verified email, password recovery, revocation. |
| Q47 | Platform administrators onboard and diagnose; accessing customer event content needs an explicit temporary audited support grant. |
| Q48 | App Router, TypeScript, pnpm, Tailwind CSS, shadcn/ui; pin supported dependency versions at scaffolding. |
| Q49 | Originally selected Vercel/Supabase/Resend managed production. **Production hosting superseded by U1:** Supabase for now; production on user's self-hosted platform. Original USD75 estimate is historical, not the current production estimate. |
| Q50 | Drizzle, reviewed migrations, module-owned repositories, PostgreSQL transactions for capacity/check-in/redemption correctness. |
| Q51 | Named async action functions such as `createInvitation(input, context)`; validate, authorize, coordinate transactions; thin Next.js adapters. |
| Q52 | `src/modules/<feature>` with public actions/queries/types and private internals, one app/database, explicit module communication, shared infrastructure. |
| Q53 | Database-backed email outbox, retry/deduplication/delivery status, no Redis initially; normal confirmation delivery target within two minutes. |
| Q54 | Originally Singapore managed DB/functions; U1 requires rechecking available production region with the user's platform. No blanket exclusive-data-residency claim. |
| Q55 | Synthetic shared non-production environment; production isolated. U1 supersedes the assumption that production is another managed Supabase project. |
| Q56 | Delete sensitive operational notes 30 days after event, except a documented valid retention exception. |
| Q57 | Guest hosting expires at 12 months; 30-day host export/extension window; then delete media and identifiable event records, retaining only genuinely anonymized statistics. Define backup/exception handling. |
| Q58 | Initial media allowance 5 GB/event, 10 MB/photo, warnings and visible quota; external video links. Larger allowances manually arranged. |
| Q59 | Romantic Floral, Modern Minimalist, Fairytale Garden; warm-neutral operational dashboard; premium type, mobile layouts, accessibility/reduced motion; representative-screen review. |
| Q60 | Issuing an invitation reserves primary plus full companion allowance until deadline. Prevent over-issuance, release unused places at deadline. Overbooking/waitlists later. |
| Q61 | Per-person attending, declined, undecided. Only attending is confirmed; resolve undecided before admission. |
| Q62 | Named companions may attend even if primary declines. Primary contact still manages the invitation. |
| Q63 | One active physical card per invitation, permanently bound after issue. Replacement revokes old card. No reuse for another event. |
| Q64 | Physical cards and manually shared links initially. Automate confirmations, memories, approved event updates; campaigns/reminders/SMS/WhatsApp later. |
| Q65 | One user can belong to multiple organizations, with workspace switching and scoped permissions. |
| Q66 | MOMENTUS working brand; choose/check controlled production domain before real card programming/email. Test URLs/cards during development. Custom event domains later. |
| Q67 | Private GitHub repository, automated checks, staging previews; explicit production-release approval during pilot. |
| Q68 | CSV preview/validation/duplicate warnings; no automatic merge by name/email. Import invitations, allowances, known attendees; no unrequested emails. |
| Q69 | Before live, managers may reschedule/cancel. Stable invitation URLs/history. Reschedule requires reconfirmation/new deadline; cancellation blocks operations. Review/confirm update notifications. |
| Q70 | Targets: p95 check-in/redemption decision request within one second; dashboard freshness within five seconds; 100 staff devices, 10 aggregate confirmed operations/second. Validate and size infrastructure. |
| Q71 | Automated workflow/isolation/concurrency/email/permission/retention checks; physical NFC/QR testing; backup/restore exercise; supervised first event. Start with early NFC hardware prototype. |

## Explicit refinements to the PDF

- Staff NFC is a launch requirement on the chosen Android browser path; QR remains fallback. Do not implement a QR-only staff MVP.
- A card represents one primary invitation with configured companions. It is not an unrestricted household signup or a generic event registration link.
- Mandatory transactional/event emails are included even where the concept PDF describes messaging as optional.
- Concurrent online station/device operation is included for the accepted launch workflow. Full offline synchronization, advanced zones, and enterprise station orchestration remain later work.
- Curated gallery is included; guestbook, subscriptions, automated campaigns, and freeform page building are deferred. Guest photo/video contributions through the event booth experience are added by U4.
- Final retention durations, media quota, provider choices, reservation semantics, performance targets, and release gates come from this interview.

## Subsequent user change U1 — self-hosted production

The user directed: "for now use supabase but in production im gonna use my own self hosted platform for this one".

- Use Supabase during development/current work.
- Production target is the user's own self-hosted platform; Vercel/Supabase managed production is no longer the agreed deployment model.
- Whether the user means self-hosted Next.js plus Supabase components, Next.js only, or another backend topology remains to be clarified.
- The earlier USD75 managed base and proposed USD180 managed-PITR base are not current production cost estimates.
- Preserve modular architecture, application actions, source references, domain behavior, isolation, separate non-production data, email reliability, recovery evidence and pilot gates.
- Rework deployment, migrations, media storage, backup/PITR mechanism, operational ownership, capacity and cost around the selected production platform.

## Retired recovery proposals and current frontier

| ID | Proposed decision, not yet accepted |
| --- | --- |
| Q72 | Managed Supabase PITR/Small compute proposal withdrawn by U1 before acceptance. Choose recovery mechanism for the user's platform later. |
| Q73 | Cloudflare R2 media-backup proposal remains unapproved and is deferred until self-hosted storage/recovery topology is known. |
| Q74 | **Accepted:** self-host both Next.js and Supabase PostgreSQL/Auth/Storage in production; use managed Supabase for development. |
| Q75 | **Accepted:** local app runs with `pnpm dev` against managed Supabase Cloud and synthetic data. Use a temporary trusted HTTPS origin only for early physical Android staff-NFC tests; ordinary work stays local. |
| Q76 | Deferred until local workflow is complete: identify the user's production host and its operating/recovery capabilities. Production will self-host Next.js and Supabase PostgreSQL/Auth/Storage. |

## User confirmation Q74 — full production stack

The user replied "yes exactly" to the proposal that production will self-host Next.js and Supabase PostgreSQL/Auth/Storage while development uses managed Supabase. The user had already selected Resend for outbound email; that remains in scope. This replaces an app-only self-host interpretation.

## User instruction — local-first development

The user directed local-first work using pnpm, then replied "yes proceed" to the temporary HTTPS physical NFC test path. The accepted instruction is to run Next.js locally with managed Supabase Cloud for synthetic development data; use a trusted HTTPS origin only for the early physical Android staff-NFC check. Production remains self-hosted and its exact platform is deferred until the local workflow is ready to deploy.

The previously approved Resend outbound-email choice remains in effect unless the user changes it; self-hosted application deployment does not by itself replace that decision.

Database recovery does not by itself restore photo object bytes. No recovery service has been purchased or provisioned. See the plan and official references for scope and historical cost facts.

## User requirement U2 — client microsite control dashboard

The user described the intended product view as an admin dashboard for managing client microsites, with a distinct event microsite for each client event and controls for guest destinations such as RSVP, meal, and the post-event album.

- Add a MOMENTUS platform admin console that lists client organizations, their events, and each event's microsite and publication state. Keep the client event microsite as its own guest-facing experience.
- Give each event a configurable set of named, internal guest destinations (initially RSVP, meal, and post-event album) with enable/visibility toggles and an explicit destination for each action. Do not accept arbitrary redirect URLs.
- Existing tenant and event scoping remains in force. Platform admins may manage microsite configuration and lifecycle metadata through audited actions; access to guest identities, RSVP details, seating, or operational claims still requires the bounded audited support grant from Q47.
- Interpret the guest-facing meal destination as meal information and that guest's assigned meal/pass. Recording a meal redemption remains an authenticated, station-scoped staff action requiring explicit confirmation under Q25/Q31/Q35.
- The post-event album destination becomes available only when the event is in memories state and its host-published gallery is available. Invitation and attendee credentials remain scoped as already decided.
- Acceptance impact: add coverage for platform/client/event scoping, audit history for platform configuration changes, destination visibility by lifecycle, safe internal routing, and separation between guest meal display and staff redemption. This extends the admin-console/site-management view without removing the support-grant boundary for guest data.

## User instruction U3 — local demo login without Supabase Auth

The user instructed that the demo should use a randomly seeded account stored in ignored `.env`, rather than Supabase Auth.

- Local demo sign-in is enabled only when `NODE_ENV=development` and `MOMENTUS_LOCAL_DEMO_ENABLED=true`. It uses a generated email/password plus a separate HMAC signing secret from ignored `.env` and an eight-hour HttpOnly, SameSite=Strict signed cookie.
- This is credential-protected local demo authentication, not an unauthenticated bypass. It does not create a Supabase user or authenticate access to customer data. It is disabled in production by code even if the environment flag is mistakenly present.
- The `/admin` demo console uses synthetic client/event examples; its switches save to that browser's localStorage and do not change database-backed microsites. Production continues to use the accepted Supabase Auth and server-side authorization model.
- Acceptance impact: confirm the route is unavailable outside development, invalid credentials do not create a session, session signatures/expiry are enforced, local demo pages do not query Supabase, and `.env` remains ignored.

## User requirement U4 — lifecycle-switched NFC modes, booth media, and card registry

The user clarified the intended card flow: an admin selects one active event mode; all linked invitation cards keep the same link and resolve to that event's currently active guest experience. The modes are RSVP, Meal & Booth, and Post-event Album. The user also wants a registry for linking and tracking multiple physical cards.

- Replace U2's independent destination switches with one mutually exclusive mode per event. RSVP is the pre-event guest destination. Meal & Booth is the live-event destination and contains meal/souvenir pass and booth experiences. Post-event Album is the memories destination and is available after publication.
- Keep the card URL stable. Resolve its opaque invitation token and current event mode on the server; changing modes must not require rewriting already issued cards. Cards remain invitation-bound, and only one physical card is active for a given invitation. The registry stores card records, event/invitation assignment, and active/replaced/revoked state; card UID is not treated as authentication.
- Meal and souvenir displays may show a guest's eligibility/pass. Duplicate prevention still requires an authorized staff station to confirm each redemption atomically. The NFC tap itself never records a meal/souvenir claim.
- Booth experience now includes guest photo/video capture or selection and submission during the event. Contributions remain private and pending host review until approved for the memories album; collect relevant rights/permission, include guardian handling, and apply the event media quota. Guestbook remains deferred. The agreed 10 MB/photo and 5 GB/event limits continue to apply; choose and document a per-video upload/duration limit before production media upload is implemented.
- Post-event album microsite should lead with the couple's memorable-experience message, then the wedding SDE film, followed by event photos and videos. Only host-published media is shown.
- Acceptance impact: replace U2 toggle tests with mutually exclusive mode, stable-link/current-mode resolution, correct lifecycle and concurrency behavior; add multi-card assignment/replacement/revocation, atomic duplicate claims, guest upload permissions/review/quota, and album publication tests. Guest uploads and admin-managed card registry extend the previously deferred scope.

## User requirement U5 — client/event administration and direct mock microsites

The user refined the local demo flow: use `/event/<event-slug>` such as `/event/amara-luca`; admins select a client, open that client's event, then customize the event's RSVP, Meal & Booth, and album pages. The currently active event experience renders directly as the guest landing page, without a button to enter that experience.

- The local mock admin is organized as Client → Event → event workspace. Its event editor contains mode selection, RSVP customization, Meal & Booth feature configuration, post-event album customization, guest planning, and NFC card records.
- RSVP asks for a primary guest name and optional email. A guest can add companion name fields within the configured mock allowance. Submitted mock guests appear in the event admin guest list; each attendee has independent mock table and meal-plan fields.
- Meal & Booth features are configurable independently within that mode: food stub, souvenir claim, and photo booth. Enabled experiences render together on the guest landing page. Claims remain illustrative mock passes; selecting booth files does not upload them.
- The post-event page is a full landing experience with a customizable memorable-experience headline/message, SDE title/link, and gallery heading. Gallery media remains illustrative mock data.
- Local demo settings and RSVP records remain in browser localStorage and do not represent production persistence. The old `/demo/microsites/<slug>` path redirects to the canonical `/event/<slug>` path during local demo use.
- Acceptance impact: mock-flow review must confirm the client/event hierarchy, direct active-mode landing, customizable event pages, companion entry, guest list and per-person planning fields, and clear separation of browser-only mock data from the database-backed product workflows.

## User requirement U6 — GrapesJS Designer Studio and expanded template/import scope

The user supplied an implementation prompt requesting GrapesJS Core (BSD-3-Clause), a visual event microsite designer, twelve named original starter templates, event-aware components/bindings, animation controls, safe design import, media management, project drafts/versioning, publishing, event integration, security, and documentation.

- This explicitly expands the previously accepted MVP, which deferred freeform page building and specified three structured themes (see `docs/IMPLEMENTATION_PLAN.md`, Microsites). It supersedes that deferral for the requested designer work, but does not authorize changing existing RSVP, NFC, claims, guest privacy, lifecycle, or production release boundaries.
- Use the open-source GrapesJS Core only. Keep the editor client-only. Do not introduce arbitrary JavaScript execution or put private guest data in designer projects/public pages. Preserve the stable invitation URL and keep event mutations in existing trusted services.
- Initial implementation is a protected local-demo editor with browser-local GrapesJS project JSON. It is a feasibility/integration slice only; it does not establish durable tenant-owned drafts, import safety, asset storage, publishing/version history, or production security.
- Acceptance impact: track the editor integration and each requested workflow separately. Do not mark import, media, templates, bindings, animation, publishing, security, or end-to-end designer workflow complete until implemented and evidenced. Production releases still require the approval already agreed in Q67.

## User requirement U7 — database-backed Designer Studio MVP

The user explicitly requested moving the U6 Designer Studio from a local-only prototype into an authenticated event-organizer workflow. The organizer dashboard must open the editor for an existing event; drafts use PostgreSQL and complete GrapesJS project JSON; autosave is debounced and protected by optimistic revision checks; publication/versioning, safe public rendering, invitation integration, and event components follow as separate verified milestones. Keep all 12 current starter templates and do not add more until they work reliably.

- Use the existing App Router, Supabase Auth/session client, organization/event authorization, RLS, Drizzle schema, and reviewed migrations. Do not use local demo records/localStorage as the ordinary organizer workflow.
- First implementation milestone is authenticated real-event draft persistence, with autosave/conflict handling and an event-scoped route. Keep the local demo editor as a clearly isolated fixture only.
- Do not connect to production or deploy. Only apply migrations to a confirmed synthetic development database; until then migrations and runtime database behavior remain unverified.
- Preserve stable invitation URLs and current RSVP business logic. A published site must not execute designer scripts or disclose guest data. Publishing, public rendering, media, guest bindings, and RSVP integration require their own security and acceptance evidence.
- Acceptance impact: add event/tenant isolation, MFA/role checks, database draft roundtrip, autosave, stale-revision conflict, template editing, and migration checks. Require an isolated development browser workflow before declaring the milestone stable.

## User requirement U8 — active GrapesJS feature development

The user directed that Designer Studio development prioritize practical visual editing while unrelated production infrastructure is unavailable. Continue within the existing Next.js/GrapesJS app, use the installed open-source GrapesJS Core, preserve all twelve starter templates and existing draft adapters, and do not deploy or use production services.

- Batch 1 uses GrapesJS component definitions and native managers for blocks, styles, traits, layers and selectors, plus canvas controls and selected-component operations. Event blocks remain presentation-only; private guest data and server-side event behavior are not designer-controlled.
- Keep media uploads disabled until an event-scoped storage adapter is available. Treat database draft code as unverified until it is exercised on the confirmed synthetic development database. Pages, safe import/export, animation and data bindings remain later batches with separate security and acceptance evidence.
- Acceptance impact: add the capability status matrix and collect interactive browser evidence for core canvas, component, block, manager, responsive and save/restore behavior. Source/API presence and a successful build do not count as browser verification.

## User requirement U9 — Designer Studio Batch 2 and AI design assistant

The user explicitly authorized Batch 2 feature-first work in the existing Designer Studio: multi-page editing and metadata, richer safe text editing, keyboard shortcuts, component productivity, page navigation blocks, and designer UI improvements. The user then expanded the batch to include a MOMENTUS AI design assistant using the OpenAI Responses API and also directed Codex to implement it.

- Keep page state in full GrapesJS project JSON and preserve the existing local-demo and real-event draft adapters. Page slugs are local microsite routes, not hardcoded production origins.
- Keep safe paste as plain text and AI edits as validated, bounded design operations. No arbitrary HTML/CSS/JavaScript, private guest context, or direct project replacement is permitted.
- Use an explicit deterministic demo provider only when configured for development. OpenAI credentials and requests stay server-side. Every proposal requires user preview and explicit apply; destructive edits are identified and AI changes have snapshot undo.
- Do not embed Codex app-server or local agent execution in the product. Codex is the implementation agent only; product AI uses the controlled OpenAI Responses API adapter.
- Acceptance impact: verify page CRUD/homepage/switching/project persistence, RTE and safe paste, shortcuts without stealing text-editing keys, component productivity and local navigation, plus unauthenticated rejection, structured AI proposal validation, demo preview/apply/cancel/undo, and draft restoration. Real-event database acceptance remains pending until the confirmed synthetic database is available.

## User requirement U10 — multi-client event platform and experience management

The user requested a broader MOMENTUS event platform with client onboarding, multiple event types and lifecycle stages, independently configurable event services, registration configuration, stage-aware event experiences, and follow-on attendee operations. This changes the earlier wedding/debut-first framing and expands the admin console scope.

- Implement local client/event management and onboarding as a synthetic browser-only workflow while no approved schema/migration and verified database environment exists. Keep the existing local demo data adapter isolated and preserve its behavior.
- Event services are modeled independently of lifecycle. Do not reinterpret or remove the existing database `guest_mode` enum or event-mode behavior without a reviewed schema and compatibility decision. No migration is applied by this work.
- Contact emails entered into the local registry are display data, not account authorization. Durable access continues to require organization membership and server-side policy checks.
- Registration question editing and preview in the local workspace are a functional fixture only. They do not issue real invitation tokens, reserve capacity, authorize guests, or provide atomic claims. Keep production invitation/pass/claim invariants unchanged.
- Local designer drafts are separated by event and experience stage (`before`, `during`, `after`); this is not publication or public routing support.
- Acceptance impact: add tests for local onboarding, client/event creation and filtering, independent service selection/lifecycle, form configuration and validation, stage-specific draft isolation, and data isolation from Supabase. Record browser-only persistence and all database-backed workflows as limitations until a reviewed schema and synthetic DB test are available.

## User requirement U11 — Batch 4 RSVP and guest management

The user requested durable event-scoped client/event persistence, RSVP configuration, guest directory, private/open registration, capacity and approval rules, dashboards, exports, and designer integration. Existing schema/RPCs provide a private invitation token hash, invitation capacity reservations, per-person RSVP rows, atomic one-time submission, and organization/event manager authorization. The configured Supabase project reference is known, but available local metadata cannot establish that it is an isolated development project; the Supabase CLI is unavailable.

- Do not connect to or migrate the configured Supabase target until its isolation is independently confirmed and a migration is reviewed and approved. No database changes are authorized by this record.
- Reuse the existing database invitation/RSVP workflow and RLS-scoped guest reads. New real-event guest directory features are read/export only until schema and write actions are reviewed.
- Keep event registration configuration, open registration, approval, waitlist, and guest management simulation browser-local and clearly labeled. Client contacts never grant authorization. Do not claim browser localStorage provides transaction safety, capacity enforcement across devices, or tenant security.
- Acceptance impact: verify database behavior only after connecting to a confirmed synthetic target. Current local adapter tests demonstrate UI behavior and draft restoration only; they do not verify token security, RLS, atomic capacity, or database persistence.

## User requirement U12 — database foundation and complete RSVP operations

The user requested a development database identity audit, durable client/event and registration configuration, guest state operations, private/open registration, atomic capacity/waitlist rules, dashboard, designer integration, and database-backed isolation/concurrency tests. The local `.env` metadata identifies Supabase project reference `zktyesiawrwfybcllnkr`, Supabase host `zktyesiawrwfybcllnkr.supabase.co`, and PostgreSQL host `db.zktyesiawrwfybcllnkr.supabase.co` with database name `postgres`. These names do not independently establish environment ownership or synthetic-data isolation. No remote connection was attempted. The local Drizzle journal records migrations 0000–0006; the remote applied history is unknown. Supabase CLI, `psql`, and Docker are unavailable.

- Stop before connecting or mutating the configured project until the user/owner independently confirms that the identified project and database are isolated synthetic development. Do not assume the project is non-production from local naming.
- Do not apply migrations without separate explicit approval after presenting target identity, additive schema, compatibility risks, affected tables, and rollback/restore strategy. Migration 0006 remains unapplied per prior decision. Batch 5B now authors reviewed-candidate migrations 0007–0009; none is applied.
- Use project-root `.env` as the default local configuration source; `.env.example` is placeholders only. Do not connect to the configured project while identity/synthetic isolation is unverified.
- Acceptance impact: Batch 5 database persistence, open registration, approval/waitlist transactions, cross-tenant and concurrency cases remain unverified until a confirmed target, approval, and actual database evidence exist. Migration authoring alone does not pass runtime gates.

## User requirement U13 — Batch 5B database preparation

The user requested additive database design/migration authoring, transaction-safe RSVP operations, synthetic fixtures, integration-test preparation, tooling discovery, and review documentation, explicitly stopping before database execution. The schema now adds client metadata, independent event services, versioned RSVP config/questions, open registrations/people/answers/history, and private attendee answer records. Existing organization tenancy, event lifecycle/guest mode/capacity counter, invitation/NFC, and attendee model remain canonical. Candidate Drizzle migrations 0007–0009 and RLS/RPC SQL are authored but unexecuted.

- Continue to use `.env` by default through `dotenv/config`; never copy `.env.example` over `.env`, expose values, or use unconfirmed remote credentials.
- Existing private invitation issuance and open registration coordinate on the same locked event row and `events.reserved_places`; all capacity mutation code must follow this lock protocol. Public access is RPC-only for narrowly scoped form/submit operations; organizers require tenant/event manager authorization with MFA.
- Migration history on the configured remote is unknown. No connection, migration, service installation, or database runtime test is authorized by U13. The approval template and rollback/restore approach are in `docs/DATABASE_BATCH5_DESIGN.md`.
- Open registrations support guest cancellation through the original high-entropy idempotency key as an event-scoped bearer capability; only the digest is stored. The client must generate and securely retain that key. Application rate limiting/CAPTCHA and key recovery remain pending.
- Acceptance impact: authored SQL/schema checks are static preparation only. Cross-tenant isolation, private/open registration persistence, final-seat concurrency, retry behavior, status transitions, restore, and Supabase RLS remain unchecked until executed against an independently confirmed disposable synthetic target after explicit approval.

## User requirement U14 — SaaS platform transformation and commercial foundation

The user explicitly requested implementing the SaaS transformation roadmap, turning MOMENTUS into a full commercial multi-tenant SaaS platform. This includes:
1. Multi-tenant commercial tiers: Per-Event Passes (Bespoke Celebration, Grand Gathering) and Recurring Agency Subscriptions (Starter Agency, Agency Pro, Enterprise) with capacity, turnstile, and storage quotas.
2. Billing and hardware commerce: Pluggable payment abstraction (Stripe + regional PayMongo/GCash/Maya) with deterministic local-first billing simulator for testing and development, alongside NFC keepsake card pack fulfillment.
3. Microsite publishing engine: Immutable versioned snapshot publishing from Designer Studio to `microsite_versions`, rendering pre-rendered sanitized HTML/CSS with edge/ISR caching and dynamic interactive client islands.
4. Custom domain & multi-tenant routing: Next.js proxy middleware host-header resolution for custom domains (`rsvp.client.com`) and wildcard tenant subdomains (`client.momentus.events`).
5. Event-day staff scanner PWA: Mobile-optimized station-scoped scanner with station PINs (turnstile, banquet seating, sommelier), Web NFC on Android Chrome, QR camera fallback, and Web Audio synthesized chimes/buzzers for instant operator confirmation.
6. Durable notification outbox worker: Worker architecture processing pending `notification_outbox` rows with idempotency, exponential backoff retries, and multi-channel dispatch (Email via Resend/SMTP and mobile SMS/WhatsApp pass notifications).
7. Modular monolith integrity: Business features live in `src/modules/*` (`billing`, `microsites`, `nfc`, `notifications`, `organizations`, `platform`) with named async use cases, strict server-side validation, and zero trusting of client claims.

- Acceptance impact: Add comprehensive automated tests covering plan selection, simulated checkout, microsite publishing, custom domain host matching, station-scoped scanner check-in with audio feedback, and outbox delivery processing. Database migrations for billing tables are prepared alongside synthetic multi-tenant test suites.

## User requirement U15 — Unified Hybrid Event Studio and 5-stage lifecycle pipeline

Following the `/grill-me` architectural review, the user directed proceeding with the consolidation of the admin and organizer layers into a unified operational Event Studio:
1. Unified Hybrid Event Studio (`src/modules/studio`): Eliminates the separation between the browser-only local demo console and the minimal organizer view by providing a single production-ready dashboard. Authenticated users connect directly to PostgreSQL/Supabase, while unauthenticated or local development workflows fall back to synthetic demo fixtures.
2. 5-Stage Guided Lifecycle Pipeline: Structures event operations into five progressive milestones with status indicators and readiness checklists:
   - Stage 01 (Setup & Plan): Event metadata, plan licensing quotas, and custom domain / wildcard subdomain routing.
   - Stage 02 (Microsite Studio): Direct GrapesJS visual designer integration, published snapshot cache status, and interactive React RSVP Island embed.
   - Stage 03 (Guests & Seating): Household party management, companion allowances, dietary allergy registry, table seating assignments, and CSV import/export.
   - Stage 04 (NFC Cards & QR): Dual-mode credential production featuring an in-browser Web NFC / USB tap-to-program wizard with Web Audio acoustic pairing chimes, alongside a bulk printable QR badge manifest export.
   - Stage 05 (Live Operations & Memories): Real-time Turnstile Command Center with live turnout meters, station throughput gauges (Gate, Seating, Catering, Bar), 1-click supervisor manual VIP lookup & override, and post-event memories album controls with 30-day sensitive privacy purge countdown.
3. Acceptance impact: Verified through automated Playwright end-to-end tests (`e2e/unified-studio.spec.ts` and `e2e/saas-platform.spec.ts`) asserting full traversal across all five stages, quota meters, NFC encoding simulation, and supervisor override.


