"use client";

import Link from "next/link";
import { useState } from "react";
import type { StudioEvent, StudioGuestParty, StudioStage } from "../types";
import { EventLifecycleNav } from "./event-lifecycle-nav";
import { Stage1Setup } from "./stage-1-setup";
import { Stage2Designer } from "./stage-2-designer";
import { Stage3Guests, DEFAULT_GUESTS } from "./stage-3-guests";
import { Stage4Credentials } from "./stage-4-credentials";
import { Stage5LiveCommand } from "./stage-5-live-command";

interface Props {
  initialEvent: StudioEvent;
  initialGuests?: StudioGuestParty[];
  initialStage?: StudioStage;
}

export function StudioEventWorkspace({
  initialEvent,
  initialGuests = DEFAULT_GUESTS,
  initialStage = "setup",
}: Props) {
  const [event, setEvent] = useState<StudioEvent>(initialEvent);
  const [guests, setGuests] = useState<StudioGuestParty[]>(
    initialGuests.length > 0 ? initialGuests : DEFAULT_GUESTS,
  );
  const [stage, setStage] = useState<StudioStage>(initialStage);
  const [completedStages, setCompletedStages] = useState<StudioStage[]>([
    "setup",
    "designer",
  ]);

  const advanceStage = (next: StudioStage) => {
    setCompletedStages((prev) => (prev.includes(stage) ? prev : [...prev, stage]));
    setStage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#0d1117",
        minHeight: "100vh",
        color: "#f0f6fc",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        paddingBottom: "80px",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          backgroundColor: "#161b22",
          borderBottom: "1px solid #30363d",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/admin"
            style={{
              color: "#8b949e",
              textDecoration: "none",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← All Workspaces
          </Link>
          <div style={{ height: "16px", width: "1px", backgroundColor: "#30363d" }} />
          <span style={{ fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.85rem", color: "#c8a870" }}>
            MOMENTUS · EVENT STUDIO
          </span>
          <span style={{ color: "#8b949e", fontSize: "0.85rem" }}>
            / {event.name}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href={`/event/${event.micrositeSlug}`}
            target="_blank"
            style={{
              backgroundColor: "#21262d",
              color: "#f0f6fc",
              border: "1px solid #30363d",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Live Microsite ↗
          </Link>
          <Link
            href="/staff/station-scanner"
            target="_blank"
            style={{
              backgroundColor: "#19352d",
              color: "#c8a870",
              border: "1px solid #c8a870",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📱 Station Scanner
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1140px", margin: "0 auto", padding: "24px 20px" }}>
        {/* 5-Stage Guided Progress Navigation Bar */}
        <EventLifecycleNav
          activeStage={stage}
          completedStages={completedStages}
          onSelectStage={setStage}
        />

        {/* Stage Content Renderers */}
        {stage === "setup" && (
          <Stage1Setup
            event={event}
            onNextStage={() => advanceStage("designer")}
            onUpdateEvent={(updates) => setEvent((prev) => ({ ...prev, ...updates }))}
          />
        )}

        {stage === "designer" && (
          <Stage2Designer
            event={event}
            onNextStage={() => advanceStage("guests")}
            onPrevStage={() => setStage("setup")}
          />
        )}

        {stage === "guests" && (
          <Stage3Guests
            event={event}
            initialGuests={guests}
            onNextStage={() => advanceStage("credentials")}
            onPrevStage={() => setStage("designer")}
          />
        )}

        {stage === "credentials" && (
          <Stage4Credentials
            event={event}
            guests={guests}
            onNextStage={() => advanceStage("live_ops")}
            onPrevStage={() => setStage("guests")}
          />
        )}

        {stage === "live_ops" && (
          <Stage5LiveCommand
            event={event}
            onPrevStage={() => setStage("credentials")}
          />
        )}
      </main>
    </div>
  );
}
