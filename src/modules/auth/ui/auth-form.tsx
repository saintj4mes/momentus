"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthActionState } from "../public";

type AuthAction = (
  state: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

export function AuthForm({
  action,
  mode,
}: {
  action: AuthAction;
  mode: "sign-in" | "sign-up";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="form-stack">
      <label className="field-label">
        Email address
        <input
          autoComplete="email"
          className="text-field"
          maxLength={320}
          name="email"
          required
          type="email"
        />
      </label>
      <label className="field-label">
        Password
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="text-field"
          maxLength={128}
          minLength={isSignUp ? 12 : undefined}
          name="password"
          required
          type="password"
        />
        {isSignUp && (
          <span className="field-hint">Use at least 12 characters.</span>
        )}
      </label>
      {state.error && (
        <p className="form-message error-message">{state.error}</p>
      )}
      {state.message && (
        <p className="form-message success-message">{state.message}</p>
      )}
      <button
        className="button button-primary"
        disabled={pending}
        type="submit"
      >
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>
      <p className="auth-switch">
        {isSignUp ? "Already have an account?" : "New to Momentus?"}{" "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
