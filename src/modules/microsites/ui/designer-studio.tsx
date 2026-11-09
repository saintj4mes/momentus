"use client";

import type {
  Component,
  ComponentDefinition,
  Editor,
  Page,
  RichTextEditorAction,
} from "grapesjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveMicrositeDraft, publishMicrositeSnapshot } from "../actions";
import {
  type AssistantRequest,
  type DesignOperation,
  type DesignProposal,
  validateDesignProposal,
  validateProposalContext,
} from "../ai/operations";
import {
  designerDraftStorageKey,
  designerTemplates,
} from "../designer-templates";

type Props = {
  siteId?: string;
  eventId?: string;
  eventName: string;
  client: string;
  draftProject?: Record<string, unknown>;
  draftRevision?: number;
  experienceStage?: "before" | "during" | "after";
  eventType?:
    | "wedding"
    | "birthday"
    | "corporate"
    | "concert"
    | "fun-run"
    | "conference"
    | "community"
    | "custom";
};
type Category = "All" | (typeof designerTemplates)[number]["category"];
type DesignerPage = {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
};
type AssistantMode = "generate" | "selected" | "page" | "site" | "theme";
type AssistantMessage = { role: "user" | "assistant"; content: string };

function slugifyPage(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function pageSlug(page: Page) {
  const stored = page.get("slug");
  return typeof stored === "string"
    ? stored
    : slugifyPage(page.getName()) || page.getId();
}

function pageInfo(page: Page): DesignerPage {
  const title = page.get("title");
  const description = page.get("description");
  return {
    id: page.getId(),
    name: page.getName(),
    slug: pageSlug(page),
    title: typeof title === "string" ? title : page.getName(),
    description: typeof description === "string" ? description : "",
  };
}

function omitComponentIds(
  value: ComponentDefinition | ComponentDefinition[],
): ComponentDefinition | ComponentDefinition[] {
  if (Array.isArray(value))
    return value.map((item) => omitComponentIds(item) as ComponentDefinition);
  const { id: _id, components, ...rest } = value;
  return {
    ...rest,
    ...(components !== undefined
      ? {
          components:
            typeof components === "string"
              ? components
              : omitComponentIds(
                  components as ComponentDefinition | ComponentDefinition[],
                ),
        }
      : {}),
  };
}

function findPageComponent(
  editor: Editor,
  pageId: string,
  componentId: string,
) {
  const page = editor.Pages.get(pageId);
  if (!page) return undefined;
  let match: Component | undefined;
  page.getMainComponent().onAll((component) => {
    if (component.getId() === componentId) match = component;
  });
  return match;
}

function safeComponentDefinition(kind: zDesignComponentKind, pages: Page[]) {
  const text = (
    tagName: string,
    content: string,
    id?: string,
  ): ComponentDefinition => ({
    tagName,
    type: "text",
    components: content,
    ...(id ? { attributes: { id } } : {}),
  });
  const headings: Record<string, string> = {
    hero: "A celebration to remember",
    "event-details": "Event details",
    story: "Our story",
    schedule: "The schedule",
    venue: "Find the venue",
    "dress-code": "What to wear",
    gallery: "Photo gallery",
    rsvp: "We hope you can join us",
    footer: "With love",
    faq: "Frequently asked questions",
    speaker: "Speaker profile",
  };
  if (kind === "navigation") {
    const links = pages.map((page) => {
      const slug = pageSlug(page);
      return {
        tagName: "a",
        type: "link",
        components: page.getName(),
        attributes: {
          href: slug === pageSlug(pages[0]) ? "/" : `/${slug}`,
          "data-momentus-page-link": slug,
        },
      };
    });
    return {
      tagName: "nav",
      name: "Page navigation",
      classes: ["momentus-navigation"],
      components: links,
    } satisfies ComponentDefinition;
  }
  const title = text(
    kind === "speaker" ? "h3" : "h2",
    headings[kind] ?? "Event section",
    kind === "event-details" ? "details" : undefined,
  );
  const children: ComponentDefinition[] = [title];
  if (kind === "hero") {
    children.push(text("p", "Join us for a day worth remembering."));
    children.push({
      tagName: "a",
      type: "link",
      components: "Explore the event",
      attributes: { href: "#details" },
      classes: ["event-cta"],
    });
  } else if (kind === "gallery") {
    children.push({
      tagName: "div",
      classes: ["gallery-grid"],
      components: [
        { type: "image", attributes: { alt: "Describe this photo" } },
        { type: "image", attributes: { alt: "Describe this photo" } },
      ],
    });
  } else if (kind === "schedule") {
    children.push({
      tagName: "ul",
      components: [
        { tagName: "li", components: "4:00 PM · Guest arrival" },
        { tagName: "li", components: "5:00 PM · Celebration" },
      ],
    });
  } else if (kind === "venue") {
    children.push(text("p", "Add the venue name and address."));
  } else if (kind === "rsvp") {
    children.push(
      text("p", "Please reply using your private invitation link."),
    );
    children.push({
      tagName: "a",
      type: "link",
      components: "Respond to invitation",
      attributes: { href: "#" },
      classes: ["event-cta"],
    });
  } else if (kind !== "footer" && kind !== "dress-code") {
    children.push(text("p", "Add your event copy here."));
  }
  return {
    tagName: kind === "footer" ? "footer" : "section",
    name: headings[kind] ?? "Event section",
    classes: [`momentus-${kind}`],
    components: children,
  } satisfies ComponentDefinition;
}

type zDesignComponentKind =
  | "hero"
  | "event-details"
  | "story"
  | "schedule"
  | "venue"
  | "dress-code"
  | "gallery"
  | "rsvp"
  | "footer"
  | "navigation"
  | "faq"
  | "speaker";

function applyDesignerOperation(editor: Editor, operation: DesignOperation) {
  if (operation.action === "create_page") {
    const sections = operation.sections.map((kind) =>
      safeComponentDefinition(kind, editor.Pages.getAll()),
    );
    return editor.Pages.add(
      {
        id: `page-${crypto.randomUUID()}`,
        name: operation.pageName,
        slug: operation.pageSlug,
        title: operation.pageName,
        description: "",
        component: sections,
      },
      { select: true },
    );
  }
  if (operation.action === "update_page") {
    const page = editor.Pages.get(operation.pageId);
    if (!page)
      throw new Error("The page changed before the proposal was applied.");
    page.setName(operation.pageName);
    page.set({ slug: operation.pageSlug, title: operation.pageName });
    return page;
  }
  if (operation.action === "apply_theme") {
    const spacing =
      operation.spacing === "compact"
        ? "12px"
        : operation.spacing === "spacious"
          ? "36px"
          : "24px";
    const roots = editor.Pages.getAll().map((page) => page.getMainComponent());
    for (const root of roots) {
      root.addStyle({
        color: operation.colors.text,
        "background-color": operation.colors.background,
        "font-family": operation.bodyFont,
        padding: spacing,
        gap: spacing,
        "--momentus-primary": operation.colors.primary,
        "--momentus-accent": operation.colors.accent,
      });
      root.onAll((component) => {
        if (
          ["h1", "h2", "h3"].includes(String(component.get("tagName") ?? ""))
        ) {
          component.addStyle({
            "font-family": operation.headingFont,
            color: operation.colors.primary,
          });
        }
      });
    }
    return undefined;
  }
  if (operation.action === "add_component") {
    const page = editor.Pages.get(operation.pageId);
    if (!page)
      throw new Error("The page changed before the proposal was applied.");
    const parent = operation.parentId
      ? findPageComponent(editor, operation.pageId, operation.parentId)
      : page.getMainComponent();
    if (!parent) throw new Error("The insertion target no longer exists.");
    const definition = safeComponentDefinition(
      operation.componentType,
      editor.Pages.getAll(),
    );
    const after = operation.afterId
      ? findPageComponent(editor, operation.pageId, operation.afterId)
      : undefined;
    if (operation.afterId && (!after || after.parent() !== parent))
      throw new Error("The insertion point no longer exists.");
    const inserted = parent.append(
      definition,
      after ? { at: after.index() + 1 } : undefined,
    )[0];
    if (inserted) editor.select(inserted);
    return inserted;
  }
  const target = findPageComponent(
    editor,
    operation.pageId,
    operation.targetId,
  );
  if (!target)
    throw new Error("A component changed before the proposal was applied.");
  if (operation.action === "update_text") {
    const editable =
      target.getType() === "text" ? target : target.findType("text")[0];
    if (!editable)
      throw new Error("The selected component has no editable text.");
    editable.set("content", operation.text);
    editor.select(editable);
    return editable;
  }
  if (operation.action === "update_style") {
    target.addStyle({ [operation.property]: operation.value });
    editor.select(target);
    return target;
  }
  if (operation.action === "duplicate_component") {
    const parent = target.parent();
    if (!parent)
      throw new Error("The selected component cannot be duplicated.");
    const duplicate = parent.append(target.toJSON(), {
      at: target.index() + 1,
    })[0];
    if (duplicate) editor.select(duplicate);
    return duplicate;
  }
  if (operation.action === "remove_component") {
    if (target === editor.Pages.get(operation.pageId)?.getMainComponent())
      throw new Error("A page root cannot be removed.");
    target.remove();
    return undefined;
  }
  if (operation.action === "move_component") {
    const parent = operation.parentId
      ? findPageComponent(editor, operation.pageId, operation.parentId)
      : editor.Pages.get(operation.pageId)?.getMainComponent();
    if (!parent) throw new Error("The move destination no longer exists.");
    let ancestor: Component | undefined = parent;
    while (ancestor) {
      if (ancestor === target)
        throw new Error("A component cannot be moved inside itself.");
      ancestor = ancestor.parent();
    }
    const after = operation.afterId
      ? findPageComponent(editor, operation.pageId, operation.afterId)
      : undefined;
    if (
      operation.afterId &&
      (!after || after.parent() !== parent || after === target)
    )
      throw new Error("The move position no longer exists.");
    target.move(parent, { at: after ? after.index() + 1 : undefined });
    editor.select(target);
    return target;
  }
  if (operation.action === "configure_animation") {
    target.addAttributes({
      "data-momentus-animation": JSON.stringify({
        preset: operation.preset,
        durationMs: operation.durationMs,
        delayMs: operation.delayMs,
      }),
    });
    editor.select(target);
    return target;
  }
}

export function DesignerStudio({
  siteId,
  eventId,
  eventName,
  client,
  draftProject,
  draftRevision = 0,
  experienceStage = "before",
  eventType,
}: Props) {
  const localDraftKey = useMemo(
    () => `${designerDraftStorageKey}:${siteId}:${experienceStage}`,
    [siteId, experienceStage],
  );
  const dashboardHref = eventId ? `/organizer/events/${eventId}` : "/admin";
  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const draftRevisionRef = useRef(draftRevision);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflictRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState(
    eventId ? `Draft loaded · revision ${draftRevision}` : "Local draft",
  );
  const [query, setQuery] = useState("");
  const [blockQuery, setBlockQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [activeTemplate, setActiveTemplate] = useState(designerTemplates[0].id);
  const [device, setDevice] = useState("Desktop");
  const [zoom, setZoom] = useState(100);
  const [selectedComponent, setSelectedComponent] = useState("");
  const [rightTab, setRightTab] = useState<
    "styles" | "traits" | "classes" | "assistant"
  >("styles");
  const [tab, setTab] = useState<"templates" | "blocks" | "layers" | "pages">(
    "templates",
  );
  const [pages, setPages] = useState<DesignerPage[]>([]);
  const [activePageId, setActivePageId] = useState("");
  const [newPageName, setNewPageName] = useState("");
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("page");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<
    AssistantMessage[]
  >([]);
  const [assistantProposal, setAssistantProposal] = useState<
    | (DesignProposal & {
        provider: "openai" | "demo";
        usage: { inputTokens: number; outputTokens: number } | null;
      })
    | null
  >(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [assistantSnapshot, setAssistantSnapshot] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [assistantProvider, setAssistantProvider] = useState<
    "openai" | "demo" | null
  >(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const persistDraft = useCallback(
    (editor: Editor) => {
      if (!eventId) return Promise.resolve();
      const task = saveQueueRef.current.then(async () => {
        if (conflictRef.current) return;
        try {
          const result = await saveMicrositeDraft({
            eventId,
            projectData: editor.getProjectData() as unknown as Record<
              string,
              unknown
            >,
            expectedRevision: draftRevisionRef.current,
          });
          if (!result.ok) {
            if (result.conflict) conflictRef.current = true;
            setStatus(result.error);
            return;
          }
          draftRevisionRef.current = result.revision;
          setStatus(`Saved to database · revision ${result.revision}`);
        } catch {
          setStatus("Draft save failed · retrying after the next edit");
        }
      });
      saveQueueRef.current = task.catch(() => undefined);
      return task;
    },
    [eventId],
  );

  const visibleTemplates = useMemo(
    () =>
      designerTemplates.filter(
        (template) =>
          (category === "All" || template.category === category) &&
          `${template.name} ${template.description} ${template.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [category, query],
  );

  const refreshPages = useCallback((editor: Editor) => {
    let storedPages = editor.Pages.getAll();
    if (!storedPages.length) {
      editor.Pages.add({
        id: "home",
        name: "Home",
        slug: "home",
        title: "Home",
        description: "",
        component: [],
      });
      storedPages = editor.Pages.getAll();
    }
    storedPages.forEach((page) => {
      if (!page.get("slug"))
        page.set("slug", slugifyPage(page.getName()) || page.getId());
      if (!page.get("title")) page.set("title", page.getName());
      if (page.get("description") === undefined) page.set("description", "");
    });
    setPages(storedPages.map(pageInfo));
    const selected = editor.Pages.getSelected() ?? editor.Pages.getMain();
    setActivePageId(selected.getId());
  }, []);

  function selectPage(id: string) {
    const editor = editorRef.current;
    if (!editor?.Pages.get(id)) return;
    editor.Pages.select(id);
    setActivePageId(id);
    setContextMenu(null);
  }

  function createPage(name = newPageName) {
    const editor = editorRef.current;
    const cleanName = name.trim().slice(0, 60);
    if (!editor || !cleanName) return;
    const baseSlug = slugifyPage(cleanName) || "page";
    let slug = baseSlug;
    let suffix = 2;
    while (pages.some((page) => page.slug === slug))
      slug = `${baseSlug}-${suffix++}`;
    const id = `page-${crypto.randomUUID()}`;
    const page = editor.Pages.add(
      {
        id,
        name: cleanName,
        slug,
        title: cleanName,
        description: "",
        component: [
          {
            tagName: "section",
            name: cleanName,
            components: [
              { tagName: "h1", type: "text", components: cleanName },
            ],
          },
        ],
      },
      { select: true },
    );
    if (page) {
      setActivePageId(page.getId());
      setNewPageName("");
      setNewPageOpen(false);
      setTab("pages");
    }
  }

  function duplicatePage() {
    const editor = editorRef.current;
    const page = editor?.Pages.getSelected();
    if (!editor || !page) return;
    const baseSlug = `${pageSlug(page)}-copy`;
    let slug = baseSlug;
    let suffix = 2;
    while (pages.some((item) => item.slug === slug))
      slug = `${baseSlug}-${suffix++}`;
    const children: ComponentDefinition[] = page
      .getMainComponent()
      .components()
      .models.map((component: Component) => component.toJSON());
    const duplicate = editor.Pages.add(
      {
        id: `page-${crypto.randomUUID()}`,
        name: `${page.getName()} copy`,
        slug,
        title: `${pageInfo(page).title} copy`,
        description: pageInfo(page).description,
        component: omitComponentIds(children),
      },
      { select: true },
    );
    if (duplicate) setActivePageId(duplicate.getId());
  }

  function addPageNavigation() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.addComponents(
      safeComponentDefinition("navigation", editor.Pages.getAll()),
    );
    setStatus("Page navigation added · save to keep this draft");
  }

  function deletePage(id: string) {
    const editor = editorRef.current;
    if (!editor || editor.Pages.getAll().length <= 1) return;
    const page = editor.Pages.get(id);
    if (
      !page ||
      !window.confirm(
        `Delete “${page.getName()}”? This page will be removed from this design.`,
      )
    )
      return;
    editor.Pages.remove(page);
    refreshPages(editor);
  }

  function setHomePage(id: string) {
    const editor = editorRef.current;
    const page = editor?.Pages.get(id);
    if (!editor || !page) return;
    editor.Pages.move(page, { at: 0 });
    refreshPages(editor);
  }

  function updatePageField(
    id: string,
    field: "name" | "slug" | "title" | "description",
    value: string,
  ) {
    const editor = editorRef.current;
    const page = editor?.Pages.get(id);
    if (!editor || !page) return;
    if (field === "name") page.setName(value.slice(0, 60));
    else if (field === "slug") {
      const slug = slugifyPage(value);
      if (!slug || pages.some((item) => item.id !== id && item.slug === slug)) {
        setStatus(
          "Use a unique page slug made of letters, numbers, and hyphens.",
        );
        return;
      }
      page.set("slug", slug);
    } else
      page.set(
        field,
        value.slice(field === "title" ? 0 : 0, field === "title" ? 100 : 240),
      );
    refreshPages(editor);
  }

  useEffect(() => {
    let disposed = false;
    let editor: Editor | null = null;

    async function initialize() {
      const grapesjs = (await import("grapesjs")).default;
      if (disposed || !canvasRef.current) return;
      const initializedEditor = grapesjs.init({
        container: canvasRef.current,
        height: "100%",
        width: "auto",
        fromElement: false,
        storageManager: { autosave: false, autoload: false },
        showOffsets: true,
        showOffsetsSelected: true,
        showToolbar: true,
        nativeDnD: true,
        multipleSelection: true,
        noticeOnUnload: true,
        undoManager: { maximumStackLength: 500 },
        selectorManager: {
          appendTo: "#designer-selectors",
          componentFirst: true,
        },
        traitManager: { appendTo: "#designer-traits" },
        blockManager: { appendTo: "#designer-blocks" },
        layerManager: { appendTo: "#designer-layers" },
        pageManager: {},
        assetManager: { upload: false, assets: [] },
        canvas: {
          styles: [],
          scrollableCanvas: true,
          allowExternalDrop: false,
        },
        richTextEditor: {
          actions: [
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "link",
            "wrap",
            ...richTextActionDefinitions(),
          ] as unknown as string[],
          onPaste: ({ ev, rte }) => {
            const plainText = ev.clipboardData?.getData("text/plain") ?? "";
            ev.preventDefault();
            if (plainText) rte.exec("insertText", plainText);
          },
        },
        styleManager: {
          appendTo: "#designer-styles",
          sectors: [
            {
              name: "Typography",
              open: true,
              properties: [
                "font-family",
                "font-size",
                "font-weight",
                "letter-spacing",
                "color",
                "font-style",
                "line-height",
                "text-align",
                "text-decoration",
                "text-transform",
                "text-shadow",
              ],
            },
            {
              name: "Size & spacing",
              open: false,
              properties: [
                "width",
                "height",
                "min-width",
                "min-height",
                "max-width",
                "max-height",
                "margin",
                "padding",
                "gap",
              ],
            },
            {
              name: "Layout",
              open: false,
              properties: [
                "display",
                "position",
                "top",
                "right",
                "bottom",
                "left",
                "z-index",
                "overflow",
                "flex-direction",
                "flex-wrap",
                "align-items",
                "justify-content",
                "grid-template-columns",
                "grid-template-rows",
                "grid-auto-flow",
              ],
            },
            {
              name: "Background",
              open: false,
              properties: [
                "background-color",
                "background-image",
                "background-size",
                "background-position",
                "background-repeat",
                "background-image",
              ],
            },
            {
              name: "Border & shadow",
              open: false,
              properties: [
                "border",
                "border-radius",
                "box-shadow",
                "opacity",
                "filter",
                "transform",
              ],
            },
          ],
        },
        deviceManager: {
          devices: [
            { id: "Desktop", name: "Desktop", width: "" },
            {
              id: "Tablet",
              name: "Tablet",
              width: "768px",
              widthMedia: "992px",
            },
            {
              id: "Mobile",
              name: "Mobile",
              width: "375px",
              widthMedia: "480px",
            },
          ],
        },
        panels: { defaults: [] },
        keymaps: {
          defaults: {
            "momentus:save": {
              keys: "⌘+s, ctrl+s",
              handler: "momentus:save",
              opts: { prevent: true },
            },
          },
        },
      });
      editor = initializedEditor;
      editorRef.current = initializedEditor;
      registerDesignerComponents(initializedEditor, eventName, client);
      registerDesignerBlocks(initializedEditor);
      initializedEditor.Commands.add("momentus:save", () => {
        if (eventId) {
          void persistDraft(initializedEditor);
        } else {
          window.localStorage.setItem(
            localDraftKey,
            JSON.stringify(initializedEditor.getProjectData()),
          );
          setStatus("Saved in this browser");
        }
      });
      registerProductivityCommands(initializedEditor, {
        onContextClose: () => setContextMenu(null),
      });
      const stored = eventId
        ? null
        : window.localStorage.getItem(localDraftKey);
      if (draftProject && Object.keys(draftProject).length > 0) {
        editor.loadProjectData(draftProject);
        setStatus(`Database draft · revision ${draftRevision}`);
      } else if (stored) {
        try {
          editor.loadProjectData(JSON.parse(stored));
          setStatus("Draft restored from this browser");
        } catch {
          editor.setComponents(designerTemplates[0].html);
          editor.setStyle(designerTemplates[0].css);
          setStatus("Starter design loaded");
        }
      } else {
        editor.setComponents(designerTemplates[0].html);
        editor.setStyle(designerTemplates[0].css);
        setStatus("Starter design loaded");
      }
      editor.on("update", () => {
        setStatus("Unsaved changes");
        if (eventId) {
          if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
          const currentEditor = editor;
          autosaveTimerRef.current = setTimeout(() => {
            if (currentEditor) void persistDraft(currentEditor);
          }, 900);
        }
      });
      editor.on("component:selected", (component) => {
        setSelectedComponent(component.getName());
      });
      editor.on("component:deselected", () => {
        const selected = editor?.getSelected();
        setSelectedComponent(selected?.getName() ?? "");
      });
      initializedEditor.on("page:add", () => refreshPages(initializedEditor));
      initializedEditor.on("page:remove", () =>
        refreshPages(initializedEditor),
      );
      initializedEditor.on("page:update", () =>
        refreshPages(initializedEditor),
      );
      initializedEditor.on("page:select", (page) => {
        setActivePageId(page.getId());
        setContextMenu(null);
      });
      initializedEditor.on(
        "canvas:frame:load:body",
        ({ window: frameWindow }) => {
          frameWindow.document.addEventListener("keydown", (event) => {
            handleCanvasShortcut(initializedEditor, event);
          });
          frameWindow.document.addEventListener("click", (event) => {
            if (!initializedEditor.Commands.isActive("core:preview")) return;
            const target = event.target as Element | null;
            const link = target?.closest<HTMLElement>(
              "[data-momentus-page-link]",
            );
            const slug = link?.dataset.momentusPageLink;
            const destination =
              slug &&
              initializedEditor.Pages.getAll().find(
                (item) => pageSlug(item) === slug,
              );
            if (!destination) return;
            event.preventDefault();
            initializedEditor.Pages.select(destination);
            setActivePageId(destination.getId());
          });
          frameWindow.document.addEventListener("contextmenu", (event) => {
            const target = event.target as Element | null;
            const activePage = initializedEditor.Pages.getSelected();
            if (!target || !activePage) return;
            let hit: Component | null = null;
            activePage.getMainComponent().onAll((component) => {
              const element = component.getEl();
              if (element && (element === target || element.contains(target)))
                hit = component;
            });
            if (!hit) return;
            event.preventDefault();
            initializedEditor.select(hit);
            const frame =
              initializedEditor.Canvas.getFrameEl().getBoundingClientRect();
            setContextMenu({
              x: Math.min(frame.left + event.clientX, window.innerWidth - 190),
              y: Math.min(frame.top + event.clientY, window.innerHeight - 180),
            });
          });
        },
      );
      refreshPages(initializedEditor);
      setReady(true);
    }

    void initialize();
    return () => {
      disposed = true;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      editor?.destroy();
      editorRef.current = null;
    };
  }, [
    client,
    draftProject,
    draftRevision,
    eventId,
    eventName,
    persistDraft,
    refreshPages,
    localDraftKey,
  ]);

  async function saveDraft() {
    const editor = editorRef.current;
    if (!editor) return;
    if (eventId) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      await persistDraft(editor);
      return;
    }
    window.localStorage.setItem(
      localDraftKey,
      JSON.stringify(editor.getProjectData()),
    );
    setStatus("Saved in this browser");
  }

  async function publishMicrosite() {
    const editor = editorRef.current;
    if (!editor || publishing) return;
    setPublishing(true);
    setStatus("Compiling and publishing microsite snapshot…");
    try {
      const project = editor.getProjectData() as unknown as Record<
        string,
        unknown
      >;
      const result = await publishMicrositeSnapshot({
        eventId,
        slug: siteId,
        projectData: project,
        expectedRevision: draftRevisionRef.current,
      });
      if (!result.ok) {
        setStatus(`Publish failed: ${result.error}`);
        setPublishing(false);
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `momentus:published:${siteId || "amara-luca"}`,
          JSON.stringify({
            project,
            publishedAt: new Date().toISOString(),
            revision: result.revision,
            url: result.url,
          }),
        );
      }
      draftRevisionRef.current = result.revision;
      setPublishedUrl(result.url);
      setStatus(`Published successfully! · Revision ${result.revision}`);
    } catch {
      setStatus("Publishing failed · please retry");
    } finally {
      setPublishing(false);
    }
  }

  function downloadRecoveryCopy() {
    const data = editorRef.current?.getProjectData();
    if (!data || !eventId) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `momentus-${eventId}-unsaved-draft.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function applyTemplate(templateId: string) {
    const template = designerTemplates.find((entry) => entry.id === templateId);
    if (!template || !editorRef.current) return;
    if (
      !window.confirm(
        `Replace the current canvas with “${template.name}”? Save a copy first if you want to keep these changes.`,
      )
    )
      return;
    editorRef.current.setComponents(template.html);
    editorRef.current.setStyle(template.css);
    setActiveTemplate(template.id);
    setStatus(`${template.name} loaded · save to keep this draft`);
  }

  function command(action: "undo" | "redo" | "preview") {
    const editor = editorRef.current;
    if (!editor) return;
    if (action === "undo") editor.UndoManager.undo();
    if (action === "redo") editor.UndoManager.redo();
    if (action === "preview") editor.runCommand("core:preview");
  }

  function editorCommand(commandId: string) {
    editorRef.current?.runCommand(commandId);
  }

  function changeZoom(delta: number) {
    const editor = editorRef.current;
    if (!editor) return;
    const next = Math.max(40, Math.min(130, zoom + delta));
    editor.Canvas.setZoom(next);
    setZoom(next);
  }

  function duplicateSelected() {
    const selected = editorRef.current?.getSelected();
    const parent = selected?.parent();
    if (!selected || !parent) return;
    const duplicate = parent.append(selected.toJSON())[0];
    if (duplicate) editorRef.current?.select(duplicate);
  }

  function deleteSelected() {
    editorRef.current?.getSelected()?.remove();
  }

  function toggleSelectedVisibility() {
    const selected = editorRef.current?.getSelected();
    if (!selected) return;
    if (selected.getStyle().display === "none") selected.removeStyle("display");
    else selected.addStyle({ display: "none" });
  }

  function toggleSelectedLock() {
    const selected = editorRef.current?.getSelected();
    if (selected) selected.set("locked", !selected.get("locked"));
  }

  function renameSelected() {
    const selected = editorRef.current?.getSelected();
    if (!selected) return;
    const name = window.prompt("Layer name", selected.getName());
    if (name?.trim()) selected.setName(name.trim());
  }

  function filterBlocks(value: string) {
    setBlockQuery(value);
    const root = document.querySelector("#designer-blocks");
    root?.querySelectorAll<HTMLElement>(".gjs-block").forEach((block) => {
      block.hidden = !block.textContent
        ?.toLowerCase()
        .includes(value.toLowerCase());
    });
  }

  function buildAssistantRequest(
    prompt: string,
    mode = assistantMode,
  ): AssistantRequest | null {
    const editor = editorRef.current;
    const activePage = editor?.Pages.getSelected();
    if (!editor || !activePage) return null;
    const roots = activePage.getMainComponent().components().slice(0, 30);
    const tree = roots.map((component) => ({
      id: component.getId(),
      type: component.getType(),
      tag: String(component.get("tagName") ?? "div"),
      children: component
        .components()
        .slice(0, 12)
        .map((child) => ({
          id: child.getId(),
          type: child.getType(),
          tag: String(child.get("tagName") ?? "div"),
        })),
    }));
    const selected = editor.getSelected();
    if (
      selected &&
      !tree.some(
        (root) =>
          root.id === selected.getId() ||
          root.children.some((child) => child.id === selected.getId()),
      )
    ) {
      tree.push({
        id: selected.getId(),
        type: selected.getType(),
        tag: String(selected.get("tagName") ?? "div"),
        children: [],
      });
    }
    return {
      mode,
      prompt,
      ...(eventId ? { eventId } : { siteId: siteId ?? "local-demo" }),
      context: {
        ...(eventType ? { eventType } : {}),
        experienceStage,
        activePageId: activePage.getId(),
        pages: editor.Pages.getAll()
          .slice(0, 12)
          .map((page) => ({
            id: page.getId(),
            name: page.getName(),
            slug: pageSlug(page),
          })),
        selectedComponentId: selected?.getId() ?? "",
        tree,
      },
      history: assistantMessages.slice(-6),
    };
  }

  async function requestAssistant(prompt = assistantPrompt) {
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 3 || cleanPrompt.length > 1000) {
      setAssistantError("Enter a request between 3 and 1,000 characters.");
      return;
    }
    const requestData = buildAssistantRequest(cleanPrompt);
    if (!requestData) return;
    setAssistantBusy(true);
    setAssistantError("");
    setAssistantProposal(null);
    try {
      const response = await fetch("/api/designer/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const result = (await response.json()) as {
        error?: string;
        provider?: "openai" | "demo";
        usage?: { inputTokens: number; outputTokens: number } | null;
        proposal?: unknown;
      };
      if (!response.ok || !result.proposal || !result.provider) {
        throw new Error(
          result.error || "The design assistant could not prepare a proposal.",
        );
      }
      const validation = validateDesignProposal(result.proposal);
      if (!validation.success) throw new Error(validation.error);
      const contextError = validateProposalContext(
        validation.data,
        requestData,
      );
      if (contextError) throw new Error(contextError);
      setAssistantProposal({
        ...validation.data,
        provider: result.provider,
        usage: result.usage ?? null,
      });
      setAssistantProvider(result.provider);
      setAssistantMessages((messages) => [
        ...messages.slice(-4),
        { role: "user", content: cleanPrompt },
        { role: "assistant", content: validation.data.summary },
      ]);
    } catch (error) {
      setAssistantError(
        error instanceof Error
          ? error.message
          : "The design assistant is unavailable.",
      );
    } finally {
      setAssistantBusy(false);
    }
  }

  function applyAssistantProposal() {
    const editor = editorRef.current;
    const proposal = assistantProposal;
    if (!editor || !proposal) return;
    const currentContext = buildAssistantRequest(
      assistantPrompt || "Apply proposal",
    );
    if (!currentContext) return;
    const validated = validateDesignProposal({
      summary: proposal.summary,
      operations: proposal.operations,
    });
    if (!validated.success) {
      setAssistantError(validated.error);
      return;
    }
    const contextError = validateProposalContext(
      validated.data,
      currentContext,
    );
    if (contextError) {
      setAssistantError(
        "The design changed after this proposal. Generate a fresh proposal before applying it.",
      );
      return;
    }
    const snapshot = structuredClone(
      editor.getProjectData(),
    ) as unknown as Record<string, unknown>;
    setAssistantSnapshot(snapshot);
    try {
      for (const operation of validated.data.operations)
        applyDesignerOperation(editor, operation);
      refreshPages(editor);
      setAssistantProposal(null);
      setAssistantError("");
      setStatus("AI changes applied · unsaved");
    } catch (error) {
      editor.loadProjectData(snapshot);
      refreshPages(editor);
      setAssistantSnapshot(null);
      setAssistantError(
        error instanceof Error
          ? error.message
          : "The proposal could not be applied; the original design was restored.",
      );
    }
  }

  function revertAssistantChange() {
    const editor = editorRef.current;
    if (!editor || !assistantSnapshot) return;
    editor.loadProjectData(assistantSnapshot);
    refreshPages(editor);
    setAssistantSnapshot(null);
    setStatus("AI change reverted · unsaved");
  }

  function cancelAssistantProposal() {
    setAssistantProposal(null);
    setAssistantError("");
  }

  return (
    <main
      className="designer-shell"
      onKeyDownCapture={(event) => {
        const editor = editorRef.current;
        if (editor) handleCanvasShortcut(editor, event.nativeEvent);
      }}
    >
      <header className="designer-topbar">
        <Link href={dashboardHref} className="designer-brand">
          <span className="wordmark-symbol">m</span>
          <span>MOMENTUS</span>
        </Link>
        <div className="designer-event-title">
          <strong>{eventName}</strong>
          <span>{client} · Microsite designer</span>
        </div>
        <label className="designer-page-selector-label">
          <span>Page</span>
          <select
            aria-label="Active page"
            disabled={!ready || pages.length === 0}
            onChange={(event) => selectPage(event.target.value)}
            value={activePageId}
          >
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
        </label>
        <div className="designer-status">
          <i />
          {status}
          {conflictRef.current && (
            <span className="designer-conflict-actions">
              <button onClick={downloadRecoveryCopy} type="button">
                Download unsaved copy
              </button>
              <button onClick={() => window.location.reload()} type="button">
                Load latest draft
              </button>
            </span>
          )}
        </div>
        <div className="designer-toolbar-group">
          <button
            aria-label="Undo"
            disabled={!ready}
            onClick={() => command("undo")}
            type="button"
          >
            ↶
          </button>
          <button
            aria-label="Redo"
            disabled={!ready}
            onClick={() => command("redo")}
            type="button"
          >
            ↷
          </button>
          <span className="designer-toolbar-divider" />
          {(["Desktop", "Tablet", "Mobile"] as const).map((size) => (
            <button
              aria-pressed={device === size}
              className="designer-device"
              key={size}
              onClick={() => {
                setDevice(size);
                editorRef.current?.setDevice(size);
              }}
              type="button"
            >
              {size}
            </button>
          ))}
          <button
            aria-label="Zoom out"
            disabled={!ready}
            onClick={() => changeZoom(-10)}
            type="button"
          >
            −
          </button>
          <span className="designer-zoom-readout" aria-live="polite">
            {zoom}%
          </span>
          <button
            aria-label="Zoom in"
            disabled={!ready}
            onClick={() => changeZoom(10)}
            type="button"
          >
            +
          </button>
          <button
            aria-label="Toggle component outline"
            disabled={!ready}
            onClick={() => editorCommand("core:component-outline")}
            type="button"
          >
            Outline
          </button>
          <button
            aria-label="Toggle fullscreen"
            disabled={!ready}
            onClick={() => editorCommand("core:fullscreen")}
            type="button"
          >
            Fullscreen
          </button>
          <button
            className="designer-save"
            disabled={!ready}
            onClick={() => void saveDraft()}
            type="button"
          >
            Save draft
          </button>
          <button
            className="designer-save"
            data-testid="designer-publish-btn"
            disabled={!ready || publishing}
            onClick={() => void publishMicrosite()}
            style={{
              backgroundColor: "#19352d",
              borderColor: "#c8a870",
              color: "#f5f0e8",
              fontWeight: 600,
            }}
            type="button"
          >
            {publishing ? "Publishing…" : "Publish Live 🚀"}
          </button>
          <button
            className="designer-quiet-link"
            disabled={!ready}
            onClick={() => command("preview")}
            type="button"
          >
            Preview design
          </button>
          <button
            onClick={() => setShortcutHelpOpen(true)}
            type="button"
            aria-label="Keyboard shortcuts"
          >
            Shortcuts
          </button>
        </div>
        <Link className="designer-exit" href={dashboardHref}>
          Exit
        </Link>
      </header>
      {publishedUrl && (
        <aside
          aria-label="Published notification"
          data-testid="published-banner"
          style={{
            alignItems: "center",
            backgroundColor: "#0c2820",
            borderBottom: "1px solid #c8a870",
            color: "#f5f0e8",
            display: "flex",
            fontSize: "0.85rem",
            justifyContent: "space-between",
            padding: "8px 20px",
            zIndex: 30,
          }}
        >
          <span>
            ✨ <strong>Live Snapshot Published:</strong> Guests and clients can
            view your experience at{" "}
            <code
              style={{
                color: "#c8a870",
                background: "rgba(200,168,112,0.15)",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              {publishedUrl}
            </code>
          </span>
          <div style={{ alignItems: "center", display: "flex", gap: "10px" }}>
            <a
              href={publishedUrl}
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#c8a870",
                borderRadius: "4px",
                color: "#0c2820",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "4px 12px",
                textDecoration: "none",
              }}
              target="_blank"
            >
              Open Live Microsite ↗
            </a>
            <button
              onClick={() => setPublishedUrl(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#e8ded1",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              type="button"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
      <div className="designer-workbench">
        <aside className="designer-sidebar designer-left">
          <nav className="designer-tabs" aria-label="Designer tools">
            {(
              [
                ["templates", "Templates"],
                ["blocks", "Blocks"],
                ["layers", "Layers"],
                ["pages", "Pages"],
              ] as const
            ).map(([id, label]) => (
              <button
                aria-pressed={tab === id}
                key={id}
                onClick={() => setTab(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "templates" && (
            <div className="designer-template-browser">
              <div className="designer-sidebar-heading">
                <strong>Starter designs</strong>
                <small>{designerTemplates.length} original templates</small>
              </div>
              <input
                aria-label="Search templates"
                className="designer-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search designs"
                value={query}
              />
              <select
                aria-label="Filter template category"
                className="designer-search"
                onChange={(event) =>
                  setCategory(event.target.value as Category)
                }
                value={category}
              >
                {[
                  "All",
                  ...new Set(designerTemplates.map((item) => item.category)),
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <div className="designer-template-list">
                {visibleTemplates.map((template) => (
                  <article
                    className={`designer-template-card${activeTemplate === template.id ? " selected" : ""}`}
                    key={template.id}
                  >
                    <div
                      className={`designer-template-preview template-${template.id}`}
                    >
                      <span>
                        {template.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="designer-template-meta">
                      <strong>{template.name}</strong>
                      <small>
                        {template.category} · {template.mood}
                      </small>
                      <p>{template.description}</p>
                      <button
                        onClick={() => applyTemplate(template.id)}
                        type="button"
                      >
                        Use template
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          {tab === "pages" && (
            <div className="designer-pages-panel">
              <div className="designer-sidebar-heading">
                <strong>Microsite pages</strong>
                <small>
                  {pages.length} page{pages.length === 1 ? "" : "s"} · saved
                  with this project
                </small>
              </div>
              <div className="designer-page-list">
                {pages.map((page, index) => (
                  <div
                    className={`designer-page-row${page.id === activePageId ? " selected" : ""}`}
                    key={page.id}
                  >
                    <button
                      className="designer-page-select"
                      onClick={() => selectPage(page.id)}
                      type="button"
                    >
                      {page.name}
                    </button>
                    {index === 0 && (
                      <span className="designer-home-badge">Home</span>
                    )}
                  </div>
                ))}
              </div>
              {pages.length > 0 &&
                (() => {
                  const page = pages.find((item) => item.id === activePageId);
                  if (!page) return null;
                  return (
                    <div className="designer-page-metadata">
                      <label>
                        Page name
                        <input
                          key={`${page.id}-name`}
                          defaultValue={page.name}
                          onBlur={(event) =>
                            updatePageField(page.id, "name", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Page slug
                        <input
                          key={`${page.id}-slug`}
                          defaultValue={page.slug}
                          onBlur={(event) =>
                            updatePageField(page.id, "slug", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Browser title
                        <input
                          key={`${page.id}-title`}
                          defaultValue={page.title}
                          onBlur={(event) =>
                            updatePageField(
                              page.id,
                              "title",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          key={`${page.id}-description`}
                          defaultValue={page.description}
                          onBlur={(event) =>
                            updatePageField(
                              page.id,
                              "description",
                              event.target.value,
                            )
                          }
                          rows={3}
                        />
                      </label>
                      <div className="designer-page-actions">
                        <button
                          disabled={pages[0]?.id === page.id}
                          onClick={() => setHomePage(page.id)}
                          type="button"
                        >
                          Set as home
                        </button>
                        <button onClick={duplicatePage} type="button">
                          Duplicate
                        </button>
                        <button
                          disabled={pages.length <= 1}
                          onClick={() => deletePage(page.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })()}
              {newPageOpen ? (
                <form
                  className="designer-new-page-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createPage();
                  }}
                >
                  <label>
                    New page name
                    <input
                      maxLength={60}
                      onChange={(event) => setNewPageName(event.target.value)}
                      value={newPageName}
                    />
                  </label>
                  <button disabled={!newPageName.trim()} type="submit">
                    Create page
                  </button>
                  <button onClick={() => setNewPageOpen(false)} type="button">
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  className="designer-add-page"
                  onClick={() => setNewPageOpen(true)}
                  type="button"
                >
                  + Add page
                </button>
              )}
              <button
                className="designer-add-page"
                onClick={addPageNavigation}
                type="button"
              >
                Add page navigation
              </button>
            </div>
          )}
          {tab === "blocks" && (
            <input
              aria-label="Search blocks"
              className="designer-search"
              onChange={(event) => filterBlocks(event.target.value)}
              placeholder="Search blocks"
              value={blockQuery}
            />
          )}
          <div
            className="designer-manager"
            id="designer-blocks"
            hidden={tab !== "blocks"}
          />
          <div
            className="designer-manager"
            id="designer-layers"
            hidden={tab !== "layers"}
          />
          <div className="designer-demo-notice">
            {eventId
              ? "Event draft · Changes autosave to the database. Publishing is not enabled."
              : "Local demo only · Drafts stay in this browser and are not published."}
          </div>
        </aside>
        <section className="designer-canvas-area" aria-label="Microsite canvas">
          <div className="designer-canvas-caption">
            <span>PAGE CANVAS</span>
            <span>{device} preview</span>
          </div>
          <div
            className={`designer-canvas-frame device-${device.toLowerCase()}`}
          >
            <div className="designer-canvas" ref={canvasRef} />
          </div>
          {!ready && (
            <div className="designer-loading">Loading visual editor…</div>
          )}
        </section>
        <aside className="designer-sidebar designer-right">
          <nav className="designer-tabs" aria-label="Appearance tools">
            {(["styles", "traits", "classes", "assistant"] as const).map(
              (id) => (
                <button
                  aria-pressed={rightTab === id}
                  key={id}
                  onClick={() => setRightTab(id)}
                  type="button"
                >
                  {id === "styles"
                    ? "Styles"
                    : id === "traits"
                      ? "Properties"
                      : id === "classes"
                        ? "CSS classes"
                        : "AI assistant"}
                </button>
              ),
            )}
          </nav>
          <div className="designer-sidebar-heading">
            <strong>Selected element</strong>
            <small>
              {selectedComponent || "Select an item on the canvas to edit it"}
            </small>
          </div>
          <div className="designer-component-actions">
            <button
              disabled={!selectedComponent}
              onClick={() => editorCommand("core:copy")}
              type="button"
            >
              Copy
            </button>
            <button
              disabled={!selectedComponent}
              onClick={duplicateSelected}
              type="button"
            >
              Duplicate
            </button>
            <button
              disabled={!selectedComponent}
              onClick={renameSelected}
              type="button"
            >
              Rename
            </button>
            <button
              disabled={!selectedComponent}
              onClick={toggleSelectedVisibility}
              type="button"
            >
              Hide / show
            </button>
            <button
              disabled={!selectedComponent}
              onClick={toggleSelectedLock}
              type="button"
            >
              Lock / unlock
            </button>
            <button
              disabled={!selectedComponent}
              onClick={deleteSelected}
              type="button"
            >
              Delete
            </button>
            <button onClick={() => editorCommand("core:paste")} type="button">
              Paste
            </button>
          </div>
          <div
            className="designer-manager designer-style-manager"
            id="designer-styles"
            hidden={rightTab !== "styles"}
          />
          <div
            className="designer-manager"
            id="designer-traits"
            hidden={rightTab !== "traits"}
          />
          <div
            className="designer-manager"
            id="designer-selectors"
            hidden={rightTab !== "classes"}
          />
          <section
            className="designer-assistant-panel"
            hidden={rightTab !== "assistant"}
            aria-label="AI design assistant"
          >
            <div className="designer-sidebar-heading">
              <strong>Design assistant</strong>
              <small>
                {assistantProvider === "demo"
                  ? "Local demo · sample proposals"
                  : assistantProvider === "openai"
                    ? "OpenAI Responses · server-side"
                    : "Proposals require your approval before applying"}
              </small>
            </div>
            {assistantMessages.length > 0 && (
              <div className="designer-assistant-history" aria-live="polite">
                {assistantMessages.slice(-6).map((message) => (
                  <p
                    className={`designer-assistant-message ${message.role}`}
                    key={`${message.role}-${message.content}`}
                  >
                    <strong>
                      {message.role === "user" ? "You" : "Assistant"}
                    </strong>
                    {message.content}
                  </p>
                ))}
              </div>
            )}
            <form
              className="designer-assistant-form"
              onSubmit={(event) => {
                event.preventDefault();
                void requestAssistant();
              }}
            >
              <label>
                Change scope
                <select
                  aria-label="Assistant change scope"
                  onChange={(event) =>
                    setAssistantMode(event.target.value as AssistantMode)
                  }
                  value={assistantMode}
                >
                  <option value="generate">Generate design</option>
                  <option value="selected">Selected component</option>
                  <option value="page">Active page</option>
                  <option value="site">Microsite</option>
                  <option value="theme">Theme</option>
                </select>
              </label>
              <label>
                Describe the change
                <textarea
                  aria-label="Design request"
                  maxLength={1000}
                  onChange={(event) => setAssistantPrompt(event.target.value)}
                  placeholder="Add a photo gallery below the event details…"
                  rows={5}
                  value={assistantPrompt}
                />
              </label>
              <button
                className="designer-save"
                disabled={assistantBusy || assistantPrompt.trim().length < 3}
                type="submit"
              >
                {assistantBusy ? "Preparing proposal…" : "Generate proposal"}
              </button>
            </form>
            {assistantError && (
              <p className="designer-assistant-error" role="alert">
                {assistantError}
              </p>
            )}
            {assistantProposal && (
              <div className="designer-assistant-proposal">
                <strong>Review proposal</strong>
                <p>{assistantProposal.summary}</p>
                <ul>
                  {assistantProposal.operations.map((operation) => (
                    <li key={JSON.stringify(operation)}>
                      {operation.action === "create_page"
                        ? `Create page “${operation.pageName}” with ${operation.sections.length} sections`
                        : operation.action === "update_page"
                          ? `Update page “${operation.pageName}”`
                          : operation.action === "add_component"
                            ? `Add ${operation.componentType} section`
                            : operation.action === "remove_component"
                              ? "Remove selected component · destructive"
                              : operation.action === "apply_theme"
                                ? "Apply colors, typography, and spacing across pages"
                                : operation.action === "configure_animation"
                                  ? `Configure ${operation.preset} animation metadata · playback is not enabled`
                                  : `${operation.action.replaceAll("_", " ")} · ${operation.action === "update_style" ? operation.property : "selected component"}`}
                    </li>
                  ))}
                </ul>
                <div className="designer-assistant-actions">
                  <button
                    disabled={assistantBusy}
                    onClick={() => void requestAssistant(assistantPrompt)}
                    type="button"
                  >
                    Regenerate
                  </button>
                  <button onClick={cancelAssistantProposal} type="button">
                    Cancel
                  </button>
                  <button
                    className="designer-save"
                    onClick={applyAssistantProposal}
                    type="button"
                  >
                    Apply proposal
                  </button>
                </div>
              </div>
            )}
            {assistantSnapshot && !assistantProposal && (
              <button
                className="designer-assistant-revert"
                onClick={revertAssistantChange}
                type="button"
              >
                Undo last AI change
              </button>
            )}
            {assistantProvider === "demo" && (
              <p className="designer-private-note">
                Demo mode returns deterministic sample operations. It does not
                call an AI provider.
              </p>
            )}
          </section>
          <div className="designer-sidebar-heading designer-settings-heading">
            <strong>Page settings</strong>
            <small>Typography and colors are editable on canvas.</small>
          </div>
          <p className="designer-private-note">
            Event details in this starter are sample copy. Private guest, RSVP,
            seating, and claim data are not available to the designer.
          </p>
        </aside>
      </div>
      {contextMenu && (
        <div
          className="designer-context-menu"
          role="menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              editorCommand("core:copy");
              setContextMenu(null);
            }}
            role="menuitem"
            type="button"
          >
            Copy
          </button>
          <button
            onClick={() => {
              duplicateSelected();
              setContextMenu(null);
            }}
            role="menuitem"
            type="button"
          >
            Duplicate
          </button>
          <button
            onClick={() => {
              renameSelected();
              setContextMenu(null);
            }}
            role="menuitem"
            type="button"
          >
            Rename layer
          </button>
          <button
            onClick={() => {
              toggleSelectedLock();
              setContextMenu(null);
            }}
            role="menuitem"
            type="button"
          >
            Lock / unlock
          </button>
          <button
            onClick={() => {
              deleteSelected();
              setContextMenu(null);
            }}
            role="menuitem"
            type="button"
          >
            Delete
          </button>
        </div>
      )}
      {shortcutHelpOpen && (
        <div className="designer-help-backdrop" role="presentation">
          <section
            aria-labelledby="designer-shortcuts-title"
            aria-modal="true"
            className="designer-shortcut-dialog"
            role="dialog"
          >
            <button
              aria-label="Close shortcut help"
              className="designer-help-close"
              onClick={() => setShortcutHelpOpen(false)}
              type="button"
            >
              ×
            </button>
            <p className="eyebrow">DESIGNER SHORTCUTS</p>
            <h2 id="designer-shortcuts-title">Work faster</h2>
            <dl>
              <dt>Undo / redo</dt>
              <dd>Ctrl/Cmd + Z · Ctrl/Cmd + Shift + Z</dd>
              <dt>Save draft</dt>
              <dd>Ctrl/Cmd + S</dd>
              <dt>Duplicate</dt>
              <dd>Ctrl/Cmd + D</dd>
              <dt>Delete selection</dt>
              <dd>Delete / Backspace</dd>
              <dt>Deselect / exit preview</dt>
              <dd>Escape</dd>
              <dt>Edit text</dt>
              <dd>Double-click editable text on the canvas</dd>
            </dl>
            <button
              className="button button-primary"
              onClick={() => setShortcutHelpOpen(false)}
              type="button"
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function isEditorTextEditing(editor: Editor) {
  const frameFocus = editor.Canvas.getDocument()
    ?.activeElement as HTMLElement | null;
  const hostFocus = document.activeElement as HTMLElement | null;
  return Boolean(
    editor.RichTextEditor.globalRte?.enabled ||
      frameFocus?.isContentEditable ||
      frameFocus?.matches("input, textarea, select") ||
      hostFocus?.isContentEditable ||
      hostFocus?.matches("input, textarea, select"),
  );
}

function handleCanvasShortcut(editor: Editor, event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  const escapePressed = event.key === "Escape";
  if (
    target &&
    (target.isContentEditable ||
      target.closest("input, textarea, select, [contenteditable='true']")) &&
    !escapePressed
  ) {
    return;
  }
  const modifier = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  let command: string | undefined;
  if (modifier && key === "s") command = "momentus:save";
  else if (modifier && key === "z")
    command = event.shiftKey ? "momentus:redo" : "momentus:undo";
  else if (modifier && key === "d") command = "momentus:duplicate";
  else if (event.key === "Delete" || event.key === "Backspace")
    command = "momentus:delete";
  else if (event.key === "Escape") command = "momentus:deselect";
  if (!command) return;
  event.preventDefault();
  event.stopPropagation();
  editor.runCommand(command);
}

function duplicateEditorSelection(editor: Editor) {
  const selected = editor.getSelected();
  const parent = selected?.parent();
  if (!selected || !parent || selected === editor.getWrapper()) return;
  const clone = parent.append(selected.toJSON(), {
    at: selected.index() + 1,
  })[0];
  if (clone) editor.select(clone);
}

function registerProductivityCommands(
  editor: Editor,
  handlers: { onContextClose: () => void },
) {
  editor.Commands.add("momentus:undo", (instance) =>
    instance.UndoManager.undo(),
  );
  editor.Commands.add("momentus:redo", (instance) =>
    instance.UndoManager.redo(),
  );
  editor.Commands.add("momentus:duplicate", (instance) =>
    duplicateEditorSelection(instance),
  );
  editor.Commands.add("momentus:delete", (instance) => {
    const selected = instance.getSelected();
    if (selected && selected !== instance.getWrapper()) selected.remove();
  });
  editor.Commands.add("momentus:deselect", (instance) => {
    if (instance.RichTextEditor.globalRte?.enabled) {
      instance.RichTextEditor.globalRte.disable();
      return;
    }
    if (instance.Commands.isActive("core:preview"))
      instance.runCommand("core:preview");
    else instance.select([]);
    handlers.onContextClose();
  });

  const conflictKeys =
    /(?:⌘|ctrl|meta)\+(?:shift\+)?z|(?:⌘|ctrl|meta)\+d|(?:backspace|delete|del)/i;
  for (const [id, keymap] of Object.entries(editor.Keymaps.getAll())) {
    if (id !== "momentus:save" && conflictKeys.test(keymap.keys))
      editor.Keymaps.remove(id);
  }
  const addKeymap = (
    id: string,
    keys: string,
    command: string,
    prevent = true,
  ) => {
    editor.Keymaps.add(
      `momentus:${id}`,
      keys,
      (instance) => {
        if (command !== "momentus:deselect" && isEditorTextEditing(instance))
          return;
        instance.runCommand(command);
      },
      { prevent },
    );
  };
  addKeymap("undo", "⌘+z, ctrl+z", "momentus:undo", false);
  addKeymap("redo", "⌘+shift+z, ctrl+shift+z", "momentus:redo", false);
  addKeymap("duplicate", "⌘+d, ctrl+d", "momentus:duplicate");
  addKeymap("delete", "delete, backspace", "momentus:delete", false);
  addKeymap("escape", "esc", "momentus:deselect", false);
}

function richTextActionDefinitions(): RichTextEditorAction[] {
  const actions: RichTextEditorAction[] = [
    ["momentus-h1", "H1", "h1"],
    ["momentus-h2", "H2", "h2"],
    ["momentus-paragraph", "P", "p"],
  ].map(([name, label, tag]) => ({
    name,
    icon: label,
    attributes: { title: label, "aria-label": label },
    result: (rte) => rte.exec("formatBlock", `<${tag}>`),
  }));
  actions.push(
    {
      name: "momentus-ordered-list",
      icon: "1.",
      attributes: { title: "Ordered list", "aria-label": "Ordered list" },
      result: (rte) => rte.exec("insertOrderedList"),
    },
    {
      name: "momentus-unordered-list",
      icon: "•",
      attributes: { title: "Bulleted list", "aria-label": "Bulleted list" },
      result: (rte) => rte.exec("insertUnorderedList"),
    },
  );
  for (const [name, label, command, icon] of [
    ["momentus-align-left", "Align left", "justifyLeft", "☷"],
    ["momentus-align-center", "Align center", "justifyCenter", "≡"],
    ["momentus-align-right", "Align right", "justifyRight", "☰"],
  ]) {
    actions.push({
      name,
      icon,
      attributes: { title: label, "aria-label": label },
      result: (rte) => rte.exec(command),
    });
  }
  return actions;
}

function registerDesignerComponents(
  editor: Editor,
  eventName: string,
  client: string,
) {
  const addType = (
    id: string,
    label: string,
    tagName: string,
    classes: string[],
    components: ComponentDefinition[],
    traits: ComponentDefinition["traits"] = [],
  ) => {
    editor.Components.addType(id, {
      model: {
        defaults: {
          tagName,
          name: label,
          classes,
          components,
          traits,
          stylable: true,
          draggable: true,
          droppable: true,
        },
      },
    });
  };
  const text = (tagName: string, value: string, classes: string[] = []) => ({
    tagName,
    type: "text",
    components: value,
    classes,
  });
  addType(
    "momentus-hero",
    "Event hero",
    "header",
    ["momentus-event-hero"],
    [
      text("p", client.toUpperCase(), ["eyebrow"]),
      text("h1", eventName, ["event-title"]),
      text("p", "A day worth remembering", ["event-subtitle"]),
      {
        tagName: "a",
        type: "link",
        components: "Explore the celebration",
        attributes: { href: "#details" },
        classes: ["event-cta"],
        traits: [
          { type: "text", name: "href", label: "Link URL" },
          {
            type: "select",
            name: "target",
            label: "Open in",
            options: [
              { id: "_self", name: "Same tab" },
              { id: "_blank", name: "New tab" },
            ],
          },
        ],
      },
    ],
  );
  addType(
    "momentus-event-details",
    "Event details",
    "section",
    ["event-details"],
    [
      text("h2", "The celebration", ["section-title"]),
      text(
        "p",
        "Join us for a day of good company, thoughtful details, and a celebration together.",
        ["section-copy"],
      ),
      {
        tagName: "div",
        classes: ["detail-grid"],
        components: [
          text("strong", "Saturday · 4:00 PM"),
          text("strong", "The Garden House"),
        ],
      },
    ],
  );
  addType(
    "momentus-story",
    "Story section",
    "section",
    ["event-story"],
    [
      text("p", "OUR STORY", ["eyebrow"]),
      text("h2", "A little about us", ["section-title"]),
      text(
        "p",
        "Share a favorite memory, introduce your hosts, or tell guests what makes this gathering special.",
        ["section-copy"],
      ),
    ],
  );
  addType(
    "momentus-schedule",
    "Schedule",
    "section",
    ["event-schedule"],
    [
      text("h2", "The schedule", ["section-title"]),
      {
        tagName: "ul",
        classes: ["schedule-list"],
        components: [
          {
            tagName: "li",
            components: [
              text("strong", "4:00 PM"),
              text("span", "Guest arrival"),
            ],
          },
          {
            tagName: "li",
            components: [
              text("strong", "5:00 PM"),
              text("span", "Ceremony and celebration"),
            ],
          },
        ],
      },
    ],
  );
  addType(
    "momentus-venue",
    "Venue and directions",
    "section",
    ["event-venue"],
    [
      text("h2", "Find us", ["section-title"]),
      text("p", "The Garden House · 123 Celebration Lane", ["section-copy"]),
      {
        tagName: "a",
        type: "link",
        components: "View directions",
        attributes: { href: "https://maps.google.com/" },
      },
    ],
  );
  addType(
    "momentus-dress-code",
    "Dress code",
    "section",
    ["event-dress-code"],
    [
      text("h2", "What to wear", ["section-title"]),
      text("p", "Garden formal · Soft colors welcome", ["section-copy"]),
    ],
  );
  addType(
    "momentus-gallery",
    "Photo gallery",
    "section",
    ["event-gallery"],
    [
      text("h2", "A few moments", ["section-title"]),
      {
        tagName: "div",
        classes: ["gallery-grid"],
        components: [
          { type: "image", attributes: { alt: "Add a photo and describe it" } },
          { type: "image", attributes: { alt: "Add a photo and describe it" } },
          { type: "image", attributes: { alt: "Add a photo and describe it" } },
        ],
      },
    ],
  );
  addType(
    "momentus-rsvp",
    "RSVP presentation",
    "section",
    ["event-rsvp"],
    [
      text("h2", "We hope you can join us", ["section-title"]),
      text("p", "Please reply using the invitation link you received.", [
        "section-copy",
      ]),
      {
        tagName: "a",
        type: "link",
        components: "Respond to invitation",
        attributes: { href: "#" },
        classes: ["event-cta"],
      },
    ],
  );
  addType(
    "momentus-footer",
    "Event footer",
    "footer",
    ["event-footer"],
    [text("p", `${eventName} · With love, ${client}`, ["footer-copy"])],
  );
}

function registerDesignerBlocks(editor: Editor) {
  const createNavigation = (mobile = false): ComponentDefinition => {
    const pageItems = editor.Pages.getAll().map((page) => {
      const slug = pageSlug(page);
      const url = slug === pageSlug(editor.Pages.getMain()) ? "/" : `/${slug}`;
      return {
        tagName: "a",
        type: "link",
        name: `${page.getName()} page link`,
        components: page.getName(),
        attributes: { href: url, "data-momentus-page-link": slug },
      };
    });
    const links = pageItems.length
      ? pageItems
      : [
          {
            tagName: "a",
            type: "link",
            components: "Home",
            attributes: { href: "/", "data-momentus-page-link": "home" },
          },
        ];
    return mobile
      ? {
          tagName: "details",
          name: "Mobile navigation",
          classes: ["momentus-mobile-menu"],
          components: [
            { tagName: "summary", type: "text", components: "Menu" },
            { tagName: "nav", name: "Mobile page links", components: links },
          ],
        }
      : {
          tagName: "nav",
          name: "Page navigation",
          classes: ["momentus-navigation"],
          components: links,
        };
  };
  editor.Blocks.add("momentus-navigation", {
    label: "Navigation bar",
    category: "Navigation",
    content: () => createNavigation(),
    attributes: { title: "Add links for the current pages" },
  });
  editor.Blocks.add("momentus-mobile-menu", {
    label: "Mobile menu",
    category: "Navigation",
    content: () => createNavigation(true),
    attributes: { title: "Add a collapsible page menu" },
  });
  editor.Blocks.add("momentus-home-link", {
    label: "Back to home",
    category: "Navigation",
    content: () => {
      const home = editor.Pages.getMain();
      const slug = pageSlug(home);
      return {
        tagName: "a",
        type: "link",
        components: "Back to home",
        attributes: { href: "/", "data-momentus-page-link": slug },
      };
    },
  });
  editor.Blocks.add("momentus-anchor-link", {
    label: "Section anchor link",
    category: "Navigation",
    content: {
      tagName: "a",
      type: "link",
      components: "Jump to event details",
      attributes: { href: "#details" },
    },
  });
  const blocks = [
    [
      "heading",
      "Heading",
      "Basic",
      {
        tagName: "h2",
        type: "text",
        components: "Add a heading",
        style: { "font-size": "32px", "font-weight": "500" },
      },
    ],
    [
      "paragraph",
      "Paragraph",
      "Basic",
      {
        tagName: "p",
        type: "text",
        components: "Add your text here. Double-click to edit this paragraph.",
      },
    ],
    [
      "button",
      "Button / link",
      "Basic",
      {
        tagName: "a",
        type: "link",
        components: "Call to action",
        attributes: { href: "#" },
        style: {
          display: "inline-block",
          padding: "12px 20px",
          "background-color": "#596f5c",
          color: "#fff",
          "text-decoration": "none",
        },
      },
    ],
    [
      "image",
      "Image",
      "Basic",
      { type: "image", attributes: { alt: "Describe this image" } },
    ],
    [
      "link",
      "Text link",
      "Basic",
      {
        tagName: "a",
        type: "link",
        components: "Add link text",
        attributes: { href: "#" },
      },
    ],
    [
      "divider",
      "Divider",
      "Basic",
      { tagName: "hr", style: { border: "0", "border-top": "1px solid #ddd" } },
    ],
    [
      "spacer",
      "Spacer",
      "Basic",
      {
        tagName: "div",
        name: "Spacer",
        style: { height: "32px" },
        droppable: false,
      },
    ],
    [
      "container",
      "Content container",
      "Layout",
      {
        tagName: "div",
        name: "Content container",
        style: { "max-width": "1100px", margin: "0 auto", padding: "24px" },
        components: "Drop content here",
      },
    ],
    [
      "columns",
      "Two columns",
      "Layout",
      {
        tagName: "div",
        name: "Two columns",
        style: {
          display: "grid",
          "grid-template-columns": "repeat(2, minmax(0, 1fr))",
          gap: "24px",
        },
        components: [
          { tagName: "div", components: "Column one" },
          { tagName: "div", components: "Column two" },
        ],
      },
    ],
    ["hero", "Event hero", "Event", { type: "momentus-hero" }],
    ["details", "Event details", "Event", { type: "momentus-event-details" }],
    ["story", "Story section", "Event", { type: "momentus-story" }],
    ["couple", "Couple introduction", "Wedding", { type: "momentus-story" }],
    ["story-timeline", "Love story", "Wedding", { type: "momentus-story" }],
    ["schedule", "Schedule", "Event", { type: "momentus-schedule" }],
    ["venue", "Venue", "Event", { type: "momentus-venue" }],
    ["dress-code", "Dress code", "Event", { type: "momentus-dress-code" }],
    [
      "entourage",
      "Wedding party",
      "Wedding",
      {
        tagName: "section",
        name: "Wedding party",
        components: [
          { tagName: "h2", type: "text", components: "Meet the wedding party" },
          {
            tagName: "p",
            type: "text",
            components: "Introduce your family and friends.",
          },
        ],
      },
    ],
    [
      "registry",
      "Gift registry",
      "Wedding",
      {
        tagName: "section",
        name: "Gift registry",
        components: [
          {
            tagName: "h2",
            type: "text",
            components: "Your presence is the greatest gift",
          },
          {
            tagName: "a",
            type: "link",
            components: "View registry",
            attributes: { href: "#" },
          },
        ],
      },
    ],
    ["gallery", "Image gallery", "Media", { type: "momentus-gallery" }],
    ["rsvp", "RSVP presentation", "Event", { type: "momentus-rsvp" }],
    [
      "guestbook",
      "Guestbook introduction",
      "Wedding",
      {
        tagName: "section",
        name: "Guestbook",
        components: [
          { tagName: "h2", type: "text", components: "Leave a note" },
          {
            tagName: "p",
            type: "text",
            components:
              "A presentation block only; guestbook submission is not connected.",
          },
        ],
      },
    ],
    [
      "speaker",
      "Speaker profile",
      "Corporate",
      {
        tagName: "article",
        name: "Speaker profile",
        components: [
          { tagName: "h3", type: "text", components: "Speaker name" },
          {
            tagName: "p",
            type: "text",
            components: "Role and short biography",
          },
        ],
      },
    ],
    [
      "sponsors",
      "Sponsors",
      "Corporate",
      {
        tagName: "section",
        name: "Sponsors",
        components: [
          {
            tagName: "h2",
            type: "text",
            components: "Thank you to our sponsors",
          },
          { tagName: "div", components: "Add sponsor names or images" },
        ],
      },
    ],
    [
      "tickets",
      "Ticket information",
      "Corporate",
      {
        tagName: "section",
        name: "Ticket information",
        components: [
          { tagName: "h2", type: "text", components: "Registration details" },
          {
            tagName: "p",
            type: "text",
            components: "Add approved event ticket information.",
          },
        ],
      },
    ],
    [
      "faq",
      "Frequently asked questions",
      "Universal",
      {
        tagName: "section",
        name: "Frequently asked questions",
        components: [
          { tagName: "h2", type: "text", components: "Good to know" },
          { tagName: "h3", type: "text", components: "Add a question" },
          { tagName: "p", type: "text", components: "Add the answer." },
        ],
      },
    ],
    [
      "callout",
      "Call to action",
      "Universal",
      {
        tagName: "section",
        name: "Call to action",
        components: [
          {
            tagName: "h2",
            type: "text",
            components: "We look forward to seeing you",
          },
          {
            tagName: "a",
            type: "link",
            components: "Learn more",
            attributes: { href: "#" },
          },
        ],
      },
    ],
    ["footer", "Event footer", "Layout", { type: "momentus-footer" }],
  ] as [string, string, string, ComponentDefinition][];
  for (const [id, label, category, content] of blocks) {
    editor.Blocks.add(id, {
      label,
      category,
      content,
      attributes: { title: `Add ${label.toLowerCase()}` },
    });
  }
}
