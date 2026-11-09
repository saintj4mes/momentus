"use server";

import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export type SaveMicrositeDraftResult =
  | { ok: true; revision: number }
  | { ok: false; conflict?: boolean; error: string };

const projectMaxBytes = 2 * 1024 * 1024;
const unsafeProjectContent =
  /"(?:script(?:-export)?|on[a-z]+|srcdoc)"\s*:|<\s*(?:script|svg|math|form|base|meta|link|iframe|object|embed)\b|\bon[a-z]+\s*=|javascript\s*:|vbscript\s*:|data:text\/html|url\s*\(|@import|expression\s*\(/i;

function isSafeProjectData(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  let nodes = 0;
  function visit(current: unknown, depth: number): boolean {
    nodes += 1;
    if (nodes > 100_000 || depth > 40) return false;
    if (typeof current === "string") return !unsafeProjectContent.test(current);
    if (
      current === null ||
      typeof current === "number" ||
      typeof current === "boolean"
    )
      return true;
    if (Array.isArray(current))
      return current.every((item) => visit(item, depth + 1));
    if (typeof current !== "object") return false;
    return Object.entries(current).every(
      ([key, child]) =>
        !/^on[a-z]+$/i.test(key) &&
        key !== "script" &&
        key !== "script-export" &&
        visit(child, depth + 1),
    );
  }
  return visit(value, 0);
}

export async function saveMicrositeDraft(input: {
  eventId: string;
  projectData: Record<string, unknown>;
  expectedRevision: number;
}): Promise<SaveMicrositeDraftResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.eventId)) {
    return { ok: false, error: "Invalid event." };
  }
  if (
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision < 0
  ) {
    return { ok: false, error: "Invalid draft revision." };
  }
  if (!isSafeProjectData(input.projectData)) {
    return {
      ok: false,
      error:
        "This design contains unsupported active content and cannot be saved.",
    };
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(input.projectData);
  } catch {
    return { ok: false, error: "Designer project data is invalid." };
  }
  if (new TextEncoder().encode(serialized).byteLength > projectMaxBytes) {
    return {
      ok: false,
      error: "This design is larger than the 2 MB draft limit.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user)
    return { ok: false, error: "Sign in to save this design." };
  if (!auth.user.email_confirmed_at) {
    return { ok: false, error: "Verify your email before saving a design." };
  }
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    return { ok: false, error: "Complete MFA before saving a design." };
  }

  const { data, error } = await supabase.rpc("save_microsite_draft", {
    p_event_id: input.eventId,
    p_project_data: input.projectData as never,
    p_expected_revision: input.expectedRevision,
  });
  if (error) {
    if (error.code === "40001") {
      return {
        ok: false,
        conflict: true,
        error:
          "This draft changed in another session. Reload the latest draft before saving.",
      };
    }
    if (error.code === "42501") {
      return {
        ok: false,
        error: "You no longer have permission to edit this event.",
      };
    }
    return { ok: false, error: "The draft could not be saved. Try again." };
  }
  if (typeof data !== "number") {
    return { ok: false, error: "The draft could not be saved. Try again." };
  }
  return { ok: true, revision: data };
}
