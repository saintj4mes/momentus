import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  type AssistantRequest,
  type DesignProposal,
  designProposalSchema,
  validateDesignProposal,
} from "./operations";

export type ProposalResult = {
  proposal: DesignProposal;
  provider: "openai" | "demo";
  usage: { inputTokens: number; outputTokens: number } | null;
};

export class AssistantProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function buildDemoProposal(request: AssistantRequest): DesignProposal {
  const prompt = request.prompt.toLowerCase();
  const pageId = request.context.activePageId || request.context.pages[0]?.id;
  if (prompt.includes("gallery") || prompt.includes("photo")) {
    return {
      summary: "Add an editable photo gallery to the current page.",
      operations: [
        {
          action: "add_component",
          pageId,
          parentId: "",
          afterId: "",
          componentType: "gallery",
        },
      ],
    };
  }
  if (
    request.mode === "generate" ||
    prompt.includes("new page") ||
    prompt.includes("another page")
  ) {
    return {
      summary: "Create a sample details page with editable event sections.",
      operations: [
        {
          action: "create_page",
          pageName: "Event Details",
          pageSlug: "event-details",
          sections: ["hero", "event-details", "schedule", "venue", "rsvp"],
        },
      ],
    };
  }
  if (
    request.mode === "theme" ||
    prompt.includes("theme") ||
    prompt.includes("palette")
  ) {
    return {
      summary: "Apply an ivory, sage, and warm gold design theme.",
      operations: [
        {
          action: "apply_theme",
          colors: {
            primary: "#536b57",
            accent: "#b29462",
            background: "#fbf8f0",
            text: "#354139",
          },
          headingFont: "Playfair Display, serif",
          bodyFont: "DM Sans, sans-serif",
          spacing: "balanced",
        },
      ],
    };
  }
  const selected = request.context.selectedComponentId;
  if (!selected) {
    return {
      summary: "Add an editable event hero to the current page.",
      operations: [
        {
          action: "add_component",
          pageId,
          parentId: "",
          afterId: "",
          componentType: "hero",
        },
      ],
    };
  }
  const wantsText = /rewrite|text|heading|title|say|copy/.test(prompt);
  return {
    summary: wantsText
      ? "Update the selected component's copy."
      : "Refine the selected component's style.",
    operations: [
      wantsText
        ? {
            action: "update_text",
            pageId,
            targetId: selected,
            text: "A celebration to remember",
          }
        : {
            action: "update_style",
            pageId,
            targetId: selected,
            property: "color",
            value: "#536b57",
          },
    ],
  };
}

export async function proposeDesign(
  request: AssistantRequest,
): Promise<ProposalResult> {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.MOMENTUS_AI_DEMO_MODE === "true"
  ) {
    return {
      proposal: buildDemoProposal(request),
      provider: "demo",
      usage: null,
    };
  }
  if (process.env.MOMENTUS_AI_ENABLED !== "true") {
    throw new AssistantProviderError(
      "The AI design assistant is disabled.",
      503,
    );
  }
  if (process.env.MOMENTUS_AI_PROVIDER !== "openai") {
    throw new AssistantProviderError(
      "The configured AI provider is unavailable.",
      503,
    );
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AssistantProviderError(
      "Add a server-only OPENAI_API_KEY to enable design assistance.",
      503,
    );
  }

  const model = process.env.MOMENTUS_AI_MODEL?.trim() || "gpt-6.1-sol";
  const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 1 });
  try {
    const response = await client.responses.parse({
      model,
      store: false,
      max_output_tokens: 1400,
      input: [
        {
          role: "system",
          content: [
            "You are the MOMENTUS visual design assistant. Return only the supplied structured operation proposal.",
            "Never return HTML, CSS source, JavaScript, executable commands, or raw GrapesJS project JSON.",
            "Use only component IDs and page IDs in the compact context. For page-wide requests, keep edits on the active page unless creating a page.",
            "Use only supported component kinds and style properties represented by the schema. Do not add guest data, RSVP records, credentials, or private event facts.",
            "When provided, adapt visual suggestions to the event type and experience stage. Before-event pages focus on clear information and registration, during-event pages on wayfinding and schedules, and after-event pages on thank-you messages and memory sharing.",
            "Destructive operations require a clear summary. Prefer non-destructive edits and keep unrelated components unchanged.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            mode: request.mode,
            prompt: request.prompt,
            context: request.context,
            recentConversation: request.history.slice(-6),
          }),
        },
      ],
      text: {
        format: zodTextFormat(designProposalSchema, "momentus_design_proposal"),
      },
    });
    const validation = validateDesignProposal(response.output_parsed);
    if (!validation.success) {
      throw new AssistantProviderError(
        "The provider returned a proposal that failed validation.",
        502,
      );
    }
    return {
      proposal: validation.data,
      provider: "openai",
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          }
        : null,
    };
  } catch (error) {
    if (error instanceof AssistantProviderError) throw error;
    if (error instanceof OpenAI.APIError && error.status === 429) {
      throw new AssistantProviderError(
        "AI usage is temporarily limited. Try again shortly.",
        429,
      );
    }
    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      throw new AssistantProviderError(
        "The AI request timed out. Try a shorter prompt.",
        504,
      );
    }
    throw new AssistantProviderError(
      "The AI service could not create a design proposal.",
      502,
    );
  }
}
