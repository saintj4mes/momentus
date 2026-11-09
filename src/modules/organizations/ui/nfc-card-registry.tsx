"use client";

import { useActionState, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { NfcCardWriter } from "@/modules/nfc/ui/nfc-card-writer";
import { assignNfcCard, registerNfcCard, revokeNfcCard } from "../public";

type CardRow = {
  id: string;
  event_id: string | null;
  invitation_id: string | null;
  label: string;
  status: "unassigned" | "active" | "replaced" | "revoked";
  created_at: string;
};

type InvitationOption = { id: string; label: string; revoked_at: string | null };

export function NfcCardRegistry({
  eventId,
  organizationId,
  cards,
  invitations,
  cardRevoked,
}: {
  eventId: string;
  organizationId: string;
  cards: CardRow[];
  invitations: InvitationOption[];
  cardRevoked?: boolean;
}) {
  const router = useRouter();
  const [registerState, registerAction, registering] = useActionState(
    registerNfcCard.bind(null, organizationId),
    {},
  );
  const [assignState, assignAction, assigning] = useActionState(
    assignNfcCard.bind(null, eventId),
    {},
  );
  const [origin, setOrigin] = useState("");
  const availableCards = cards.filter((card) => card.status === "unassigned");
  const activeInvitations = invitations.filter((invitation) => !invitation.revoked_at);
  const activeCardCount = cards.filter((card) => card.event_id === eventId && card.status === "active").length;

  useEffect(() => {
    if (registerState.cardId || assignState.token) router.refresh();
  }, [registerState.cardId, assignState.token, router]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin && assignState.token
    ? `${origin}/invite#${assignState.token}`
    : "";

  return (
    <section className="organization-card nfc-registry">
      <div className="organization-heading">
        <div>
          <p className="eyebrow">CARD MANAGEMENT</p>
          <h2>NFC card registry</h2>
        </div>
        <span className="count-pill">{activeCardCount} active for this event</span>
      </div>
      <p className="quiet-copy">
        Register blank cards once, then assign each to one private invitation. Mode changes keep the printed card link stable.
      </p>

      {cardRevoked && <p className="notice success-message">The card was revoked and its previous link is no longer valid.</p>}

      <details className="form-disclosure">
        <summary>Register blank physical cards</summary>
        <form action={registerAction} className="nfc-register-form">
          <label className="field-label">
            Card inventory label
            <input className="text-field" maxLength={100} minLength={2} name="label" placeholder="e.g. MOM-0017" required />
          </label>
          <button className="button button-secondary" disabled={registering} type="submit">
            {registering ? "Registering…" : "Add to inventory"}
          </button>
          {registerState.error && <p className="form-message error-message" role="alert">{registerState.error}</p>}
          {registerState.cardId && <p className="form-message success-message" role="status">Card {registerState.label} added to unassigned inventory.</p>}
        </form>
      </details>

      {availableCards.length > 0 && activeInvitations.length > 0 && (
        <details className="form-disclosure nfc-assign-disclosure">
          <summary>Assign or replace an invitation card</summary>
          <form action={assignAction} className="nfc-register-form">
            <label className="field-label">Blank card
              <select className="text-field" name="cardId" required>
                {availableCards.map((card) => <option key={card.id} value={card.id}>{card.label}</option>)}
              </select>
            </label>
            <label className="field-label">Private invitation
              <select className="text-field" name="invitationId" required>
                {activeInvitations.map((invitation) => <option key={invitation.id} value={invitation.id}>{invitation.label}</option>)}
              </select>
            </label>
            <button className="button button-primary" disabled={assigning} type="submit">
              {assigning ? "Assigning…" : "Assign card"}
            </button>
            {assignState.error && <p className="form-message error-message" role="alert">{assignState.error}</p>}
          </form>
          {inviteUrl && (
            <div className="issued-link nfc-replacement-link" role="status">
              <p className="eyebrow">WRITE THE NEW CARD LINK ONCE</p>
              <p>Assigning a replacement invalidated the previous card URL. Program this new URL onto the blank card now.</p>
              <QRCodeSVG aria-label="QR fallback for the replacement invitation card" value={inviteUrl} size={160} level="Q" includeMargin />
              <code>{inviteUrl}</code>
              <NfcCardWriter url={inviteUrl} />
            </div>
          )}
        </details>
      )}

      <div className="nfc-card-table" role="table" aria-label="Event NFC cards">
        <div className="nfc-card-row nfc-card-table-head" role="row">
          <span role="columnheader">CARD</span><span role="columnheader">INVITATION</span><span role="columnheader">STATUS</span><span role="columnheader">ACTION</span>
        </div>
        {cards.filter((card) => card.event_id === eventId).map((card) => {
          const invitation = invitations.find((item) => item.id === card.invitation_id);
          return (
            <div className="nfc-card-row" key={card.id} role="row">
              <strong role="cell">{card.label}</strong>
              <span role="cell">{invitation?.label ?? "Invitation unavailable"}</span>
              <span className={`nfc-card-state ${card.status}`} role="cell">{card.status}</span>
              <span className="nfc-card-row-action" role="cell">
                {card.status === "active" && (
                  <details>
                    <summary>Revoke</summary>
                    <form action={revokeNfcCard} className="nfc-revoke-form">
                      <input name="eventId" type="hidden" value={eventId} />
                      <input name="cardId" type="hidden" value={card.id} />
                      <label className="field-label">Reason
                        <input className="text-field" maxLength={500} minLength={3} name="reason" required />
                      </label>
                      <button className="button button-secondary" type="submit">Revoke card and link</button>
                    </form>
                  </details>
                )}
              </span>
            </div>
          );
        })}
        {cards.filter((card) => card.event_id === eventId).length === 0 && (
          <p className="empty-copy">Invitation cards will appear here when issued or assigned.</p>
        )}
      </div>
    </section>
  );
}
