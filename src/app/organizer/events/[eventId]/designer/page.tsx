import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getDesignerEvent,
  getOrCreateEventMicrositeDraft,
} from "@/modules/microsites/public";
import { DesignerStudio } from "@/modules/microsites/ui/designer-studio";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export const instant = false;

export default async function EventDesignerPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
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

  const { event } = await getDesignerEvent(eventId);
  if (!event) notFound();

  const { microsite, errorCode } =
    await getOrCreateEventMicrositeDraft(eventId);
  if (errorCode === "42501") notFound();
  if (!microsite) {
    return (
      <main className="workspace-page">
        <header className="app-header workspace-header">
          <Link className="wordmark" href={`/organizer/events/${eventId}`}>
            <span className="wordmark-symbol" aria-hidden="true">
              m
            </span>
            <span>MOMENTUS</span>
          </Link>
        </header>
        <section className="panel designer-unavailable">
          <p className="eyebrow">DESIGNER STORAGE UNAVAILABLE</p>
          <h1>We couldn’t open this event’s design draft.</h1>
          <p className="quiet-copy">
            The reviewed microsite migration must be applied to the isolated
            development database before the event editor can save drafts.
          </p>
          <Link
            className="button button-secondary"
            href={`/organizer/events/${eventId}`}
          >
            Back to event
          </Link>
        </section>
      </main>
    );
  }

  return (
    <DesignerStudio
      client={event.name}
      draftProject={microsite.draftProject}
      draftRevision={microsite.draftRevision}
      eventId={event.id}
      eventName={event.name}
    />
  );
}

export const metadata = { title: "Event Designer · MOMENTUS" };
