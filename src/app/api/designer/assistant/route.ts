import { NextResponse } from "next/server";
import {
  getLocalDemoSession,
  isLocalDemoEnabled,
} from "@/modules/auth/local-demo";
import {
  assistantRequestSchema,
  validateProposalContext,
} from "@/modules/microsites/ai/operations";
import {
  AssistantProviderError,
  proposeDesign,
} from "@/modules/microsites/ai/provider";
import {
  getDesignerEvent,
  getOrCreateEventMicrositeDraft,
} from "@/modules/microsites/queries";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

async function authorized(input: { eventId?: string; siteId?: string }) {
  if (input.siteId && !input.eventId) {
    return (
      isLocalDemoEnabled() &&
      Boolean(await getLocalDemoSession({ requestTime: false }))
    );
  }
  if (!input.eventId || !/^[0-9a-f-]{36}$/i.test(input.eventId)) return false;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email_confirmed_at) return false;
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return false;
  const { event } = await getDesignerEvent(input.eventId);
  if (!event) return false;
  const { microsite, errorCode } = await getOrCreateEventMicrositeDraft(
    input.eventId,
  );
  return Boolean(microsite && !errorCode);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 24_000) {
    return NextResponse.json(
      { error: "Assistant request is too large." },
      { status: 413 },
    );
  }
  let raw: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 24_000) {
      return NextResponse.json(
        { error: "Assistant request is too large." },
        { status: 413 },
      );
    }
    raw = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Assistant request must be valid JSON." },
      { status: 400 },
    );
  }
  const input = assistantRequestSchema.safeParse(raw);
  if (!input.success) {
    return NextResponse.json(
      { error: "Assistant request is invalid." },
      { status: 400 },
    );
  }
  const value = input.data;
  if (
    value.prompt.trim().length < 3 ||
    value.prompt.length > 1000 ||
    value.history.length > 6
  ) {
    return NextResponse.json(
      {
        error:
          "Use a prompt under 1,000 characters and at most six recent turns.",
      },
      { status: 400 },
    );
  }
  if (value.context.pages.length > 12 || value.context.tree.length > 40) {
    return NextResponse.json(
      { error: "Design context is too large." },
      { status: 400 },
    );
  }
  for (const turn of value.history) {
    if (turn.content.length > 600) {
      return NextResponse.json(
        { error: "Conversation context is too large." },
        { status: 400 },
      );
    }
  }
  try {
    if (!(await authorized(value))) {
      return NextResponse.json(
        { error: "You are not authorized to use this event designer." },
        { status: 403 },
      );
    }
    const result = await proposeDesign({
      ...value,
      prompt: value.prompt.trim(),
    });
    const contextError = validateProposalContext(result.proposal, value);
    if (contextError) {
      return NextResponse.json(
        {
          error:
            "The proposal referenced a design item that is no longer available.",
        },
        { status: 502 },
      );
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AssistantProviderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "The design assistant is temporarily unavailable." },
      { status: 503 },
    );
  }
}
