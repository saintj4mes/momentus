import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getLocalDemoSession,
  isLocalDemoEnabled,
} from "@/modules/auth/local-demo";
import { BillingOverview, getOrganizationBillingState } from "@/modules/billing/public";

export const instant = false;

export default async function AdminBillingPage() {
  if (!isLocalDemoEnabled()) redirect("/sign-in");
  const session = await getLocalDemoSession();
  if (!session) redirect("/sign-in");

  const billingState = await getOrganizationBillingState("admin-platform-org");

  return (
    <div className="admin-billing-page-wrap">
      <nav className="platform-entry-links" aria-label="Platform management navigation">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/clients">Clients</Link>
        <Link href="/admin/events">Events</Link>
        <Link href="/admin/billing" className="is-active">
          Billing &amp; Plans
        </Link>
        <Link href="/admin/onboarding">Onboard Client</Link>
      </nav>

      <main className="billing-main-area">
        <BillingOverview
          initialBilling={billingState}
          organizationName="MOMENTUS Global Platform"
          isPlatformAdmin={true}
        />
      </main>
    </div>
  );
}

