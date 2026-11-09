"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import {
  clearLocalDemoSession,
  createLocalDemoSession,
  isLocalDemoEnabled,
  localDemoCredentialsMatch,
} from "./local-demo";

export type AuthActionState = {
  error?: string;
  message?: string;
};

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || email.length > 320 || password.length > 256) {
    return { error: "Enter your email and password." };
  }

  if (isLocalDemoEnabled()) {
    if (!localDemoCredentialsMatch(email, password)) {
      return { error: "Sign-in failed. Check your demo email and password." };
    }
    await createLocalDemoSession();
    redirect("/admin");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return { error: "Sign-in failed. Check your email and password." };
  }
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return { error: "Verify your email before signing in." };
  }

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(assurance?.currentLevel === "aal2" ? "/organizer" : "/setup/mfa");
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 12 || password.length > 128) {
    return { error: "Use a password between 12 and 128 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  if (error || !data.user) {
    return { error: "We could not create that account. Try again or sign in." };
  }
  if (!data.session) {
    return {
      message:
        "Check your email to verify your account, then come back to sign in.",
    };
  }
  redirect("/setup/mfa");
}

export async function signOut(): Promise<void> {
  if (isLocalDemoEnabled()) {
    await clearLocalDemoSession();
    redirect("/sign-in");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
