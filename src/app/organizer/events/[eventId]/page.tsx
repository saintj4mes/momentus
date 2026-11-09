import { notFound, redirect } from "next/navigation";
import { getManagedEvent } from "@/modules/organizations/queries";
import { StudioEventWorkspace } from "@/modules/studio/public";
import type { StudioEvent, StudioGuestParty } from "@/modules/studio/types";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export const instant = false;

export default async function ManagedEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{
    published?: string;
    modeUpdated?: string;
    cardRevoked?: string;
    error?: string;
  }>;
}) {
  const { eventId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/sign-in");
  if (!auth.user.email_confirmed_at) redirect("/check-email");
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") redirect("/setup/mfa");

  const { event, invitations, cards, guests, error } =
    await getManagedEvent(eventId);
  if (error || !event) notFound();

  const studioEvent: StudioEvent = {
    id: event.id,
    organizationId: event.organization_id,
    name: event.name,
    type: "wedding",
    eventDate: event.event_date,
    eventTime: event.event_time ? event.event_time.slice(0, 5) : "16:00",
    timezone: event.timezone || "Asia/Manila",
    venue: event.venue || "Venue unassigned",
    capacity: event.capacity,
    reservedPlaces: event.reserved_places,
    status: (event.status as any) || "published",
    guestMode: (event.guest_mode as any) || "rsvp",
    planTier: event.capacity > 500 ? "grand" : event.capacity > 50 ? "bespoke" : "starter",
    micrositeSlug: event.id,
    publishedRevision: 1,
  };

  const cardByInv = new Map(cards.map((c) => [c.invitation_id, c]));

  const studioGuests: StudioGuestParty[] = invitations.map((inv) => {
    const card = cardByInv.get(inv.id);
    const relatedGuests = guests.filter((g) => g.invitation_id === inv.id);

    return {
      id: inv.id,
      label: inv.label,
      primaryGuestName: inv.label.split("&")[0]?.trim() || inv.label,
      primaryEmail: inv.primary_email || undefined,
      companionAllowance: inv.companion_allowance,
      reservedPlaces: inv.reserved_places,
      tableAssignment: "Table 01 - Presidential",
      seatAssignment: "Seat 1A",
      dietaryNotes: "Standard",
      tokenHash: inv.id.slice(0, 8),
      rsvpStatus: inv.rsvp_submitted_at ? "confirmed" : "pending",
      issuedNfcCardId: card?.id,
      nfcCardStatus: card?.status as any,
      companions: relatedGuests.slice(1).map((g) => ({
        id: g.id,
        name: g.name,
        attendance: g.attendance_status === "confirmed" ? "attending" : "undecided",
        dietaryNotes: "Standard",
      })),
    };
  });

  return (
    <StudioEventWorkspace
      initialEvent={studioEvent}
      initialGuests={studioGuests}
    />
  );
}
