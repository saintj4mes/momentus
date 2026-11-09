import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export async function getOrganizerWorkspace() {
  const supabase = await createSupabaseServerClient();
  const [
    { data: organizations, error: organizationError },
    { data: events, error: eventError },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("events")
      .select(
        "id, organization_id, name, event_date, venue, capacity, reserved_places, status",
      )
      .order("event_date", { ascending: true }),
  ]);

  return {
    organizations: organizations ?? [],
    events: events ?? [],
    error: organizationError?.message ?? eventError?.message ?? null,
  };
}

export async function getManagedEvent(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, organization_id, name, event_date, event_time, timezone, venue, capacity, reserved_places, rsvp_deadline, status, guest_mode",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event)
    return { event: null, invitations: [], cards: [], error };
  const [
    { data: invitations, error: invitationError },
    { data: cards, error: cardError },
    { data: attendees, error: attendeeError },
  ] = await Promise.all([
    supabase
      .from("invitations")
      .select(
        "id, label, companion_allowance, reserved_places, issued_at, primary_email, rsvp_submitted_at, revoked_at",
      )
      .eq("event_id", eventId)
      .order("issued_at", { ascending: false }),
    supabase
      .from("nfc_cards")
      .select(
        "id, organization_id, event_id, invitation_id, label, status, replaced_by_id, assigned_at, replaced_at, revoked_at, created_at",
      )
      .eq("organization_id", event.organization_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("attendees")
      .select("id, invitation_id, slot, name, attendance_status, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
  ]);

  const invitationById = new Map(
    (invitations ?? []).map((invitation) => [invitation.id, invitation]),
  );
  const guestRows = (attendees ?? []).map((attendee) => {
    const invitation = invitationById.get(attendee.invitation_id);
    return {
      ...attendee,
      invitation_label: invitation?.label ?? "Invitation unavailable",
      primary_email: invitation?.primary_email ?? null,
      rsvp_submitted_at: invitation?.rsvp_submitted_at ?? null,
    };
  });

  return {
    event,
    invitations: invitations ?? [],
    cards: cards ?? [],
    guests: guestRows,
    error:
      invitationError?.message ??
      cardError?.message ??
      attendeeError?.message ??
      null,
  };
}
