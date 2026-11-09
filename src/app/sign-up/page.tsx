import type { Metadata } from "next";
import { signUp } from "@/modules/auth/public";
import { AuthForm } from "@/modules/auth/ui/auth-form";
import { AuthShell } from "@/modules/auth/ui/auth-shell";

export const metadata: Metadata = { title: "Create an account · MOMENTUS" };

export default function SignUpPage() {
  return (
    <AuthShell
      description="Start a private workspace for the people and details that make your day yours."
      eyebrow="A THOUGHTFUL BEGINNING"
      title="Create your account."
    >
      <AuthForm action={signUp} mode="sign-up" />
    </AuthShell>
  );
}
