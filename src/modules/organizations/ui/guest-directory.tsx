"use client";

import { useMemo, useState } from "react";

export type EventGuestRow = {
  id: string;
  invitation_id: string;
  slot: number;
  name: string;
  attendance_status: "attending" | "declined" | "undecided";
  created_at: string;
  invitation_label: string;
  primary_email: string | null;
  rsvp_submitted_at: string | null;
};

export type EventInvitationRow = {
  id: string;
  label: string;
  companion_allowance: number;
  reserved_places: number;
  issued_at: string;
  primary_email: string | null;
  rsvp_submitted_at: string | null;
  revoked_at: string | null;
};

function csvCell(value: string) {
  const safeValue = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function GuestDirectory({
  eventName,
  capacity,
  reservedPlaces,
  guests,
  invitations,
}: {
  eventName: string;
  capacity: number;
  reservedPlaces: number;
  guests: EventGuestRow[];
  invitations: EventInvitationRow[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedInvitation, setSelectedInvitation] = useState("all");
  const [submittedDate, setSubmittedDate] = useState("");
  const activeInvitations = invitations.filter(
    (invitation) => !invitation.revoked_at,
  );
  const pending = activeInvitations.filter(
    (invitation) => !invitation.rsvp_submitted_at,
  ).length;
  const confirmed = guests.filter(
    (guest) => guest.attendance_status === "attending",
  ).length;
  const declined = guests.filter(
    (guest) => guest.attendance_status === "declined",
  ).length;
  const visibleGuests = useMemo(
    () =>
      guests.filter((guest) => {
        const matchesQuery =
          `${guest.name} ${guest.primary_email ?? ""} ${guest.invitation_label}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return (
          matchesQuery &&
          (status === "all" || guest.attendance_status === status) &&
          (selectedInvitation === "all" ||
            guest.invitation_id === selectedInvitation) &&
          (!submittedDate ||
            (guest.rsvp_submitted_at ?? guest.created_at).slice(0, 10) ===
              submittedDate)
        );
      }),
    [guests, query, selectedInvitation, status, submittedDate],
  );

  function exportCsv() {
    const header = [
      "Event",
      "Invitation",
      "Person",
      "Relationship",
      "Email",
      "RSVP status",
      "Submitted at",
    ];
    const rows = visibleGuests.map((guest) => [
      eventName,
      guest.invitation_label,
      guest.name,
      guest.slot === 1 ? "Primary guest" : `Companion ${guest.slot - 1}`,
      guest.primary_email ?? "",
      guest.attendance_status,
      guest.rsvp_submitted_at ?? guest.created_at,
    ]);
    const content = [header, ...rows]
      .map((row) => row.map((cell) => csvCell(String(cell))).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-guests.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className="panel event-guests"
      aria-labelledby="guest-directory-title"
    >
      <div className="organization-heading">
        <div>
          <p className="eyebrow">EVENT-SCOPED GUESTS</p>
          <h2 id="guest-directory-title">Guest directory & RSVP</h2>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={exportCsv}
          disabled={!visibleGuests.length}
        >
          Export filtered CSV
        </button>
      </div>
      <div className="guest-metrics">
        <article>
          <strong>{activeInvitations.length}</strong>
          <span>Active invitations</span>
        </article>
        <article>
          <strong>{pending}</strong>
          <span>Awaiting response</span>
        </article>
        <article>
          <strong>{confirmed}</strong>
          <span>Confirmed people</span>
        </article>
        <article>
          <strong>{declined}</strong>
          <span>Declined people</span>
        </article>
        <article>
          <strong>Not supported</strong>
          <span>Waitlist in current schema</span>
        </article>
        <article>
          <strong>
            {reservedPlaces}/{capacity}
          </strong>
          <span>Places reserved</span>
        </article>
      </div>
      <p className="field-hint">
        Capacity uses server-maintained invitation reservations. Waitlist is not
        supported by the current database model.
      </p>
      <div className="guest-filters">
        <label>
          Search guests
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, or invitation"
          />
        </label>
        <label>
          RSVP status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All responses</option>
            <option value="attending">Confirmed</option>
            <option value="declined">Declined</option>
            <option value="undecided">Undecided</option>
          </select>
        </label>
        <label>
          Invitation group
          <select
            value={selectedInvitation}
            onChange={(event) => setSelectedInvitation(event.target.value)}
          >
            <option value="all">All invitations</option>
            {invitations.map((invitation) => (
              <option key={invitation.id} value={invitation.id}>
                {invitation.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Submitted on
          <input
            type="date"
            value={submittedDate}
            onChange={(event) => setSubmittedDate(event.target.value)}
          />
        </label>
      </div>
      {visibleGuests.length ? (
        <div className="guest-table-wrap">
          <table className="guest-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Invitation</th>
                <th>Relationship</th>
                <th>RSVP</th>
                <th>Primary email</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {visibleGuests.map((guest) => (
                <tr key={guest.id}>
                  <td>{guest.name}</td>
                  <td>{guest.invitation_label}</td>
                  <td>
                    {guest.slot === 1
                      ? "Primary guest"
                      : `Companion ${guest.slot - 1}`}
                  </td>
                  <td>
                    <span
                      className={`status-pill status-${guest.attendance_status}`}
                    >
                      {guest.attendance_status}
                    </span>
                  </td>
                  <td>{guest.primary_email ?? "—"}</td>
                  <td>
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(
                      new Date(guest.rsvp_submitted_at ?? guest.created_at),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-copy">
          {guests.length
            ? "No guests match these filters."
            : "No RSVP responses have been submitted for this event yet."}
        </p>
      )}
      {activeInvitations.length > 0 && (
        <details className="guest-invitation-history">
          <summary>
            Invitation status and history ({invitations.length})
          </summary>
          <ul>
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <span>
                  <strong>{invitation.label}</strong>
                  <small>
                    {invitation.primary_email ?? "No RSVP email yet"} ·{" "}
                    {invitation.reserved_places} reserved place(s) · issued{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(new Date(invitation.issued_at))}
                  </small>
                </span>
                <span>
                  {invitation.revoked_at
                    ? "Revoked"
                    : invitation.rsvp_submitted_at
                      ? `Submitted ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(invitation.rsvp_submitted_at))}`
                      : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
