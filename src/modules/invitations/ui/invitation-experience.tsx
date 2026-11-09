"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lookupPublicInvitation } from "../public";
import type { PublicInvitation } from "../queries";
import { ActiveEventMode } from "./active-event-mode";
import { RsvpForm } from "./rsvp-form";

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

export function InvitationExperience() {
  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const incomingToken = window.location.hash.slice(1);
    if (!/^[a-f0-9]{64}$/i.test(incomingToken)) {
      setLoading(false);
      return;
    }
    setToken(incomingToken);
    void lookupPublicInvitation(incomingToken).then((result) => {
      setInvitation(result);
      setLoading(false);
    });
  }, []);

  const deadlinePassed = invitation?.rsvp_deadline
    ? new Date(invitation.rsvp_deadline).getTime() < Date.now()
    : false;
  const canRespond = Boolean(
    invitation &&
      !invitation.already_submitted &&
      !deadlinePassed &&
      ["published", "live"].includes(invitation.event_status),
  );

  if (loading) {
    return (
      <main className="guest-page guest-loading" aria-live="polite">
        <p className="eyebrow">A PRIVATE INVITATION</p>
        <p>Opening your invitation…</p>
      </main>
    );
  }
  if (!invitation || !token) {
    return (
      <main className="guest-page guest-loading">
        <p className="eyebrow">INVITATION UNAVAILABLE</p>
        <h1>This private link isn’t available.</h1>
        <p>
          Check that you opened the full link, or contact the event organizer.
        </p>
      </main>
    );
  }

  if (invitation.guest_mode !== "rsvp") {
    return <ActiveEventMode invitation={invitation} />;
  }

  return (
    <main className="guest-page">
      <header className="guest-header">
        <Link className="wordmark" href="/">
          <span className="wordmark-symbol" aria-hidden="true">
            m
          </span>
          <span>MOMENTUS</span>
        </Link>
        <span className="guest-private-label">A PRIVATE INVITATION</span>
      </header>

      <div className="guest-layout">
        <section className="guest-event-card">
          <p className="eyebrow">YOU’RE INVITED</p>
          <div aria-hidden="true" className="guest-flower">
            <span />
            <span />
            <span />
            <span />
            <i />
          </div>
          <p className="guest-kicker">A DAY TO CELEBRATE</p>
          <h1>{invitation.event_name}</h1>
          <div className="guest-event-rule" />
          <p className="guest-event-date">
            {formatDate(invitation.event_date)}
          </p>
          <p className="guest-event-time">
            {invitation.event_time.slice(0, 5)} · {invitation.timezone}
          </p>
          {invitation.venue && (
            <p className="guest-event-venue">{invitation.venue}</p>
          )}
          {invitation.rsvp_deadline && (
            <p className="guest-deadline">
              Kindly reply by{" "}
              {formatDate(invitation.rsvp_deadline.slice(0, 10))}.
            </p>
          )}
        </section>

        <section className="guest-response-card">
          {invitation.already_submitted ? (
            <div className="rsvp-recorded">
              <p className="eyebrow">RESPONSE SAVED</p>
              <h2>Thank you for replying.</h2>
              <p className="quiet-copy">
                Here is the response saved for this invitation:
              </p>
              <ul className="response-list">
                {invitation.submitted_attendees.map((attendee) => (
                  <li key={attendee.slot}>
                    <span>
                      <strong>{attendee.name}</strong>
                      <small>Guest {attendee.slot}</small>
                    </span>
                    <span className="response-status">
                      {attendee.attendanceStatus}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="field-hint">
                Need to correct something? Contact the event organizer for help.
              </p>
            </div>
          ) : canRespond ? (
            <RsvpForm
              companionAllowance={invitation.companion_allowance}
              token={token}
            />
          ) : (
            <div className="rsvp-recorded">
              <p className="eyebrow">RSVP CLOSED</p>
              <h2>Thank you for visiting.</h2>
              <p className="quiet-copy">
                {deadlinePassed
                  ? "The reply date for this invitation has passed. Please contact the event organizer if you need help."
                  : "This event is no longer accepting responses."}
              </p>
            </div>
          )}
        </section>
      </div>

      <footer className="guest-footer">
        Made for the moments that matter.
      </footer>
    </main>
  );
}
