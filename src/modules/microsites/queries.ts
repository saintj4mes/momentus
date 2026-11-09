import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export type EventMicrositeDraft = {
  id: string;
  organizationId: string;
  eventId: string;
  publicSlug: string;
  status: "draft" | "published" | "unpublished";
  draftProject: Record<string, unknown>;
  draftRevision: number;
  publishedRevision: number | null;
};

export async function getDesignerEvent(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .maybeSingle();
  return { event: data, error: error?.message ?? null };
}

export async function getOrCreateEventMicrositeDraft(eventId: string): Promise<{
  microsite: EventMicrositeDraft | null;
  errorCode: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("ensure_event_microsite", {
    p_event_id: eventId,
  });
  if (error) return { microsite: null, errorCode: error.code };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { microsite: null, errorCode: "empty_result" };
  return {
    microsite: {
      id: row.microsite_id,
      organizationId: row.organization_id,
      eventId: row.event_id,
      publicSlug: row.public_slug,
      status: row.status,
      draftProject: row.draft_project,
      draftRevision: row.draft_revision,
      publishedRevision: row.published_revision,
    },
    errorCode: null,
  };
}
