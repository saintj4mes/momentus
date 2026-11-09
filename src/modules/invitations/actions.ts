"use server";

import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import { getPublicInvitation } from "./queries";

export type RsvpActionState = {
  error?: string;
  success?: boolean;
};

export async function lookupPublicInvitation(token: string) {
  return getPublicInvitation(token);
}

export async function submitRsvp(
  _previousState: RsvpActionState,
  formData: FormData,
): Promise<RsvpActionState> {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const count = Number(formData.get("attendeeCount"));
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return { error: "This invitation link is invalid or no longer available." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return { error: "Enter a valid email address for your confirmation." };
  }
  if (!Number.isInteger(count) || count < 1 || count > 21) {
    return { error: "Choose the number of people responding." };
  }

  const attendees = [];
  for (let index = 0; index < count; index += 1) {
    const name = String(formData.get(`attendee_${index}_name`) ?? "").trim();
    const attendanceStatus = String(
      formData.get(`attendee_${index}_status`) ?? "",
    );
    if (name.length < 1 || name.length > 120) {
      return { error: `Enter a name for guest ${index + 1}.` };
    }
    if (!["attending", "declined", "undecided"].includes(attendanceStatus)) {
      return { error: `Choose a response for guest ${index + 1}.` };
    }
    attendees.push({ name, attendanceStatus });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_public_rsvp", {
    p_token: token,
    p_primary_email: email,
    p_attendees: attendees,
  });
  if (error) {
    const safeMessages: Record<string, string> = {
      "An RSVP has already been submitted for this invitation.":
        "An RSVP is already saved for this invitation.",
      "The RSVP deadline has passed.": "The RSVP deadline has passed.",
      "This event is not accepting RSVPs.":
        "This event is not accepting RSVPs.",
      "This invitation link is invalid or no longer available.":
        "This invitation link is invalid or no longer available.",
      "The number of responses exceeds this invitation allowance.":
        "The number of guests exceeds this invitation's allowance.",
    };
    return {
      error:
        safeMessages[error.message] ??
        "We couldn't save your response. Please try again.",
    };
  }
  return { success: true };
}
