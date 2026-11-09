import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getLocalDemoSession,
  isLocalDemoEnabled,
} from "@/modules/auth/local-demo";
import { LocalDemoConsole } from "@/modules/platform/ui/local-demo-console";

export const instant = false;

export default async function LocalDemoAdminPage() {
  if (!isLocalDemoEnabled()) redirect("/sign-in");
  const session = await getLocalDemoSession();
  if (!session) redirect("/sign-in");
  return (
    <>
      <nav className="platform-entry-links" aria-label="Platform management">
        <Link href="/admin/clients">Clients</Link>
        <Link href="/admin/events">Events</Link>
        <Link href="/admin/studio/amara-luca">5-Stage Event Studio</Link>
        <Link href="/admin/billing">Billing &amp; Plans</Link>
        <Link href="/staff/station-scanner">Staff Scanner PWA</Link>
        <Link href="/admin/onboarding">Onboard client</Link>
      </nav>
      <LocalDemoConsole email={session.email} />
    </>
  );
}
