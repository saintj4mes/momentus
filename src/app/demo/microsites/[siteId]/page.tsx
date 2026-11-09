import { notFound, redirect } from "next/navigation";
import { demoSites } from "@/modules/platform/demo-sites";
import { isLocalDemoEnabled } from "@/modules/auth/local-demo";

export const instant = false;

export default async function DemoMicrositePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  if (!isLocalDemoEnabled()) notFound();
  const { siteId } = await params;
  const site = demoSites.find((candidate) => candidate.id === siteId);
  if (!site) notFound();
  redirect(`/event/${site.id}`);
}
