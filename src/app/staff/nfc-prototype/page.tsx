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
      <div style={{ maxWidth: "680px", margin: "20px auto 0 auto", padding: "14px 20px", backgroundColor: "#19352d", borderRadius: "8px", border: "1px solid #c8a870", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#f5f0e8" }}>
        <div>
          <strong style={{ color: "#c8a870" }}>✨ Live Event Station Scanner PWA</strong>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#e8ded1" }}>
            Equip turnstile staff with station PIN locks, Web Audio synthesized chimes, and instant duplicate protection.
          </p>
        </div>
        <Link
          href="/staff/station-scanner"
          style={{
            backgroundColor: "#c8a870",
            color: "#0c2820",
            padding: "8px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            whiteSpace: "nowrap",
          }}
        >
          Launch PWA →
        </Link>
      </div>
      <StaffNfcPrototype />
    </main>
  );
}
