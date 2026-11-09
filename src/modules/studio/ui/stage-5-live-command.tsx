"use client";

import Link from "next/link";
import { useState } from "react";
import type { StudioEvent } from "../types";

interface Props {
  event: StudioEvent;
  onPrevStage?: () => void;
}

interface ActivityItem {
  id: string;
  time: string;
  guest: string;
  station: string;
  action: string;
  status: "admitted" | "duplicate" | "manual";
}

export function Stage5LiveCommand({ event, onPrevStage }: Props) {
  const [guestMode, setGuestMode] = useState<"rsvp" | "meal_booth" | "album">(event.guestMode);
  const [vipSearch, setVipSearch] = useState("");
  const [admittedCount, setAdmittedCount] = useState(48);
  const [activity, setActivity] = useState<ActivityItem[]>([
    {
      id: "act-1",
      time: "19:14",
      guest: "Amara Santos",
      station: "GATE-01",
      action: "Admitted · Primary + 2 Companions",
      status: "admitted",
    },
    {
      id: "act-2",
      time: "19:18",
      guest: "Luca Reyes",
      station: "VIP-SEAT",
      action: "Seated · Table 01 (Seat 1D)",
      status: "admitted",
    },
    {
      id: "act-3",
      time: "19:22",
      guest: "Unknown Card #NFC-1102",
      station: "GATE-01",
      action: "REJECTED · Counterfeit Token",
      status: "duplicate",
    },
    {
      id: "act-4",
      time: "19:25",
      guest: "Mikaela Cruz",
      station: "CATER-02",
      action: "Claimed · Halal Banquet Course",
      status: "admitted",
    },
  ]);
  const [manualNotice, setManualNotice] = useState("");

  const handleManualOverride = (guestName: string) => {
    if (!guestName.trim()) return;
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      guest: guestName.trim(),
      station: "COMMAND-DESK",
      action: "Supervisor Manual VIP Admission Override",
      status: "manual",
    };
    setActivity((prev) => [newAct, ...prev]);
    setAdmittedCount((c) => c + 1);
    setManualNotice(`✓ Manual override granted for ${guestName.trim()}! Pass recorded atomically.`);
    setVipSearch("");
    setTimeout(() => setManualNotice(""), 4500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Command Header */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span
            style={{
              backgroundColor: "#238636",
              color: "#ffffff",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              padding: "3px 8px",
              borderRadius: "4px",
            }}
          >
            LIVE TURNSTILE COMMAND CENTER
          </span>
          <h2 style={{ fontSize: "1.4rem", margin: "8px 0 4px 0", color: "#f0f6fc" }}>
            Event Operations &amp; Turnstile Throughput
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#8b949e" }}>
            Real-time multi-station flow, atomic duplicate interception, and lead supervisor override.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/staff/station-scanner"
            target="_blank"
            style={{
              backgroundColor: "#19352d",
              color: "#f5f0e8",
              border: "1px solid #c8a870",
              padding: "10px 18px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📱 Launch Mobile Staff Scanner PWA →
          </Link>
        </div>
      </div>

      {/* Real-time Turnout Gauge & Station Gauges */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Total Turnout
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#22c55e", marginTop: "4px" }}>
            {admittedCount} / {event.reservedPlaces}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            {Math.round((admittedCount / event.reservedPlaces) * 100)}% of confirmed guests
          </span>
        </div>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Turnstile Gate 01
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#38bdf8", marginTop: "4px" }}>
            38 Scans
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            Avg speed: 0.4s / pass
          </span>
        </div>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Catering Meal Claims
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#eab308", marginTop: "4px" }}>
            42 Courses
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            100% dietary verified
          </span>
        </div>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
            Atomic Interceptions
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f85149", marginTop: "4px" }}>
            1 Duplicate
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
            Counterfeit rejected at turnstile
          </span>
        </div>
      </div>

      {/* Manual VIP Override Bar */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <h3 style={{ fontSize: "1rem", margin: "0 0 4px 0", color: "#f0f6fc" }}>
          👑 Supervisor VIP Manual Lookup &amp; Admission Override
        </h3>
        <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "#8b949e" }}>
          If a VIP patron or elderly relative leaves their NFC card at home, search their name to verify seating and grant immediate atomic entry.
        </p>

        {manualNotice && (
          <div
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              border: "1px solid #22c55e",
              borderRadius: "6px",
              padding: "10px 14px",
              color: "#22c55e",
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          >
            {manualNotice}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleManualOverride(vipSearch);
          }}
          style={{ display: "flex", gap: "8px" }}
        >
          <input
            type="text"
            placeholder="Search VIP attendee name (e.g. Governor Andres Soriano)…"
            value={vipSearch}
            onChange={(e) => setVipSearch(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "#0d1117",
              border: "1px solid #30363d",
              color: "#f0f6fc",
              padding: "10px 14px",
              borderRadius: "6px",
              fontSize: "0.85rem",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#238636",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Admit VIP Manually
          </button>
        </form>
      </div>

      {/* Live Stream & Mode Switcher Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Left: Real-time Activity Stream */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h3 style={{ fontSize: "1rem", margin: "0 0 12px 0", color: "#f0f6fc" }}>
            Live Stream Feed
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activity.map((act) => (
              <div
                key={act.id}
                style={{
                  backgroundColor: "#0d1117",
                  border:
                    act.status === "duplicate"
                      ? "1px solid rgba(248, 81, 73, 0.4)"
                      : "1px solid #21262d",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#8b949e", fontSize: "0.75rem" }}>{act.time}</span>
                    <strong style={{ color: "#f0f6fc" }}>{act.guest}</strong>
                    <code style={{ fontSize: "0.7rem", color: "#c8a870" }}>{act.station}</code>
                  </div>
                  <div style={{ color: "#8b949e", fontSize: "0.75rem", marginTop: "2px" }}>
                    {act.action}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color:
                      act.status === "duplicate"
                        ? "#f85149"
                        : act.status === "manual"
                        ? "#eab308"
                        : "#22c55e",
                  }}
                >
                  {act.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Post-Event Memories & Privacy Lifecycle */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h3 style={{ fontSize: "1rem", margin: "0 0 4px 0", color: "#f0f6fc" }}>
            📸 Post-Event Memories &amp; Privacy Purge
          </h3>
          <p style={{ margin: "0 0 14px 0", fontSize: "0.8rem", color: "#8b949e" }}>
            Switch the event lifecycle from live check-in to the commemorative photo &amp; SDE album.
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {[
              { id: "rsvp", label: "RSVP Mode" },
              { id: "meal_booth", label: "Live Event Mode" },
              { id: "album", label: "Memories Album Mode" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setGuestMode(m.id as any)}
                type="button"
                style={{
                  flex: 1,
                  backgroundColor: guestMode === m.id ? "#19352d" : "#0d1117",
                  color: guestMode === m.id ? "#c8a870" : "#8b949e",
                  border: guestMode === m.id ? "1px solid #c8a870" : "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "8px 6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "12px", marginBottom: "14px" }}>
            <span style={{ fontSize: "0.75rem", color: "#8b949e", display: "block" }}>
              Active Mode Destination
            </span>
            <strong style={{ fontSize: "0.9rem", color: "#f0f6fc" }}>
              {guestMode === "album" ? "Retrospective Photo Album & SDE Video" : "Live Event Day Scanning"}
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#8b949e", display: "block", marginTop: "2px" }}>
              Tapping keepsake cards will open the memories album for all attendees.
            </span>
          </div>

          {/* Privacy Purge Indicator */}
          <div
            style={{
              backgroundColor: "rgba(200, 168, 112, 0.08)",
              border: "1px solid rgba(200, 168, 112, 0.25)",
              borderRadius: "6px",
              padding: "12px",
            }}
          >
            <strong style={{ fontSize: "0.8rem", color: "#e8ded1", display: "block" }}>
              🔒 Privacy Data Purge Lifecycle
            </strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#8b949e" }}>
              In compliance with MOMENTUS privacy invariants, sensitive dietary records and medical notes are scheduled for cryptographic purge 30 days post-event.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "8px" }}>
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
          ← Back to Credentials &amp; NFC Cards
        </button>
      </div>
    </div>
  );
}

