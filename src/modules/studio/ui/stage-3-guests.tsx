"use client";

import { useMemo, useState } from "react";
import type { StudioEvent, StudioGuestParty } from "../types";

interface Props {
  event: StudioEvent;
  initialGuests?: StudioGuestParty[];
  onNextStage?: () => void;
  onPrevStage?: () => void;
}

export const DEFAULT_GUESTS: StudioGuestParty[] = [
  {
    id: "inv-01",
    label: "Amara Santos & Family",
    primaryGuestName: "Amara Santos",
    primaryEmail: "amara@santosreyes.com",
    companionAllowance: 2,
    reservedPlaces: 3,
    tableAssignment: "Table 01 - Presidential",
    seatAssignment: "Seat 1A",
    dietaryNotes: "Pescatarian · Nut Allergy",
    tokenHash: "tok-amara-8812",
    rsvpStatus: "confirmed",
    issuedNfcCardId: "NFC-8821",
    nfcCardStatus: "active",
    companions: [
      { id: "c-1", name: "Elena Santos (Mother)", attendance: "attending", dietaryNotes: "Standard" },
      { id: "c-2", name: "Rafael Santos (Father)", attendance: "attending", dietaryNotes: "Standard" },
    ],
  },
  {
    id: "inv-02",
    label: "Luca Reyes & Party",
    primaryGuestName: "Luca Reyes",
    primaryEmail: "luca@santosreyes.com",
    companionAllowance: 1,
    reservedPlaces: 2,
    tableAssignment: "Table 01 - Presidential",
    seatAssignment: "Seat 1D",
    dietaryNotes: "Gluten-Free Chef Choice",
    tokenHash: "tok-luca-3341",
    rsvpStatus: "confirmed",
    issuedNfcCardId: "NFC-8822",
    nfcCardStatus: "active",
    companions: [
      { id: "c-3", name: "Mateo Reyes (Best Man)", attendance: "attending", dietaryNotes: "Standard" },
    ],
  },
  {
    id: "inv-03",
    label: "Mikaela Cruz",
    primaryGuestName: "Mikaela Cruz",
    primaryEmail: "mikaela@cruzdebut.com",
    companionAllowance: 1,
    reservedPlaces: 2,
    tableAssignment: "Head Table - Fairytale",
    seatAssignment: "Throne 01",
    dietaryNotes: "Halal / No Shellfish",
    tokenHash: "tok-mikaela-9921",
    rsvpStatus: "confirmed",
    issuedNfcCardId: "NFC-8823",
    nfcCardStatus: "active",
    companions: [
      { id: "c-4", name: "Samantha Tan", attendance: "attending", dietaryNotes: "Vegetarian" },
    ],
  },
  {
    id: "inv-04",
    label: "Governor Andres Soriano",
    primaryGuestName: "Andres Soriano",
    primaryEmail: "asoriano@patron.ph",
    companionAllowance: 1,
    reservedPlaces: 2,
    tableAssignment: "Table 02 - Dignitaries",
    seatAssignment: "Seat 2A",
    dietaryNotes: "None",
    tokenHash: "tok-soriano-4412",
    rsvpStatus: "pending",
    companions: [],
  },
];

export function Stage3Guests({
  event,
  initialGuests = DEFAULT_GUESTS,
  onNextStage,
  onPrevStage,
}: Props) {
  const [guests, setGuests] = useState<StudioGuestParty[]>(initialGuests);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "declined">("all");
  const [search, setSearch] = useState("");

  // New Party Form Modal
  const [isAddingParty, setIsAddingParty] = useState(false);
  const [newPrimaryName, setNewPrimaryName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompanions, setNewCompanions] = useState(1);
  const [newTable, setNewTable] = useState("Table 03 - Garden");
  const [newDietary, setNewDietary] = useState("");

  const confirmedCount = guests.filter((g) => g.rsvpStatus === "confirmed").length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === "pending").length;
  const totalAttendees = guests.reduce(
    (acc, g) =>
      acc +
      (g.rsvpStatus === "confirmed"
        ? 1 + g.companions.filter((c) => c.attendance === "attending").length
        : 0),
    0,
  );

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchFilter = filter === "all" || g.rsvpStatus === filter;
      const matchSearch =
        !search ||
        `${g.label} ${g.primaryGuestName} ${g.primaryEmail || ""} ${g.tableAssignment || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [guests, filter, search]);

  const handleAddParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrimaryName.trim()) return;

    const newParty: StudioGuestParty = {
      id: `inv-${Date.now()}`,
      label: `${newPrimaryName.trim()} & Party`,
      primaryGuestName: newPrimaryName.trim(),
      primaryEmail: newEmail.trim() || undefined,
      companionAllowance: newCompanions,
      reservedPlaces: newCompanions + 1,
      tableAssignment: newTable,
      seatAssignment: "Unassigned",
      dietaryNotes: newDietary.trim() || "Standard",
      tokenHash: `tok-${Math.random().toString(36).slice(2, 8)}`,
      rsvpStatus: "pending",
      companions: [],
    };

    setGuests((prev) => [newParty, ...prev]);
    setIsAddingParty(false);
    setNewPrimaryName("");
    setNewEmail("");
    setNewCompanions(1);
    setNewDietary("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Turnout & RSVP Metrics Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Total Invitations
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f0f6fc", marginTop: "4px" }}>
            {guests.length} Households
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            {guests.reduce((acc, g) => acc + g.reservedPlaces, 0)} reserved places
          </span>
        </div>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Confirmed Attending
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#22c55e", marginTop: "4px" }}>
            {totalAttendees} Guests
          </div>
          <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>
            {confirmedCount} parties confirmed
          </span>
        </div>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Awaiting Response
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#eab308", marginTop: "4px" }}>
            {pendingCount} Parties
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            Automatic RSVP reminders queued
          </span>
        </div>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Dietary Flagged
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#c8a870", marginTop: "4px" }}>
            3 Special Menus
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            Nut allergy · Gluten-Free · Halal
          </span>
        </div>
      </div>

      {/* Guest Directory Controls */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1, minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Search by guest name, table, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "360px",
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                color: "#f0f6fc",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "0.85rem",
              }}
            />
            <div style={{ display: "flex", gap: "4px" }}>
              {(["all", "confirmed", "pending", "declined"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  type="button"
                  style={{
                    backgroundColor: filter === st ? "#21262d" : "transparent",
                    color: filter === st ? "#c8a870" : "#8b949e",
                    border: filter === st ? "1px solid #c8a870" : "1px solid #30363d",
                    borderRadius: "4px",
                    padding: "6px 10px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setIsAddingParty(true)}
              type="button"
              style={{
                backgroundColor: "#238636",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Issue Private Invitation
            </button>
          </div>
        </div>

        {/* Add Invitation Form Modal */}
        {isAddingParty && (
          <form
            onSubmit={handleAddParty}
            style={{
              backgroundColor: "#0d1117",
              border: "1px solid #c8a870",
              borderRadius: "8px",
              padding: "18px",
              marginBottom: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label style={{ fontSize: "0.75rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
                Primary Guest Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Clara"
                value={newPrimaryName}
                onChange={(e) => setNewPrimaryName(e.target.value)}
                style={{ width: "100%", backgroundColor: "#161b22", border: "1px solid #30363d", color: "#f0f6fc", padding: "8px", borderRadius: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
                Email (for digital QR pass)
              </label>
              <input
                type="email"
                placeholder="maria@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{ width: "100%", backgroundColor: "#161b22", border: "1px solid #30363d", color: "#f0f6fc", padding: "8px", borderRadius: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
                Companion Allowance
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={newCompanions}
                onChange={(e) => setNewCompanions(parseInt(e.target.value) || 0)}
                style={{ width: "100%", backgroundColor: "#161b22", border: "1px solid #30363d", color: "#f0f6fc", padding: "8px", borderRadius: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
                Table Assignment
              </label>
              <input
                type="text"
                placeholder="Table 03 - Garden"
                value={newTable}
                onChange={(e) => setNewTable(e.target.value)}
                style={{ width: "100%", backgroundColor: "#161b22", border: "1px solid #30363d", color: "#f0f6fc", padding: "8px", borderRadius: "4px" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button
                onClick={() => setIsAddingParty(false)}
                type="button"
                style={{ backgroundColor: "transparent", border: "1px solid #30363d", color: "#8b949e", padding: "6px 14px", borderRadius: "4px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "#238636", border: "none", color: "#fff", fontWeight: 600, padding: "6px 18px", borderRadius: "4px" }}
              >
                Save Invitation Party
              </button>
            </div>
          </form>
        )}

        {/* Guests Roster Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d", textAlign: "left", color: "#8b949e" }}>
                <th style={{ padding: "10px" }}>Household Party</th>
                <th style={{ padding: "10px" }}>RSVP Status</th>
                <th style={{ padding: "10px" }}>Reserved Places</th>
                <th style={{ padding: "10px" }}>Table &amp; Seating</th>
                <th style={{ padding: "10px" }}>Dietary Needs</th>
                <th style={{ padding: "10px" }}>NFC Card ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((g) => (
                <tr key={g.id} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: "10px" }}>
                    <strong style={{ color: "#f0f6fc", display: "block" }}>{g.primaryGuestName}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>{g.label}</span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        backgroundColor:
                          g.rsvpStatus === "confirmed"
                            ? "rgba(34, 197, 94, 0.15)"
                            : "rgba(234, 179, 8, 0.15)",
                        color: g.rsvpStatus === "confirmed" ? "#22c55e" : "#eab308",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {g.rsvpStatus}
                    </span>
                  </td>
                  <td style={{ padding: "10px", color: "#f0f6fc" }}>
                    1 Primary + {g.companionAllowance} Companions
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ color: "#c8a870", fontWeight: 600 }}>{g.tableAssignment}</span>
                    <span style={{ fontSize: "0.75rem", color: "#8b949e", display: "block" }}>{g.seatAssignment}</span>
                  </td>
                  <td style={{ padding: "10px", color: "#8b949e" }}>
                    {g.dietaryNotes || "Standard"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {g.issuedNfcCardId ? (
                      <code style={{ backgroundColor: "#0d1117", color: "#22c55e", padding: "2px 6px", borderRadius: "3px", fontSize: "0.8rem" }}>
                        {g.issuedNfcCardId}
                      </code>
                    ) : (
                      <span style={{ color: "#8b949e", fontSize: "0.75rem" }}>Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        <button
          onClick={onPrevStage}
          type="button"
          style={{
            backgroundColor: "transparent",
            color: "#8b949e",
            padding: "10px 18px",
            borderRadius: "6px",
            border: "1px solid #30363d",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          ← Back to Designer Studio
        </button>
        <button
          onClick={onNextStage}
          type="button"
          style={{
            backgroundColor: "#c8a870",
            color: "#0c2820",
            fontWeight: 700,
            padding: "12px 24px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Next: NFC Cards &amp; QR Credentials (Stage 04) →
        </button>
      </div>
    </div>
  );
}
