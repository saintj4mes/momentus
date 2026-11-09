import { notFound, redirect } from "next/navigation";
import { getLocalDemoSession, isLocalDemoEnabled } from "@/modules/auth/local-demo";
import { demoSites } from "@/modules/platform/demo-sites";
import { StudioEventWorkspace } from "@/modules/studio/public";
import type { StudioEvent } from "@/modules/studio/types";

export const instant = false;

export default async function AdminStudioPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  if (!isLocalDemoEnabled()) redirect("/sign-in");
  const session = await getLocalDemoSession();
  if (!session) redirect("/sign-in");

  const { siteId } = await params;
  const site = demoSites.find((s) => s.id === siteId) || demoSites[0];
  if (!site) notFound();

  const initialEvent: StudioEvent = {
    id: `event-${site.id}`,
    organizationId: "org-demo-santos",
    name: `${site.client} · ${site.event}`,
    type: site.event.toLowerCase().includes("wedding") ? "wedding" : "birthday",
    eventDate: site.date,
    eventTime: "16:00",
    timezone: "Asia/Manila",
    venue: site.venue,
    capacity: 300,
    reservedPlaces: 184,
    status: site.status.toLowerCase() as any,
    guestMode: site.mode,
    planTier: "bespoke",
    customDomain: "rsvp.santosreyes.com",
    micrositeSlug: site.id,
    publishedRevision: 3,
  };

  return <StudioEventWorkspace initialEvent={initialEvent} />;
}
