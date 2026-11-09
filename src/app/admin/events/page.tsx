import { redirect } from "next/navigation";
import {
  getLocalDemoSession,
  isLocalDemoEnabled,
} from "@/modules/auth/local-demo";
import { PlatformManagement } from "@/modules/platform/ui/platform-management";

export const instant = false;

export default async function EventsPage() {
  if (!isLocalDemoEnabled()) redirect("/sign-in");
  const session = await getLocalDemoSession();
  if (!session) redirect("/sign-in");
  return <PlatformManagement email={session.email} view="events" />;
}
