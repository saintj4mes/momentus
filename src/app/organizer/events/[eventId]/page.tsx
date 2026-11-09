import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signOut } from "@/modules/auth/public";
import {
  publishEvent,
  setEventGuestMode,
} from "@/modules/organizations/public";
import { getManagedEvent } from "@/modules/organizations/queries";
import { GuestDirectory } from "@/modules/organizations/ui/guest-directory";
import { InvitationComposer } from "@/modules/organizations/ui/invitation-composer";
import { NfcCardRegistry } from "@/modules/organizations/ui/nfc-card-registry";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export const instant = false;

export default async function ManagedEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{
    published?: string;
    modeUpdated?: string;
    cardRevoked?: string;
    error?: string;
  }>;
}) {
  const [{ eventId }, query] = await Promise.all([params, searchParams]);
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

  return (
    <main className="workspace-page">
      <header className="app-header workspace-header">
        <Link className="wordmark" href="/organizer">
          <span className="wordmark-symbol" aria-hidden="true">
            m
          </span>
          <span>MOMENTUS</span>
        </Link>
        <div className="account-menu">
          <Link className="quiet-link" href="/organizer">
            All workspaces
          </Link>
          <form action={signOut}>
            <button className="quiet-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/organizer">Your event studio</Link>
        <span aria-hidden="true">/</span>
        <span>{event.name}</span>
      </nav>

      <section className="event-detail-heading">
        <div>
          <p className="eyebrow">{event.status.toUpperCase()} EVENT</p>
          <h1>{event.name}</h1>
          <p className="quiet-copy">
            {event.event_date} · {event.event_time.slice(0, 5)} {event.timezone}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>
        <div className="capacity-card">
          <span>{event.reserved_places}</span>
          <small>of {event.capacity} places reserved</small>
        </div>
      </section>

      <div className="event-designer-cta">
        <Link
          className="button button-secondary"
          href={`/organizer/events/${event.id}/designer`}
        >
          Open Designer Studio
        </Link>
      </div>

      {query.published && (
        <p className="notice success-message">
          Your event is published and can receive guest RSVPs.
        </p>
      )}
      {query.error && <p className="notice error-message">{query.error}</p>}

      {event.status === "draft" && (
        <section className="publish-panel panel">
          <div>
            <p className="eyebrow">READY FOR GUESTS?</p>
            <h2>Publish this invitation experience.</h2>
            <p className="quiet-copy">
              Guests can open issued invitation links and submit their RSVP
              after publishing.
            </p>
          </div>
          <form action={publishEvent}>
            <input name="eventId" type="hidden" value={event.id} />
            <button className="button button-primary" type="submit">
              Publish event
            </button>
          </form>
        </section>
      )}

      {(event.status === "draft" || event.status === "published") && (
        <InvitationComposer eventId={event.id} />
      )}

      <section className="panel event-mode-panel">
        <div>
          <p className="eyebrow">NFC GUEST EXPERIENCE</p>
          <h2>Choose what every linked card opens.</h2>
          <p className="quiet-copy">
            The card link stays the same. Its destination changes for this event
            when you switch modes.
          </p>
        </div>
        {query.modeUpdated && (
          <p className="notice success-message">
            The event's NFC experience has been updated.
          </p>
        )}
        <div className="event-mode-options">
          {[
            {
              value: "rsvp",
              title: "RSVP",
              description: "Before the event",
              allowed: event.status === "published",
            },
            {
              value: "meal_booth",
              title: "Meal & Booth",
              description: "During the event",
              allowed: event.status === "live",
            },
            {
              value: "album",
              title: "Post-event Album",
              description: "After memories are published",
              allowed: event.status === "memories",
            },
          ].map((mode) => (
            <article
              className={`event-mode-option${event.guest_mode === mode.value ? " selected" : ""}`}
              key={mode.value}
            >
              <div>
                <strong>{mode.title}</strong>
                <small>{mode.description}</small>
              </div>
              {event.guest_mode === mode.value ? (
                <span className="event-mode-active">ACTIVE</span>
              ) : mode.allowed ? (
                <form action={setEventGuestMode}>
                  <input name="eventId" type="hidden" value={event.id} />
                  <input name="guestMode" type="hidden" value={mode.value} />
                  <button className="text-button" type="submit">
                    Switch to this mode
                  </button>
                </form>
              ) : (
                <span className="event-mode-locked">
                  Available {mode.description.toLowerCase()}
                </span>
              )}
            </article>
          ))}
        </div>
        <p className="field-hint">
          Meal and souvenir claims still need staff confirmation. Booth
          submissions remain private until host approval.
        </p>
      </section>

      <section className="organization-card issued-invitations">
        <div className="organization-heading">
          <div>
            <p className="eyebrow">GUEST LIST</p>
            <h2>Private invitations</h2>
          </div>
          <span className="count-pill">{invitations.length} issued</span>
        </div>
        {invitations.length ? (
          <div className="invitation-list">
            {invitations.map((invitation) => (
              <article className="invitation-row" key={invitation.id}>
                <div>
                  <strong>{invitation.label}</strong>
                  <small>
                    One primary guest · {invitation.companion_allowance}{" "}
                    companion place(s)
                  </small>
                </div>
                <span
                  className={
                    invitation.revoked_at
                      ? "status-pill status-cancelled"
                      : "status-pill status-published"
                  }
                >
                  {invitation.revoked_at
                    ? "revoked"
                    : invitation.rsvp_submitted_at
                      ? "responded"
                      : "awaiting RSVP"}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">
            Issue a private invitation to reserve places for one guest party.
          </p>
        )}
      </section>

      <GuestDirectory
        capacity={event.capacity}
        eventName={event.name}
        guests={guests}
        invitations={invitations}
        reservedPlaces={event.reserved_places}
      />

      <NfcCardRegistry
        cards={cards}
        cardRevoked={Boolean(query.cardRevoked)}
        eventId={event.id}
        invitations={invitations}
        organizationId={event.organization_id}
      />
    </main>
  );
}
