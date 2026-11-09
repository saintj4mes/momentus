"use client";

import { useActionState, useState } from "react";
import { submitRsvp } from "../public";

const attendanceOptions = [
  { value: "attending", label: "Joyfully accepts" },
  { value: "declined", label: "Regretfully declines" },
  { value: "undecided", label: "Not sure yet" },
];

export function RsvpForm({
  token,
  companionAllowance,
}: {
  token: string;
  companionAllowance: number;
}) {
  const [state, formAction, pending] = useActionState(submitRsvp, {});
  const [partySize, setPartySize] = useState(1);
  const maxPartySize = companionAllowance + 1;

  if (state.success) {
    return (
      <div className="rsvp-success" role="status">
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <p className="eyebrow">RESPONSE RECEIVED</p>
        <h2>Thank you for letting us know.</h2>
        <p>
          Your RSVP is saved. The email confirmation service is not enabled in
          this local MVP yet.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rsvp-form">
      <input name="token" type="hidden" value={token} />
      <input name="attendeeCount" type="hidden" value={partySize} />
      <div className="rsvp-form-heading">
        <p className="eyebrow">KINDLY REPLY</p>
        <h2>Will you join us?</h2>
        <p>
          Your invitation includes up to {maxPartySize}{" "}
          {maxPartySize === 1 ? "guest" : "guests"}.
        </p>
      </div>

      <div className="attendee-fields">
        {Array.from({ length: partySize }, (_, index) => (
          <fieldset
            className="attendee-fieldset"
            key={index === 0 ? "primary" : `companion-${index}`}
          >
            <legend>
              {index === 0 ? "Primary guest" : `Guest ${index + 1}`}
            </legend>
            <label className="field-label">
              Full name
              <input
                autoComplete="name"
                className="text-field"
                maxLength={120}
                name={`attendee_${index}_name`}
                required
              />
            </label>
            <label className="field-label">
              Response
              <select
                className="text-field"
                defaultValue="attending"
                name={`attendee_${index}_status`}
                required
              >
                {attendanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        ))}
      </div>

      {partySize < maxPartySize && (
        <button
          className="text-button add-guest-button"
          onClick={() =>
            setPartySize((current) => Math.min(maxPartySize, current + 1))
          }
          type="button"
        >
          + Add a companion
        </button>
      )}
      {partySize > 1 && (
        <button
          className="text-button remove-guest-button"
          onClick={() => setPartySize((current) => Math.max(1, current - 1))}
          type="button"
        >
          Remove last companion
        </button>
      )}

      <label className="field-label email-field">
        Primary email address
        <input
          autoComplete="email"
          className="text-field"
          maxLength={320}
          name="email"
          required
          type="email"
        />
        <span className="field-hint">
          Your organizer can use this for event updates. Automated email
          delivery is not enabled in this local MVP yet.
        </span>
      </label>

      {state.error && (
        <p className="form-message error-message" role="alert">
          {state.error}
        </p>
      )}
      <button
        className="button button-primary"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving your response…" : "Send my RSVP"}
      </button>
      <p className="privacy-note">
        Your invitation link is private. Please do not post it publicly.
      </p>
    </form>
  );
}
