import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export type PublicInvitation = {
  invitation_label: string;
  event_name: string;
  event_date: string;
  event_time: string;
  timezone: string;
  venue: string | null;
  event_status: string;
  guest_mode: "rsvp" | "meal_booth" | "album";
  rsvp_deadline: string | null;
  companion_allowance: number;
  already_submitted: boolean;
  submitted_attendees: Array<{
    name: string;
    attendanceStatus: "attending" | "declined" | "undecided";
    slot: number;
  }>;
};

export async function getPublicInvitation(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_invitation", {
    p_token: token,
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const { data: mode, error: modeError } = await supabase.rpc(
    "get_public_event_guest_mode",
    { p_token: token },
  );
  if (modeError || !["rsvp", "meal_booth", "album"].includes(String(mode))) {
    return null;
  }
  return { ...(row as PublicInvitation), guest_mode: mode as PublicInvitation["guest_mode"] };
}
