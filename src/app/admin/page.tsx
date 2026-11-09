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
        <Link href="/admin/onboarding">Onboard client</Link>
      </nav>
      <LocalDemoConsole email={session.email} />
    </>
  );
}
