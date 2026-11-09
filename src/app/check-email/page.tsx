import Link from "next/link";
import { AuthShell } from "@/modules/auth/ui/auth-shell";

export default function CheckEmailPage() {
  return (
    <AuthShell
      description="Use the verification message Supabase sent to your address."
      eyebrow="ONE MORE STEP"
      title="Check your email."
    >
      <p className="form-message">
        After you verify your address, sign in and set up an authenticator app
        to protect your organizer workspace.
      </p>
      <Link className="button button-primary button-link" href="/sign-in">
        Continue to sign in
      </Link>
    </AuthShell>
  );
}
