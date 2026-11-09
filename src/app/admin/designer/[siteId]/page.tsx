import { redirect } from "next/navigation";
import {
  getLocalDemoSession,
  isLocalDemoEnabled,
} from "@/modules/auth/local-demo";
import { DesignerStudio } from "@/modules/microsites/ui/designer-studio";
import { demoSites } from "@/modules/platform/demo-sites";
import { type EventType, eventTypes } from "@/modules/platform/management";

export const instant = false;

export default async function LocalDemoDesignerPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ experience?: string; type?: string }>;
}) {
  if (!isLocalDemoEnabled()) redirect("/sign-in");
  const session = await getLocalDemoSession();
  if (!session) redirect("/sign-in");
  const { siteId } = await params;
  const { experience, type } = await searchParams;
  if (!/^[a-z0-9-]{1,80}$/.test(siteId)) redirect("/admin/events");
  const site = demoSites.find((entry) => entry.id === siteId);
  const stage =
    experience === "during" || experience === "after" ? experience : "before";
  const eventType = eventTypes.find((entry) => entry.id === type)?.id as
    | EventType
    | undefined;
  return (
    <DesignerStudio
      client={site?.client ?? "Local demo client"}
      eventName={site?.event ?? "Local demo event"}
      siteId={siteId}
      experienceStage={stage}
      eventType={eventType}
    />
  );
}

export function generateStaticParams() {
  return demoSites.map((site) => ({ siteId: site.id }));
}

export const metadata = { title: "Designer Studio · MOMENTUS" };
