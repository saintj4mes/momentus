"use client";

import { QRCodeSVG } from "qrcode.react";
import { useActionState, useEffect, useState } from "react";
import { NfcCardWriter } from "@/modules/nfc/ui/nfc-card-writer";
import { createInvitation } from "../public";

export function InvitationComposer({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(
    createInvitation.bind(null, eventId),
    {},
  );
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  async function copyLink() {
    if (!state.token || !origin) return;
    await navigator.clipboard.writeText(`${origin}/invite#${state.token}`);
    setCopied(true);
  }

  return (
    <section className="panel invitation-composer">
      <div>
        <p className="eyebrow">PRIVATE INVITATION</p>
        <h2>Issue one keepsake card.</h2>
        <p className="quiet-copy">
          One card opens one private invitation. Choose how many companion
          places it reserves.
        </p>
      </div>
      <form action={formAction} className="form-stack">
        <label className="field-label">
          Invitation label
          <input
            className="text-field"
            maxLength={140}
            name="label"
            placeholder="e.g. Ana and Luis"
            required
          />
        </label>
        <label className="field-label">
          Companion places
          <input
            className="text-field"
            defaultValue={0}
            max={20}
            min={0}
            name="companionAllowance"
            required
            type="number"
          />
        </label>
        <button
          className="button button-primary"
          disabled={pending}
          type="submit"
        >
          {pending ? "Issuing…" : "Issue private invitation"}
        </button>
        {state.error && (
          <p className="form-message error-message">{state.error}</p>
        )}
      </form>
      {state.token && (
        <div className="issued-link" role="status">
          <p className="eyebrow">COPY THIS LINK ONCE</p>
          <p>
            This private token is shown only now. Save it before leaving this
            page, then program the URL onto its NFC card or print its QR.
          </p>
          {origin && (
            <div className="invitation-qr">
              <QRCodeSVG
                aria-label="QR fallback for the private invitation"
                title="Private invitation QR code"
                value={`${origin}/invite#${state.token}`}
                size={184}
                level="Q"
                includeMargin
              />
              <span>Print this QR as the NFC card fallback.</span>
            </div>
          )}
          <code>
            {origin
              ? `${origin}/invite#${state.token}`
              : `/invite#${state.token}`}
          </code>
          <button
            className="button button-secondary"
            onClick={copyLink}
            type="button"
          >
            {copied ? "Copied" : "Copy invitation URL"}
          </button>
          <NfcCardWriter
            url={origin ? `${origin}/invite#${state.token}` : ""}
          />
        </div>
      )}
    </section>
  );
}
