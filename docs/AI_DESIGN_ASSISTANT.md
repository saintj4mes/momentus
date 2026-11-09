# MOMENTUS AI Design Assistant

## Provider configuration

The assistant is off by default. For a development-only deterministic provider, set `MOMENTUS_AI_DEMO_MODE=true`; the interface labels its responses as local samples and the provider never calls OpenAI. For the real provider, set `MOMENTUS_AI_ENABLED=true`, `MOMENTUS_AI_PROVIDER=openai`, optionally set `MOMENTUS_AI_MODEL`, and provide `OPENAI_API_KEY` as a server-only secret. Never use a `NEXT_PUBLIC_` variable for the key. No live API request is part of the local Playwright suite.

The OpenAI adapter uses the official JavaScript SDK Responses API, `responses.parse`, and Zod structured output. The default model is `gpt-6.1-sol`; provider timeout is 25 seconds with one retry, storage is disabled, and output is capped. See the [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses) and [GPT-6.1 Sol model reference](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

## Data and safety boundary

The endpoint requires a signed local-demo session or verified email, MFA AAL2, event authorization, and an RLS-scoped draft for real event use. It sends the provider a bounded prompt, recent conversation, page IDs/names/slugs, and component IDs/types/tags. It excludes component copy, styles, guest lists, RSVP details, seating, credentials, and private event records.

Proposals are schema-validated and restricted to page operations, known MOMENTUS component kinds, plain-text copy changes, an allowlist of CSS properties/values, supported theme values, and non-executable animation metadata. The browser validates context again. The designer shows a proposal preview; applying is an explicit user action and has a project snapshot undo. The assistant never accepts HTML, JavaScript, arbitrary CSS, commands, or complete GrapesJS project rewrites.

The deterministic demo is intentionally narrow, with sample gallery, page, and theme proposals; it is not an AI fallback. Real OpenAI account billing, live provider output, production authorization, and event database integration have not been exercised.

## Codex integration decision

Codex is used to implement and maintain the MOMENTUS feature. Codex App Server or Codex SDK is not embedded in the product: that would add local agent execution, tool permissions, and a separate authentication boundary beyond this controlled designer assistant. See the [Codex App Server documentation](https://learn.chatgpt.com/docs/app-server). Product AI remains a proposal-only, server-mediated OpenAI Responses integration; it cannot invoke Codex or project tools.

## Local checks

- `pnpm typecheck`
- `pnpm exec biome check src/modules/microsites/ui/designer-studio.tsx src/modules/microsites/ai src/app/api/designer/assistant/route.ts e2e playwright.config.ts`
- `pnpm build`
- `pnpm test:e2e`
