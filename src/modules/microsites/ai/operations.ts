import { z } from "zod";

export const componentKind = z.enum([
  "hero",
  "event-details",
  "story",
  "schedule",
  "venue",
  "dress-code",
  "gallery",
  "rsvp",
  "footer",
  "navigation",
  "faq",
  "speaker",
]);

const pageId = z.string().min(1).max(64);
const componentId = z.string().min(1).max(128);

export const designOperationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_page"),
    pageName: z.string(),
    pageSlug: z.string(),
    sections: z.array(componentKind),
  }),
  z.object({
    action: z.literal("update_page"),
    pageId,
    pageName: z.string(),
    pageSlug: z.string(),
  }),
  z.object({
    action: z.literal("add_component"),
    pageId,
    parentId: z.string(),
    afterId: z.string(),
    componentType: componentKind,
  }),
  z.object({
    action: z.literal("update_text"),
    pageId,
    targetId: componentId,
    text: z.string(),
  }),
  z.object({
    action: z.literal("update_style"),
    pageId,
    targetId: componentId,
    property: z.enum([
      "color",
      "background-color",
      "font-size",
      "font-family",
      "font-weight",
      "text-align",
      "padding",
      "margin",
      "border-radius",
      "display",
      "gap",
      "line-height",
      "letter-spacing",
    ]),
    value: z.string(),
  }),
  z.object({
    action: z.literal("duplicate_component"),
    pageId,
    targetId: componentId,
  }),
  z.object({
    action: z.literal("remove_component"),
    pageId,
    targetId: componentId,
  }),
  z.object({
    action: z.literal("move_component"),
    pageId,
    targetId: componentId,
    parentId: z.string(),
    afterId: z.string(),
  }),
  z.object({
    action: z.literal("apply_theme"),
    colors: z.object({
      primary: z.string(),
      accent: z.string(),
      background: z.string(),
      text: z.string(),
    }),
    headingFont: z.enum([
      "Georgia, serif",
      "Playfair Display, serif",
      "Arial, sans-serif",
    ]),
    bodyFont: z.enum([
      "Arial, sans-serif",
      "DM Sans, sans-serif",
      "Georgia, serif",
    ]),
    spacing: z.enum(["compact", "balanced", "spacious"]),
  }),
  z.object({
    action: z.literal("configure_animation"),
    pageId,
    targetId: componentId,
    preset: z.enum(["fade", "slide", "zoom", "scale", "reveal"]),
    durationMs: z.number(),
    delayMs: z.number(),
  }),
]);

export const designProposalSchema = z.object({
  summary: z.string(),
  operations: z.array(designOperationSchema),
});

export const assistantRequestSchema = z.object({
  mode: z.enum(["generate", "selected", "page", "site", "theme"]),
  prompt: z.string(),
  eventId: z.string().optional(),
  siteId: z.string().optional(),
  context: z.object({
    eventType: z
      .enum([
        "wedding",
        "birthday",
        "corporate",
        "concert",
        "fun-run",
        "conference",
        "community",
        "custom",
      ])
      .optional(),
    experienceStage: z.enum(["before", "during", "after"]).optional(),
    activePageId: z.string(),
    pages: z.array(
      z.object({ id: z.string(), name: z.string(), slug: z.string() }),
    ),
    selectedComponentId: z.string(),
    tree: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        tag: z.string(),
        children: z.array(
          z.object({ id: z.string(), type: z.string(), tag: z.string() }),
        ),
      }),
    ),
  }),
  history: z.array(
    z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
  ),
});

export type DesignOperation = z.infer<typeof designOperationSchema>;
export type DesignProposal = z.infer<typeof designProposalSchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

const safeCssValue = /^[#a-z0-9 .,%()-]+$/i;
const safeHexColor = /^#[\da-f]{3,8}$/i;
const safeColorFunction = /^(?:rgb|rgba|hsl|hsla)\([\d.,%\s-]+\)$/i;
const safeColors = new Set([
  "white",
  "black",
  "ivory",
  "transparent",
  "inherit",
  "currentcolor",
]);

export function validateDesignProposal(
  value: unknown,
): { success: true; data: DesignProposal } | { success: false; error: string } {
  const parsed = designProposalSchema.safeParse(value);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid proposal.",
    };
  if (parsed.data.operations.length < 1 || parsed.data.operations.length > 8) {
    return {
      success: false,
      error: "Proposal operation count is outside the supported range.",
    };
  }
  for (const operation of parsed.data.operations) {
    if (
      operation.action === "create_page" ||
      operation.action === "update_page"
    ) {
      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(operation.pageSlug) ||
        operation.pageSlug.length > 40
      ) {
        return { success: false, error: "Page slug is invalid." };
      }
      if (
        operation.pageName.trim().length < 1 ||
        operation.pageName.length > 60
      ) {
        return { success: false, error: "Page name is invalid." };
      }
    }
    if (
      operation.action === "update_text" &&
      (operation.text.length > 500 ||
        /[<>]/.test(operation.text) ||
        operation.text.includes("\u0000"))
    ) {
      return {
        success: false,
        error: "Text must be plain text under 500 characters.",
      };
    }
    if (operation.action === "update_style") {
      const color =
        operation.property === "color" ||
        operation.property === "background-color";
      if (
        operation.value.length > 80 ||
        /url|expression|javascript|[;{}@]/i.test(operation.value)
      ) {
        return { success: false, error: "Style value is not allowed." };
      }
      if (
        color &&
        !(
          safeHexColor.test(operation.value) ||
          safeColorFunction.test(operation.value) ||
          safeColors.has(operation.value.toLowerCase())
        )
      ) {
        return { success: false, error: "Color value is not supported." };
      }
      if (!safeCssValue.test(operation.value)) {
        return { success: false, error: "Style value is not supported." };
      }
    }
    if (operation.action === "apply_theme") {
      if (
        Object.values(operation.colors).some(
          (color) => !safeHexColor.test(color),
        )
      ) {
        return { success: false, error: "Theme colors must be hex values." };
      }
    }
    if (
      operation.action === "configure_animation" &&
      (operation.durationMs < 0 ||
        operation.durationMs > 4000 ||
        operation.delayMs < 0 ||
        operation.delayMs > 3000)
    ) {
      return {
        success: false,
        error: "Animation timing is outside the supported range.",
      };
    }
    if (operation.action === "create_page" && operation.sections.length > 8) {
      return {
        success: false,
        error: "A generated page can contain up to eight sections.",
      };
    }
  }
  return parsed;
}

export function validateProposalContext(
  proposal: DesignProposal,
  request: AssistantRequest,
) {
  const pageIds = new Set(request.context.pages.map((page) => page.id));
  const componentIds = new Set<string>();
  for (const component of request.context.tree) {
    componentIds.add(component.id);
    for (const child of component.children) componentIds.add(child.id);
  }
  const slugs = new Set(request.context.pages.map((page) => page.slug));
  for (const operation of proposal.operations) {
    if (operation.action === "create_page") {
      if (slugs.has(operation.pageSlug))
        return "A proposed page slug already exists.";
      slugs.add(operation.pageSlug);
      continue;
    }
    if (operation.action === "apply_theme") continue;
    if (operation.action === "update_page") {
      if (!pageIds.has(operation.pageId))
        return "A proposed page target does not exist.";
      if (
        request.context.pages.some(
          (page) =>
            page.id !== operation.pageId && page.slug === operation.pageSlug,
        )
      ) {
        return "A proposed page slug already exists.";
      }
      continue;
    }
    if (!pageIds.has(operation.pageId))
      return "A proposed page target does not exist.";
    if (operation.action === "add_component") {
      if (operation.parentId && !componentIds.has(operation.parentId))
        return "A proposed insertion target does not exist.";
      if (operation.afterId && !componentIds.has(operation.afterId))
        return "A proposed insertion point does not exist.";
      continue;
    }
    if (!componentIds.has(operation.targetId))
      return "A proposed component target does not exist.";
    if (
      "parentId" in operation &&
      operation.parentId &&
      !componentIds.has(operation.parentId)
    ) {
      return "A proposed component destination does not exist.";
    }
    if (
      "afterId" in operation &&
      operation.afterId &&
      !componentIds.has(operation.afterId)
    ) {
      return "A proposed component insertion point does not exist.";
    }
  }
  return null;
}
