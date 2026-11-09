import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/modules/auth/public";
import { createOrganization } from "@/modules/organizations/public";
import { getOrganizerWorkspace } from "@/modules/organizations/queries";
import { CreateEventForm } from "@/modules/organizations/ui/create-event-form";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export const instant = false;

export default async function OrganizerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/sign-in");
  if (!auth.user.email_confirmed_at) redirect("/check-email");
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") redirect("/setup/mfa");

  const [{ organizations, events, error }, query] = await Promise.all([
    getOrganizerWorkspace(),
    searchParams,
  ]);
  const eventGroups = new Map<string, typeof events>();
  for (const event of events) {
    const group = eventGroups.get(event.organization_id) ?? [];
    group.push(event);
    eventGroups.set(event.organization_id, group);
  }

  return (
    <main className="workspace-page">
      <header className="app-header workspace-header">
        <Link className="wordmark" href="/">
          <span className="wordmark-symbol" aria-hidden="true">
            m
          </span>
          <span>MOMENTUS</span>
        </Link>
        <div className="account-menu">
          <Link href="/staff/station-scanner" className="quiet-button">
            Staff Scanner PWA
          </Link>
          <Link href="/organizer/billing" className="quiet-button">
            Billing &amp; Plans
          </Link>
          <span>{auth.user.email}</span>
          <form action={signOut}>
            <button className="quiet-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="workspace-intro">
        <p className="eyebrow">YOUR EVENT STUDIO</p>
        <h1>Make space for what matters.</h1>
        <p>
          Bring your invitations, guest responses, and event details together.
        </p>
      </section>

      {query.error && <p className="notice error-message">{query.error}</p>}
      {query.created && (
        <p className="notice success-message">Your workspace is ready.</p>
      )}

      {error ? (
        <section className="setup-notice panel">
          <p className="eyebrow">DATABASE SETUP NEEDED</p>
          <h2>Apply the local MVP migration.</h2>
          <p>
            The Supabase project is reachable, but its MOMENTUS tables are not
            ready yet. Run <code>pnpm db:migrate</code> after the project
            database connection is available.
          </p>
          <p className="field-hint">Database response: {error}</p>
        </section>
      ) : organizations.length === 0 ? (
        <section className="workspace-grid">
          <div className="panel onboarding-panel">
            <p className="eyebrow">FIRST, YOUR WORKSPACE</p>
            <h2>Give your event a home.</h2>
            <p className="quiet-copy">
              A workspace keeps the people and events you manage in one private
              place.
            </p>
            <form action={createOrganization} className="form-stack">
              <label className="field-label">
                Workspace name
                <input
                  className="text-field"
                  maxLength={100}
                  minLength={2}
                  name="name"
                  placeholder="e.g. Amara and Luca"
                  required
                />
              </label>
              <button className="button button-primary" type="submit">
                Create workspace
              </button>
            </form>
          </div>
          <div className="workspace-aside">
            <span className="aside-mark" aria-hidden="true">
              m
            </span>
            <p>Every thoughtful celebration starts with a few clear details.</p>
          </div>
        </section>
      ) : (
        <section className="organization-list">
          {organizations.map((organization) => {
            const organizationEvents = eventGroups.get(organization.id) ?? [];
            return (
              <article className="organization-card" key={organization.id}>
                <div className="organization-heading">
                  <div>
                    <p className="eyebrow">WORKSPACE</p>
                    <h2>{organization.name}</h2>
                  </div>
                  <CreateEventForm organizationId={organization.id} />
                </div>
                {organizationEvents.length ? (
                  <div className="event-list">
                    {organizationEvents.map((event) => (
                      <Link
                        className="event-row"
                        href={`/organizer/events/${event.id}`}
                        key={event.id}
                      >
                        <span className="event-date-mark">
                          {event.event_date.slice(5).replace("-", "/")}
                        </span>
                        <span className="event-row-copy">
                          <strong>{event.name}</strong>
                          <small>{event.venue || "Venue to be added"}</small>
                        </span>
                        <span className={`status-pill status-${event.status}`}>
                          {event.status}
                        </span>
                        <span className="event-capacity">
                          {event.reserved_places} / {event.capacity} places
                          reserved
                        </span>
                        <span aria-hidden="true" className="event-arrow">
                          ↗
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="empty-events">
                    <p>Your first event will appear here.</p>
                    <CreateEventForm organizationId={organization.id} />
                  </div>
                )}
              </article>
            );
          })}
          <form action={createOrganization} className="inline-create">
            <input
              className="text-field"
              maxLength={100}
              minLength={2}
              name="name"
              placeholder="Another workspace name"
              required
            />
            <button className="button button-secondary" type="submit">
              Add workspace
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
