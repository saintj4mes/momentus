"use client";

import Link from "next/link";
import type { StudioEvent } from "../types";

interface Props {
  event: StudioEvent;
  onNextStage?: () => void;
  onPrevStage?: () => void;
}

export function Stage2Designer({ event, onNextStage, onPrevStage }: Props) {
  const designerUrl = `/admin/designer/${event.micrositeSlug}`;
  const liveUrl = `/event/${event.micrositeSlug}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Studio Banner */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
          <div>
            <span
              style={{
                backgroundColor: "#21262d",
                color: "#c8a870",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              GRAPESJS OPEN-STANDARD VISUAL CANVAS
            </span>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 4px 0", color: "#f0f6fc" }}>
              Bespoke Microsite &amp; Interactive RSVP Island
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8b949e" }}>
              Craft the guest-facing digital invitation page with drag-and-drop hero sections, program timelines, photo galleries, and dress code palettes.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href={liveUrl}
              target="_blank"
              style={{
                backgroundColor: "#21262d",
                color: "#f0f6fc",
                border: "1px solid #30363d",
                padding: "10px 16px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              View Live Page ↗
            </Link>
            <Link
              href={designerUrl}
              style={{
                backgroundColor: "#19352d",
                color: "#f5f0e8",
                border: "1px solid #c8a870",
                padding: "10px 20px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🎨 Launch Visual Studio →
            </Link>
          </div>
        </div>

        {/* Live Snapshot Status Pill */}
        <div
          style={{
            backgroundColor: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: "8px",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                backgroundColor: "#22c55e",
                color: "#0d1117",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            <div>
              <strong style={{ fontSize: "0.9rem", color: "#f0f6fc" }}>
                Published Snapshot Active
              </strong>
              <span style={{ fontSize: "0.75rem", color: "#8b949e", display: "block" }}>
                Revision {event.publishedRevision ?? 1} · Compiled with clean HTML &amp; scoped CSS · No client scripts
              </span>
            </div>
          </div>

          <span
            style={{
              backgroundColor: "#21262d",
              color: "#c8a870",
              fontSize: "0.75rem",
              padding: "4px 10px",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            Sub-second Edge CDN Cached
          </span>
        </div>
      </div>

      {/* Interactive Island Architecture Feature Card */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "24px",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", margin: "0 0 8px 0", color: "#f0f6fc" }}>
          🏝️ Dynamic React RSVP Island
        </h3>
        <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#8b949e" }}>
          Your static GrapesJS layout stays lightning fast while automatically hosting an interactive React island for guests to submit their attendance, dietary requests, and companion details.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          <div style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "12px" }}>
            <strong style={{ fontSize: "0.85rem", color: "#c8a870", display: "block", marginBottom: "4px" }}>
              1. Household Scoped
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Primary guest receives a private high-entropy token link that pre-populates their reserved party count.
            </span>
          </div>

          <div style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "12px" }}>
            <strong style={{ fontSize: "0.85rem", color: "#c8a870", display: "block", marginBottom: "4px" }}>
              2. Custom Questionnaires
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Collects dietary allergies, table preferences, and shuttle choices with server validation.
            </span>
          </div>

          <div style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", padding: "12px" }}>
            <strong style={{ fontSize: "0.85rem", color: "#c8a870", display: "block", marginBottom: "4px" }}>
              3. Automatic Notification Outbox
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Confirmation emails with printable passes and calendar files are dispatched atomically upon RSVP.
            </span>
          </div>
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
          ← Back to Setup
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
          Next: Guest Management &amp; Seating (Stage 03) →
        </button>
      </div>
    </div>
  );
}

