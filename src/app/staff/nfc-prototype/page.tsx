import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNfcPrototype } from "@/modules/nfc/ui/staff-nfc-prototype";
import { signOut } from "@/modules/auth/public";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export const instant = false;

export default async function StaffNfcPrototypePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");
  if (!data.user.email_confirmed_at) redirect("/check-email");

  return (
    <main className="workspace-page staff-prototype-page">
      <header className="app-header workspace-header">
        <Link className="wordmark" href="/organizer">
          <span aria-hidden="true" className="wordmark-symbol">m</span>
          <span>MOMENTUS</span>
        </Link>
        <div className="account-menu">
          <Link className="quiet-link" href="/organizer">Your event studio</Link>
          <form action={signOut}>
            <button className="quiet-button" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <StaffNfcPrototype />
    </main>
  );
}
