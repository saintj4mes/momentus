import Link from "next/link";
import { signOut } from "@/modules/auth/public";
import { BillingOverview, getOrganizationBillingState } from "@/modules/billing/public";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export const instant = false;

export default async function OrganizerBillingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  // If local demo or unauthenticated, handle gracefully
  let userEmail = "organizer@momentus.events";
  let organizationId = "organizer-default-org";

  if (auth.user) {
    userEmail = auth.user.email ?? userEmail;
    organizationId = auth.user.id;
  }

  const billingState = await getOrganizationBillingState(organizationId);

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
          <Link href="/organizer" className="quiet-button">
            ← Events Workspace
          </Link>
          <span>{userEmail}</span>
          <form action={signOut}>
            <button className="quiet-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="billing-content-section section-container">
        <BillingOverview
          initialBilling={billingState}
          organizationName="Client Studio Workspace"
          isPlatformAdmin={false}
        />
      </section>
    </main>
  );
}
