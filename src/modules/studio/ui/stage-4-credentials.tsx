"use client";

import { useState } from "react";
import type { StudioEvent, StudioGuestParty } from "../types";

interface Props {
  event: StudioEvent;
  guests?: StudioGuestParty[];
  onNextStage?: () => void;
  onPrevStage?: () => void;
}

export function Stage4Credentials({
  event,
  guests = [],
  onNextStage,
  onPrevStage,
}: Props) {
  const [selectedPartyId, setSelectedPartyId] = useState<string>(guests[0]?.id || "");
  const [encodingState, setEncodingState] = useState<"idle" | "listening" | "success">("idle");
  const [pairedCards, setPairedCards] = useState<Record<string, string>>({
    "inv-01": "NFC-8821",
    "inv-02": "NFC-8822",
    "inv-03": "NFC-8823",
  });
  const [statusNotice, setStatusNotice] = useState("");

  const selectedParty = guests.find((g) => g.id === selectedPartyId) || guests[0];
  const currentCardId = pairedCards[selectedParty?.id || ""];

  // Play Web Audio chime on successful pairing
  const playPairingChime = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  };

  const handleSimulateEncode = () => {
    if (!selectedParty) return;
    setEncodingState("listening");
    setStatusNotice("Hold blank NTAG213 wood/titanium card near the phone or desktop USB reader…");

    setTimeout(() => {
      const newCardId = `NFC-${Math.floor(1000 + Math.random() * 9000)}`;
      setPairedCards((prev) => ({ ...prev, [selectedParty.id]: newCardId }));
      setEncodingState("success");
      playPairingChime();
      setStatusNotice(
        `✓ Success! Card ${newCardId} is permanently paired to ${selectedParty.primaryGuestName} (${selectedParty.reservedPlaces} places).`,
      );
      setTimeout(() => setEncodingState("idle"), 3000);
    }, 1200);
  };

  const handleExportBatchManifest = () => {
    const csvHeader = "Invitation ID,Primary Guest,Party Label,Companion Count,Table,Seat,Dietary,NFC Card ID,Secure Access URL\n";
    const csvRows = guests
      .map((g) => {
        const card = pairedCards[g.id] || "UNASSIGNED";
        const url = `https://${event.micrositeSlug}.momentus.events/pass/${g.tokenHash}`;
        return `"${g.id}","${g.primaryGuestName}","${g.label}",${g.companionAllowance},"${g.tableAssignment || ""}","${g.seatAssignment || ""}","${g.dietaryNotes || ""}","${card}","${url}"`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `momentus-credentials-${event.micrositeSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusNotice("✓ Exported print-ready credential manifest CSV!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Overview Banner */}
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
              DUAL-MODE CREDENTIAL ISSUANCE
            </span>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 4px 0", color: "#f0f6fc" }}>
              NFC Keepsake Programming &amp; Badge Manifest
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8b949e" }}>
              Permanently pair physical laser-engraved NFC cards to household invitations, or export bulk print-ready manifests with QR ticket passes.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleExportBatchManifest}
              type="button"
              style={{
                backgroundColor: "#21262d",
                color: "#f0f6fc",
                border: "1px solid #30363d",
                padding: "10px 16px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📥 Export Print Manifest (CSV)
            </button>
          </div>
        </div>

        {statusNotice && (
          <div
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              border: "1px solid #22c55e",
              borderRadius: "6px",
              padding: "10px 14px",
              color: "#22c55e",
              fontSize: "0.85rem",
              marginTop: "12px",
            }}
          >
            {statusNotice}
          </div>
        )}
      </div>

      {/* Tap-to-Encode Interactive Station */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Left: Guest Queue Selector */}
        <div>
          <h3 style={{ fontSize: "1.05rem", margin: "0 0 8px 0", color: "#f0f6fc" }}>
            1. Select Household to Pair
          </h3>
          <p style={{ margin: "0 0 14px 0", fontSize: "0.8rem", color: "#8b949e" }}>
            Pick a guest party from the confirmed list to write their credentials.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
            {guests.map((g) => {
              const isSelected = selectedPartyId === g.id;
              const cardId = pairedCards[g.id];

              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedPartyId(g.id)}
                  type="button"
                  style={{
                    backgroundColor: isSelected ? "#19352d" : "#0d1117",
                    border: isSelected ? "1px solid #c8a870" : "1px solid #21262d",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: isSelected ? "#f5f0e8" : "#f0f6fc", display: "block" }}>
                      {g.primaryGuestName}
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
                      {g.label} · {g.tableAssignment}
                    </span>
                  </div>

                  {cardId ? (
                    <span
                      style={{
                        backgroundColor: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}
                    >
                      {cardId}
                    </span>
                  ) : (
                    <span style={{ color: "#8b949e", fontSize: "0.75rem" }}>
                      Unpaired
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Hardware Card Writer */}
        {selectedParty && (
          <div
            style={{
              backgroundColor: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "0.7rem", color: "#c8a870", fontWeight: 700, textTransform: "uppercase" }}>
                Active Target Household
              </span>
              <h3 style={{ fontSize: "1.3rem", margin: "4px 0 2px 0", color: "#f0f6fc" }}>
                {selectedParty.primaryGuestName}
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.8rem", color: "#8b949e" }}>
                Table: <strong>{selectedParty.tableAssignment}</strong> ({selectedParty.seatAssignment}) · Reserved: {selectedParty.reservedPlaces} places
              </p>

              {/* Physical Keepsake Visual Mock */}
              <div
                style={{
                  backgroundColor: "#1f1812",
                  border: "1px solid #c8a870",
                  borderRadius: "8px",
                  padding: "18px",
                  marginBottom: "16px",
                  position: "relative",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.7rem", color: "#c8a870", fontWeight: 700, letterSpacing: "0.1em" }}>
                    MOMENTUS · KEEPSAKE CREDENTIAL
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#c8a870" }}>
                    📡 NTAG213
                  </span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f5f0e8", fontFamily: "serif" }}>
                  {selectedParty.primaryGuestName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#d5c3aa", marginTop: "2px" }}>
                  {event.name} · {selectedParty.tableAssignment}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "16px" }}>
                  <code style={{ fontSize: "0.75rem", color: "#c8a870" }}>
                    {currentCardId ? `UID: ${currentCardId}` : "STATUS: UNPROGRAMMED"}
                  </code>
                  <span style={{ fontSize: "0.65rem", color: "#8b949e" }}>
                    Household Pass
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <button
                onClick={handleSimulateEncode}
                type="button"
                disabled={encodingState === "listening"}
                style={{
                  width: "100%",
                  backgroundColor: encodingState === "listening" ? "#484f58" : "#238636",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "12px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: encodingState === "listening" ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {encodingState === "listening" ? (
                  "📡 Listening for NFC Tap…"
                ) : currentCardId ? (
                  `🔄 Re-Encode / Replace Card (${currentCardId})`
                ) : (
                  "💳 Tap to Program NFC Card"
                )}
              </button>
              <span style={{ fontSize: "0.75rem", color: "#8b949e", display: "block", textAlign: "center", marginTop: "6px" }}>
                Compatible with Web NFC Android Chrome, macOS WebUSB, and Desktop Encoder
              </span>
            </div>
          </div>
        )}
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
          ← Back to Guest List
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
          Next: Turnstile Command Center (Stage 05) →
        </button>
      </div>
    </div>
  );
}

