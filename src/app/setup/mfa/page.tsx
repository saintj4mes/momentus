import { redirect } from "next/navigation";
import { AuthShell } from "@/modules/auth/ui/auth-shell";
import { MfaSetup } from "@/modules/auth/ui/mfa-setup";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export const instant = false;

export default async function MfaSetupPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");
  if (!data.user.email_confirmed_at) redirect("/check-email");

  return (
    <AuthShell
      description="Organizer accounts use an authenticator app as a second sign-in step."
      eyebrow="ACCOUNT SECURITY"
      title="Secure your workspace."
    >
      <MfaSetup />
    </AuthShell>
  );
}
