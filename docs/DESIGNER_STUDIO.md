# MOMENTUS Designer Studio (local preview)

## Open the editor

For the organizer workflow, open an existing event from **Your event studio** and choose **Open Designer Studio**. The event route requires verified email, MFA, and event access. Its draft is created/read through the authenticated database RPC and is saved to PostgreSQL with revision-based conflict protection. The reviewed migration must be applied to the isolated development database first.

The development-only local demo remains available as an isolated fixture from its admin workspace. It continues to use browser-local storage and does not represent the normal event workflow.

## Edit a starter design

Choose a template from the left panel. Search by name or filter by event category, then choose **Use template**. Replacing the current canvas asks for confirmation. Select an element on the canvas and edit its text directly; use the right style panel for typography, spacing, background, and borders. Drag blocks from the Blocks panel onto the canvas. The Layers panel shows the page structure.

The starter library currently includes Eternal Bloom, Golden Vows, Enchanted Garden, Timeless Ivory, Coastal Romance, Celestial Love, Sweet Eighteen, Midnight Glamour, Grand Gala, Modern Summit, Little Wonders, and Celebration Noir. These are original editable sample designs with sample event content, not approved published event pages.

## Preview and save

Use Desktop, Tablet, or Mobile to change the canvas viewport. Undo and redo operate on the current editor session. **Preview design** toggles GrapesJS preview mode. Real event drafts autosave complete GrapesJS project JSON to PostgreSQL after editing pauses and can also be saved with **Save draft**. A stale revision is rejected instead of overwriting the newer database draft; the current canvas stays open so its unsaved changes can be copied before reloading. Local-demo drafts still use browser local storage and are scoped to that mock event.

Database draft saving is implemented, but draft preview as a guest page, publishing, immutable snapshots, version history, restore, and public rendering are not yet available. The guest microsite route does not render the current database draft.

## MOMENTUS blocks and data

The Blocks panel has sample Event details, Our story, Event schedule, RSVP link, Photo gallery, and Event footer blocks. Their content is editable sample copy. The editor does not currently bind to live event data or private guest records. Do not put guest names, RSVP answers, seating, or claim information into a public design.

## Current limits

Import, uploaded media, animation controls, durable drafts, published versions, restore history, and public rendering are not implemented in this slice. Do not import untrusted content into a published site; the current prototype has no import sanitizer or publishing pipeline. Design templates are authored in `src/modules/microsites/designer-templates.ts`; add a distinct template entry with its own HTML, CSS, category, and description. Custom GrapesJS blocks are registered in `src/modules/microsites/ui/designer-studio.tsx` and must remain presentation-only.
