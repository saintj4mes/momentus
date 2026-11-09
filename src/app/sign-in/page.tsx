import type { Metadata } from "next";
import { signIn } from "@/modules/auth/public";
import { AuthForm } from "@/modules/auth/ui/auth-form";
import { AuthShell } from "@/modules/auth/ui/auth-shell";
import { isLocalDemoEnabled } from "@/modules/auth/local-demo";

export const metadata: Metadata = { title: "Sign in · MOMENTUS" };

export default function SignInPage() {
  return (
    <AuthShell
      description="Sign in to manage your event and private invitations."
      eyebrow="YOUR EVENT SPACE"
      title="Welcome back."
    >
      {isLocalDemoEnabled() && (
        <p className="local-demo-login-note">
          Local demo sign-in is enabled. Its generated email and password are in your ignored <code>.env</code> file.
        </p>
      )}
      <AuthForm action={signIn} mode="sign-in" />
    </AuthShell>
  );
}
