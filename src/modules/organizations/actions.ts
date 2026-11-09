"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export type InvitationActionState = {
  error?: string;
  token?: string;
};

export type NfcCardActionState = {
  error?: string;
  cardId?: string;
  token?: string;
  label?: string;
};

async function requireManagerSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  if (!data.user.email_confirmed_at) redirect("/check-email");
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") redirect("/setup/mfa");
  return supabase;
}

function redirectWithError(message: string): never {
  redirect(`/organizer?error=${encodeURIComponent(message)}`);
}

export async function createOrganization(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 100) {
    redirectWithError(
      "Organization name must be between 2 and 100 characters.",
    );
  }
  const supabase = await requireManagerSession();
  const { error } = await supabase.rpc("create_organization", {
    p_name: name,
  });
  if (error) redirectWithError(error.message);
  revalidatePath("/organizer");
  redirect("/organizer?created=organization");
}

export async function createEvent(formData: FormData): Promise<void> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "");
  const eventTime = String(formData.get("eventTime") ?? "");
  const timezone = String(formData.get("timezone") ?? "Asia/Manila");
  const venue = String(formData.get("venue") ?? "").trim();
  const capacity = Number(formData.get("capacity"));
  const rsvpDeadline = String(formData.get("rsvpDeadline") ?? "");

  if (
    !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    name.length < 2 ||
    name.length > 140 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    !/^\d{2}:\d{2}$/.test(eventTime) ||
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 100000 ||
    (rsvpDeadline && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rsvpDeadline))
  ) {
    redirectWithError("Check the event details and try again.");
  }

  const supabase = await requireManagerSession();
  const { data: eventId, error } = await supabase.rpc("create_event", {
    p_organization_id: organizationId,
    p_name: name,
    p_event_date: eventDate,
    p_event_time: eventTime,
    p_timezone: timezone,
    p_venue: venue || null,
    p_capacity: capacity,
    p_rsvp_deadline_local: rsvpDeadline || null,
  });
  if (error || !eventId)
    redirectWithError(error?.message ?? "Could not create event.");
  revalidatePath("/organizer");
  redirect(`/organizer/events/${eventId}`);
}

export async function publishEvent(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) redirectWithError("Invalid event.");
  const supabase = await requireManagerSession();
  const { error } = await supabase.rpc("publish_event", {
    p_event_id: eventId,
  });
  if (error) redirectWithError(error.message);
  revalidatePath(`/organizer/events/${eventId}`);
  revalidatePath("/organizer");
  redirect(`/organizer/events/${eventId}?published=1`);
}

export async function setEventGuestMode(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const mode = String(formData.get("guestMode") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) redirectWithError("Invalid event.");
  if (!["rsvp", "meal_booth", "album"].includes(mode)) {
    redirectWithError("Choose a valid event experience.");
  }
  const supabase = await requireManagerSession();
  const { error } = await supabase.rpc("set_event_guest_mode", {
    p_event_id: eventId,
    p_mode: mode,
  });
  if (error) redirectWithError(error.message);
  revalidatePath(`/organizer/events/${eventId}`);
  redirect(`/organizer/events/${eventId}?modeUpdated=1`);
}

export async function createInvitation(
  eventId: string,
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) {
    return { error: "Invalid event." };
  }
  const label = String(formData.get("label") ?? "").trim();
  const companionAllowance = Number(formData.get("companionAllowance"));
  if (
    label.length < 2 ||
    label.length > 140 ||
    !Number.isInteger(companionAllowance) ||
    companionAllowance < 0 ||
    companionAllowance > 20
  ) {
    return {
      error: "Enter an invitation label and a valid companion allowance.",
    };
  }

  const supabase = await requireManagerSession();
  const { data, error } = await supabase.rpc("create_private_invitation", {
    p_event_id: eventId,
    p_label: label,
    p_companion_allowance: companionAllowance,
  });
  if (error) return { error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.guest_token)
    return { error: "Could not create the invitation link." };
  revalidatePath(`/organizer/events/${eventId}`);
  return { token: row.guest_token };
}

export async function registerNfcCard(
  organizationId: string,
  _previousState: NfcCardActionState,
  formData: FormData,
): Promise<NfcCardActionState> {
  const label = String(formData.get("label") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(organizationId) || label.length < 2 || label.length > 100) {
    return { error: "Enter a card label between 2 and 100 characters." };
  }
  const supabase = await requireManagerSession();
  const { data, error } = await supabase.rpc("register_nfc_card", {
    p_organization_id: organizationId,
    p_label: label,
  });
  if (error || !data) return { error: error?.message ?? "Could not register this card." };
  revalidatePath("/organizer");
  return { cardId: data, label };
}

export async function assignNfcCard(
  eventId: string,
  _previousState: NfcCardActionState,
  formData: FormData,
): Promise<NfcCardActionState> {
  const cardId = String(formData.get("cardId") ?? "");
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || !/^[0-9a-f-]{36}$/i.test(cardId) || !/^[0-9a-f-]{36}$/i.test(invitationId)) {
    return { error: "Choose a valid card and invitation." };
  }
  const supabase = await requireManagerSession();
  const { data, error } = await supabase.rpc("assign_nfc_card", {
    p_card_id: cardId,
    p_invitation_id: invitationId,
  });
  if (error) return { error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.invitation_token) return { error: "The card was not assigned." };
  revalidatePath(`/organizer/events/${eventId}`);
  return { token: row.invitation_token, cardId: row.card_id };
}

export async function revokeNfcCard(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const cardId = String(formData.get("cardId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || !/^[0-9a-f-]{36}$/i.test(cardId) || reason.length < 3 || reason.length > 500) {
    redirect(`/organizer/events/${eventId}?error=${encodeURIComponent("Choose a valid card and enter a revocation reason.")}`);
  }
  const supabase = await requireManagerSession();
  const { error } = await supabase.rpc("revoke_nfc_card", {
    p_card_id: cardId,
    p_reason: reason,
  });
  if (error) redirect(`/organizer/events/${eventId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/organizer/events/${eventId}`);
  redirect(`/organizer/events/${eventId}?cardRevoked=1`);
}
