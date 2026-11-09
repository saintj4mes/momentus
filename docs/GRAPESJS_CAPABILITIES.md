# GrapesJS capability audit

**Audited package:** GrapesJS 0.23.9, resolved from the installed pnpm dependency. The feature work in this matrix is the Core batch only. `IMPLEMENTED BUT UNVERIFIED` means the integration is present in source and type-checks, but no interactive browser evidence has been collected yet. API availability from package typings or documentation is not runtime verification.

| Capability | Current MOMENTUS integration | Gap / boundary | Support | Priority | Status |
|---|---|---|---|---|---|
| Canvas | Responsive canvas, zoom, fullscreen and outline controls; preview command; hover/selection affordances | Visual browser pass and command-state polish | Native API + MOMENTUS toolbar | P1 | IMPLEMENTED BUT UNVERIFIED |
| DOM Components | GrapesJS component tree; editable event section definitions and standard text/link/image components | Component traits and component drag/resizing need runtime validation | Native | P1 | IMPLEMENTED BUT UNVERIFIED |
| Block Manager | Native categorized Basic, Layout, Media, Event, Wedding, Corporate and Universal blocks; component definitions; MOMENTUS name search | Preview thumbnails and some specialized blocks remain | Native manager + small search filter | P1 | PARTIAL |
| Style Manager | Typography, sizing, spacing, layout, backgrounds, borders, effects sectors | Some property controls and existing-style population need browser verification | Native | P1 | IMPLEMENTED BUT UNVERIFIED |
| Trait Manager | Native manager is mounted; link URL/target component traits are defined | Trait editing and persistence need browser verification; no server behavior traits | Native | P1 | IMPLEMENTED BUT UNVERIFIED |
| Layer / Navigator | Native Layer Manager mounted; selected layer actions include rename, duplicate, lock, visibility, delete | Layer tree interaction/reorder needs browser verification | Native | P1 | IMPLEMENTED BUT UNVERIFIED |
| Pages | Not configured | Multi-page microsites need page model, slug validation and UI | Native module + custom UI | P2 | NOT APPLICABLE TO BATCH 1 |
| Device Manager | Desktop/tablet/mobile devices with media breakpoints | Responsive CSS roundtrip needs browser verification | Native | P1 | IMPLEMENTED BUT UNVERIFIED |
| Asset Manager | Native API configured with uploads disabled | No MOMENTUS storage adapter, uploads or media library; intentionally disabled | Native modal + storage adapter | P3 | PARTIAL |
| Selector Manager | Native class manager mounted for reusable CSS selectors | Pseudo-state controls and reusable token library not configured | Native | P1 | IMPLEMENTED BUT UNVERIFIED |
| Rich Text Editor | Native inline editor actions enabled for common formatting | Toolbar visibility and safe paste behavior need browser validation | Native | P2 | IMPLEMENTED BUT UNVERIFIED |
| Commands | Native undo/redo/preview, copy/paste, delete, fullscreen, outline; custom save command | Keyboard and toolbar parity needs browser verification | Native + MOMENTUS command | P2 | IMPLEMENTED BUT UNVERIFIED |
| Keymaps | Save shortcut registered for Meta/Ctrl+S | Shortcut behavior and conflict behavior need browser verification | Native | P2 | IMPLEMENTED BUT UNVERIFIED |
| Undo Manager | Native undo/redo and expanded history depth | Complex edit sequence needs browser verification | Native | P2 | IMPLEMENTED BUT UNVERIFIED |
| Storage Manager | Disabled; MOMENTUS persists full GrapesJS project JSON through local demo or event draft adapter | Database migration/roundtrip is not verified; no claim of verified server persistence | MOMENTUS adapter | P1 | PARTIAL |
| CSS Composer | Used through GrapesJS style manager and project data | Generated and restored CSS needs visual roundtrip check | Native | P1 | IMPLEMENTED BUT UNVERIFIED |
| Parser | Existing starter templates load from their HTML/CSS source | User-facing import/sanitization flow is not implemented | Native parser + MOMENTUS validation | P3 | PARTIAL |
| Code Manager | Not exposed | No HTML/CSS export UI; avoid unsafe imports and scripts | Native API + safe MOMENTUS UI | P3 | NOT APPLICABLE TO BATCH 1 |
| Modal Dialog | No custom modals configured | Template replacement uses browser confirmation; future media/import modal needs design | Native API + custom UI | P3 | PARTIAL |
| Panels | Existing React workbench mounts native managers; GrapesJS default panels suppressed | Additional panels are controlled by React UI | Native API + MOMENTUS UI | P1 | IMPLEMENTED BUT UNVERIFIED |
| Internationalization | No custom locale configured | English-only editor copy currently | Native | P4 | NOT APPLICABLE |
| Plugin Manager | No third-party plugins added | Reassess only when a concrete gap and version/license/security fit are established | Native extension point | P4 | NOT APPLICABLE |
| Data Sources | Not used | Do not bind private RSVP/guest data into public design; approved synthetic event binding is a later MOMENTUS adapter | Native API varies by configuration + custom boundary | P3 | NOT APPLICABLE |

## Core batch implementation

- GrapesJS remains client-only in the existing Next.js application.
- Blocks use component definitions rather than opaque HTML strings. MOMENTUS event hero, details, story, schedule, venue, dress-code, gallery, RSVP presentation and footer blocks are editable component trees.
- Component editing uses native selection, layers, style/trait/selector managers, CSS classes and Canvas/Device APIs. Media upload remains off until an authorized event-scoped storage adapter exists.
- Event blocks are presentation only. Their sample date, venue, CTA and RSVP text do not drive guest identity, event authorization, RSVP submission, or claims.
- Templates remain the existing twelve source designs. A template replacement still asks before replacing the canvas.

## Lifecycle hooks and verification

The existing draft flow observes GrapesJS `update` events for unsaved state and autosave, and `component:selected` / `component:deselected` events for the inspector heading. Component types and blocks are registered through `editor.Components.addType` and `editor.Blocks.add`; no private GrapesJS internals are used.

On 5 November 2026, `pnpm typecheck`, targeted Biome checks for the editor module, and `pnpm build` passed. The Browser runtime was initialized, but `agent.browsers.list()` returned an empty list. Therefore all interactive editor capabilities remain unverified; no Playwright interactions or screenshots were captured. The database migration is still unapplied and the real-event save/restore path remains unverified.

## API references

- [GrapesJS Blocks](https://grapesjs.com/docs/modules/Blocks)
- [DOM Components API](https://grapesjs.com/docs/api/components.html)
- [Style Manager](https://grapesjs.com/docs/modules/Style-manager.html)
- [Trait Manager](https://grapesjs.com/docs/modules/Traits.html)
- [Layer Manager](https://grapesjs.com/docs/modules/Layers.html)
- [Canvas](https://grapesjs.com/docs/modules/Canvas.html)
- [Pages](https://grapesjs.com/docs/modules/Pages.html)
- [Assets](https://grapesjs.com/docs/modules/Assets.html)
- [Commands](https://grapesjs.com/docs/modules/Commands.html)
- [Storage](https://grapesjs.com/docs/modules/Storage.html)
- [GrapesJS repository](https://github.com/GrapesJS/grapesjs)
