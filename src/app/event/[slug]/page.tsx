import { notFound } from "next/navigation";
import { isLocalDemoEnabled } from "@/modules/auth/local-demo";
import { DemoMicrosite } from "@/modules/platform/ui/demo-microsite";
import { demoSites } from "@/modules/platform/demo-sites";

export const instant = false;

export default async function EventMicrositePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isLocalDemoEnabled()) notFound();
  const { slug } = await params;
  const site = demoSites.find((candidate) => candidate.id === slug);
  if (!site) notFound();
  return <DemoMicrosite site={site} />;
}
