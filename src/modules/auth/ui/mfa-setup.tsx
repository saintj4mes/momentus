"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/shared/infrastructure/supabase/client";

type TotpSetup = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function MfaSetup() {
  const router = useRouter();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Preparing secure sign-in…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function prepare() {
      const supabase = createSupabaseBrowserClient();
      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.currentLevel === "aal2") {
        router.replace("/organizer");
        router.refresh();
        return;
      }

      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();
      if (listError) {
        if (active) setError("Could not load your authenticator settings.");
        return;
      }

      const verified = factors.totp.find(
        (factor) => factor.status === "verified",
      );
      if (verified) {
        if (active) setMessage("Enter the code from your authenticator app.");
        setSetup({ factorId: verified.id, qrCode: "", secret: "" });
        return;
      }

      const unverified = factors.all.find(
        (factor) => factor.status === "unverified",
      );
      if (unverified) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({
          factorId: unverified.id,
        });
        if (removeError) {
          if (active) setError("Restart authenticator setup and try again.");
          return;
        }
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MOMENTUS authenticator",
      });
      if (enrollError) {
        if (active) setError("Could not start authenticator setup.");
        return;
      }
      const { error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      });
      if (challengeError) {
        if (active) setError("Could not start authenticator setup.");
        return;
      }
      if (active) {
        setSetup({
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
        });
        setMessage("Scan the code with an authenticator app, then verify it.");
      }
    }
    void prepare();
    return () => {
      active = false;
    };
  }, [router]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setup || code.length < 6) return;
    setBusy(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: setup.factorId });
    if (challengeError) {
      setError("Could not verify that code. Try again.");
      setBusy(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: setup.factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      setError(
        "That code was not accepted. Check your authenticator and try again.",
      );
      setBusy(false);
      return;
    }
    router.replace("/organizer");
    router.refresh();
  }

  return (
    <div className="mfa-setup">
      <p className="form-message">{message}</p>
      {setup?.qrCode && (
        <Image
          alt="Authenticator setup QR code"
          className="mfa-qr"
          height={220}
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qrCode)}`}
          unoptimized
          width={220}
        />
      )}
      {setup?.secret && (
        <details className="mfa-secret">
          <summary>Can’t scan? Enter setup key</summary>
          <code>{setup.secret}</code>
        </details>
      )}
      {setup && (
        <form className="form-stack" onSubmit={verify}>
          <label className="field-label">
            6-digit authenticator code
            <input
              autoComplete="one-time-code"
              className="text-field code-field"
              inputMode="numeric"
              maxLength={8}
              minLength={6}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              pattern="[0-9]{6,8}"
              required
              value={code}
            />
          </label>
          {error && <p className="form-message error-message">{error}</p>}
          <button
            className="button button-primary"
            disabled={busy}
            type="submit"
          >
            {busy ? "Verifying…" : "Verify and continue"}
          </button>
        </form>
      )}
      {!setup && error && <p className="form-message error-message">{error}</p>}
    </div>
  );
}
