# Sources and provenance

**Checked:** 4 November 2026, Asia/Manila. Prices/versions are observations from official sources, not permanent guarantees. Recheck before scaffolding, purchasing, provisioning, or release.

## Local workspace snapshot

Read-only inspection on 4 November 2026 found Windows/PowerShell, Node `v22.14.0`, pnpm `11.8.0`, npm `10.9.2`, Git `2.51.0.windows.1`, and Corepack `0.31.0`. Docker CLI was unavailable. The workspace was empty apart from planning/reference files: no `package.json`, Next.js application, pnpm lockfile, or Git repository. The proposed local `pnpm dev` command is the future app's development loop; the current workspace cannot run it yet.

Next.js installation documentation supports Windows and requires Node `>=20.9`; use a maintained release supported by the selected Next version. Existing installed Node/pnpm versions are environment facts, not a permanent project pin.

## Original specification

- Title: **MOMENTUS Product Specification v1.0**, concept specification, November 2026, seven PDF pages.
- Original supplied path: `C:\Users\win10\Downloads\MOMENTUS_Product_Specification.pdf`.
- Unchanged project copy: [MOMENTUS_Product_Specification.pdf](MOMENTUS_Product_Specification.pdf).
- Size: **83,913 bytes**.
- SHA-256 of original and project copy: `92815EF8EE6A8407CD08D50DE0B05729B1F203387D658B4CC5E7F4A77411B07F`.
- Integrity check performed when copied. No PDF content was edited.

| PDF pages | Reference subjects |
| --- | --- |
| 2 | NFC/private guest or household mapping, card lifecycle, invitation themes and content. |
| 3 | RSVP/import/seating, staff NFC/QR, duplicate checks, offline caveats, entitlements. |
| 4 | Redemptions/exceptions, analytics, memories/gallery, permission and hosting. |
| 5 | Suggested architecture, RBAC/isolation/token security, device limitations, Philippine privacy obligations. |
| 6 | MVP/later roadmap, draft monetization hypotheses and acceptance direction. |
| 7 | Open choices and statement that this is a concept, not a final engineering contract or legal opinion. |

Apply [DECISIONS.md](DECISIONS.md) for user-approved refinements. Do not infer fixed device support, prices, capacity, legal conclusions or complete implementation from the concept PDF.

## NFC and device support

- [Chrome Web NFC](https://developer.chrome.com/docs/capabilities/nfc): Android Chrome NDEF reading/writing, hardware detection, HTTPS/top-level/user gesture/permission conditions, foreground/unlocked operation; excludes low-level ISO-DEP and similar operations.
- [Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts): loopback/localhost is potentially trustworthy on the browser's own device; arbitrary private LAN HTTP origins are not.
- [Next.js CLI](https://nextjs.org/docs/app/api-reference/cli/next): `next dev` hostname and development-only HTTPS/certificate options. A phone must trust the certificate for the hostname it uses; PC localhost does not automatically provide that on Android.
- [WebKit Web NFC position](https://bugs.webkit.org/show_bug.cgi?id=163196): API implementation request resolved WONTFIX. Do not equate guest iPhone URL opening with Safari staff tag-reading capability.
- [Apple background tag reading](https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading): supported iPhone OS-level NDEF URI notification/opening path and conditions.
- [Android NFC basics](https://developer.android.com/develop/connectivity/nfc/nfc): NDEF records and OS dispatch. Exact handset/OS behavior still needs physical testing.

## Application, data and identity

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [support policy](https://nextjs.org/support-policy): App Router setup and current runtime/version support; pin actual versions when implementing.
- [Next.js data security](https://nextjs.org/docs/app/guides/data-security), [authentication](https://nextjs.org/docs/app/guides/authentication), [backend for frontend](https://nextjs.org/docs/app/guides/backend-for-frontend): exported mutation endpoints require server authorization; framework transport does not replace domain/database rules; direct storage uploads avoid large request bodies.
- [Drizzle transactions](https://orm.drizzle.team/docs/transactions), [migrations](https://orm.drizzle.team/docs/migrations), [Supabase Drizzle guide](https://supabase.com/docs/guides/database/drizzle): supported PostgreSQL access and transaction/migration APIs.
- [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres): serverless pooling and transaction-mode prepared-statement/session-state limitations. Test the selected driver's settings.
- [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp), [SSR](https://supabase.com/docs/guides/auth/server-side): email/password, role-conditioned MFA assurance enforcement, Next SSR integration. SSR package API stability should be checked/pinned.
- [Tailwind Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [shadcn Next.js](https://ui.shadcn.com/docs/installation/next): current integration paths.

## Providers, jobs and price observations

- [Vercel pricing](https://vercel.com/pricing): Pro USD20/month initial developer seat/base, metered usage and additional seats extra. [Regions](https://vercel.com/docs/regions) includes Singapore; configure functions explicitly. This does not establish exclusive Singapore residency for every service.
- [Supabase pricing](https://supabase.com/pricing): Pro from USD25/month, additional project from USD10/month; first two Micro projects approximately USD35/month under current credits. Published Pro includes 8 GB DB/project, 100 GB storage, 250 GB standard egress and daily backups retained seven days; usage overages apply.
- [Supabase regions](https://supabase.com/docs/guides/platform/regions): Singapore available. Region selection is not a legal-compliance attestation.
- [Resend pricing](https://resend.com/pricing): Pro USD20/month for 50,000 transactional messages; domain/volume allowances and extras apply. Free daily cap is unsuitable for assumed bulk pilot bursts. [Domain setup](https://resend.com/docs/dashboard/domains/introduction) requires DNS verification.
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp): default SMTP restricted/non-production; configure verified sending and relevant rate limits.
- [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs): failed cron invocations are not a substitute for durable application retries. [Supabase Cron](https://supabase.com/docs/guides/cron) is another scheduled-trigger option. The outbox remains authoritative.

Historical managed production estimate: Vercel20 + Supabase35 + Resend20 = **USD75/month**, excluding taxes, domain, extra seats, overages, and proposed recovery add-ons. **User change U1 supersedes this as the production target.** Use Supabase for development and determine production cost for the user's self-hosted platform. No plan quota proves the target event/scan workload; measure it.

## Recovery facts and pending proposals

- [Supabase database backups/PITR](https://supabase.com/docs/guides/platform/backups): daily backups and PITR cover PostgreSQL, **not Storage object bytes**. Pro daily backups retain seven days. Seven-day PITR is approximately USD100/month and requires at least Small compute; restore has downtime. It replaces daily production backups and is excluded from Pro Spend Cap. [Compute pricing](https://supabase.com/docs/guides/platform/compute-and-disk) lists Small at approximately USD15/month versus Micro approximately USD10/month. Estimated total with production PITR/Small is **USD180/month** (USD75 base + USD100 PITR + USD5 compute difference), before media backup, taxes and overages. Compute/PITR use hourly billing; recheck invoice estimate.
- [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project): object data and certain storage configuration are not automatically copied with a DB restore.
- [Storage downloads/export](https://supabase.com/docs/guides/storage/management/download-objects), [S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility): objects can be copied/exported; Supabase S3 bucket versioning is not supported.
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/): Standard USD0.015/GB-month; first 10 GB-month free; operation charges/allowances apply; Internet egress free. At 100 GB-month stored, the storage component is approximately USD1.35 after that free allowance, before operations/taxes/other services.
- [R2 object lifecycle](https://developers.cloudflare.com/r2/buckets/object-lifecycles/), [bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/): lifecycle deletion is possible; locks can override deletion. Avoid indefinite retention conflicts. R2 is not an S3-versioning replacement; use unique backup object keys and manifests.

The managed PITR proposal was withdrawn after U1; R2 remains unapproved/deferred pending the self-host topology. No purchase occurred. These historical prices are not the new production estimate or an approved recovery design.

## Self-host production branch after user change U1

- [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [custom SQL migrations](https://orm.drizzle.team/docs/kit-custom-migrations): the MVP keeps its Drizzle schema in TypeScript and uses versioned SQL migrations for security policies, grants, and transactional RPC functions.
- [Chrome Web NFC](https://developer.chrome.com/docs/capabilities/nfc): the NFC test-card writer uses a user-initiated NDEF URL write; Web NFC requires HTTPS/secure context, permission, supported hardware, and a visible/unlocked page. Physical-device validation remains open.

- [Supabase Docker self-hosting](https://supabase.com/docs/guides/self-hosting/docker), [overview](https://supabase.com/docs/guides/self-hosting): official Docker/Compose stack; operator owns server/security/update/PostgreSQL maintenance. Published all-services minimum 2 cores/4 GB RAM/40 GB SSD; recommended 4 cores/8 GB+/80 GB+ is a general starting point, not proof of MOMENTUS capacity. Managed backup/PITR and other platform features are not automatically included in self-hosting.
- [Managed-to-self-host database restore](https://supabase.com/docs/guides/self-hosting/restore-from-platform): roles/schema/data/Auth records need compatible versions/extensions; configuration/secrets are separate. Existing sessions require reauthentication when signing secrets change. Verify MFA continuity instead of assuming it.
- [Auth-user migration](https://supabase.com/kb/troubleshooting/migrating-auth-users-between-projects): stored password hashes can be preserved; preserving accounts is distinct from preserving valid sessions.
- [Storage transfer to self-host](https://supabase.com/docs/guides/self-hosting/copy-from-platform-s3): copy actual files through supported S3-compatible transfer and verify access. Direct copying into internal `volumes/storage` layout is unsupported.
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting): Node/container hosting, reverse proxy, environment and multi-instance cache considerations. Self-hosting app instances does not automatically synchronize their local caches.

Production components were settled in Q74: self-host Next.js and all Supabase services; use managed Supabase for development and retain Resend for email. Latest instruction is local-first via pnpm. Q75 is the physical NFC test origin; exact production host/resources/recovery are deferred as Q76. Do not assume these are discoverable from the empty local project or that Docker is installed remotely; locally Docker was not found.

## Philippine privacy primary sources

- [Data Privacy Act](https://privacy.gov.ph/data-privacy-act-/): general processing principles, sensitive information, rights and accountability.
- [Implementing rules](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/): purpose-based retention, outsourcing, rights and international-transfer safeguards. No universal wedding-gallery hosting duration was established by this review.
- [NPC consent guidance, Circular 2023-04](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf): notice is distinct from valid consent; a group submitter is not automatically another adult's lawful representative.
- [NPC right to be informed](https://privacy.gov.ph/the-right-to-be-informed/): disclose purposes, recipients, retention, controller/contact and rights.
- [NPC photo guidance](https://privacy.gov.ph/reminder-on-sharing-photos-and-videos-containing-personal-data/), [child-oriented transparency guidance](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf): identifiable images and children's processing require deliberate privacy handling.

Health/allergy/accessibility notes can reveal sensitive information. Business-organizer and direct-family customer arrangements need a factual assessment of controller/processor roles; do not label every couple a business controller automatically. Event-service emails are not a blanket legal exemption, and a post-event opt-in is a chosen product policy. Engineering safeguards and the selected retention periods are not a declaration of legal compliance.
