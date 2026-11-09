"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { isMomentusInvitationUrl } from "../url";

export type StationRole =
  | "gate"
  | "vip_seating"
  | "catering_meal"
  | "sommelier_bar";

export interface StationDefinition {
  id: StationRole;
  code: string;
  name: string;
  location: string;
  description: string;
  badge: string;
  color: string;
}

export const STATIONS: StationDefinition[] = [
  {
    id: "gate",
    code: "GATE-01",
    name: "Main Turnstile Gate",
    location: "Courtyard Entry Portico",
    description: "Primary attendee credential verification & admission check-in.",
    badge: "ADMISSION",
    color: "#22c55e",
  },
  {
    id: "vip_seating",
    code: "VIP-SEAT",
    name: "VIP Courtyard & Concierge",
    location: "Grand Ballroom Foyer",
    description: "Table seating assignments and escort concierge verification.",
    badge: "SEATING",
    color: "#eab308",
  },
  {
    id: "catering_meal",
    code: "CATER-02",
    name: "Banquet Catering Station",
    location: "Dining Terrace Pavilion",
    description: "Dietary-verified course claims & meal voucher validation.",
    badge: "MEALS",
    color: "#3b82f6",
  },
  {
    id: "sommelier_bar",
    code: "BAR-03",
    name: "Artisan Sommelier Bar",
    location: "Wine & Spirits Gazebo",
    description: "Restricted 21+ wine tasting & beverage pass deduction.",
    badge: "BEVERAGE",
    color: "#a855f7",
  },
];

export interface ScannedAttendee {
  id: string;
  name: string;
  isPrimary: boolean;
  table: string;
  seat: string;
  dietary: string;
  status: "pending" | "checked_in" | "claimed";
}

export interface ScanResult {
  invitationId: string;
  primaryGuest: string;
  client: string;
  event: string;
  attendees: ScannedAttendee[];
  nfcCardId: string;
  station: StationRole;
  timestamp: string;
  scannedCount: number;
}

interface LogEntry {
  id: string;
  time: string;
  guest: string;
  action: string;
  status: "admitted" | "duplicate" | "error";
  stationCode: string;
  details: string;
}

// -----------------------------------------------------------------------------
// Web Audio Synthesizer (Instant, Asset-Free Acoustic Feedback)
// -----------------------------------------------------------------------------
class SynthesizerAudioFeedback {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic two-tone ascending chime (D5: 587.33Hz -> A5: 880Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Frequency schedule
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);
    osc2.frequency.setValueAtTime(880.0, now + 0.12);

    // Smooth envelope gain
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.12);
    osc1.stop(now + 0.18);
    osc2.stop(now + 0.38);
  }

  playWarningBuzzer(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harsh double-pulse sawtooth buzzer (180Hz)
    const playPulse = (start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(185.0, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.01);
      gain.gain.linearRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playPulse(now, 0.11);
    playPulse(now + 0.16, 0.14);
  }

  playErrorTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low square-wave thud (120Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120.0, now);
    osc.frequency.exponentialRampToValueAtTime(60.0, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }
}

const audioFeedback = new SynthesizerAudioFeedback();

// -----------------------------------------------------------------------------
// Sample Guest Database for Deterministic Standalone / Offline Station PWA
// -----------------------------------------------------------------------------
const SAMPLE_INVITATIONS: Record<
  string,
  {
    primaryGuest: string;
    client: string;
    event: string;
    attendees: ScannedAttendee[];
  }
> = {
  "MOM-AMARA-01": {
    primaryGuest: "Amara Santos",
    client: "Amara & Luca",
    event: "Wedding celebration",
    attendees: [
      {
        id: "att-01",
        name: "Amara Santos",
        isPrimary: true,
        table: "Table 01 - Presidential",
        seat: "Seat 1A",
        dietary: "Pescatarian · Nut Allergy",
        status: "pending",
      },
      {
        id: "att-02",
        name: "Elena Santos (Mother of the Bride)",
        isPrimary: false,
        table: "Table 01 - Presidential",
        seat: "Seat 1B",
        dietary: "Standard Banquet",
        status: "pending",
      },
      {
        id: "att-03",
        name: "Rafael Santos (Father of the Bride)",
        isPrimary: false,
        table: "Table 01 - Presidential",
        seat: "Seat 1C",
        dietary: "Standard Banquet",
        status: "pending",
      },
    ],
  },
  "MOM-LUCA-02": {
    primaryGuest: "Luca Reyes",
    client: "Amara & Luca",
    event: "Wedding celebration",
    attendees: [
      {
        id: "att-04",
        name: "Luca Reyes",
        isPrimary: true,
        table: "Table 01 - Presidential",
        seat: "Seat 1D",
        dietary: "Gluten-Free Chef Choice",
        status: "pending",
      },
      {
        id: "att-05",
        name: "Mateo Reyes (Best Man)",
        isPrimary: false,
        table: "Table 02 - Entourage",
        seat: "Seat 2A",
        dietary: "Standard Banquet",
        status: "pending",
      },
    ],
  },
  "MOM-MIKAELA-03": {
    primaryGuest: "Mikaela Cruz",
    client: "Mikaela Cruz",
    event: "18th birthday",
    attendees: [
      {
        id: "att-06",
        name: "Mikaela Cruz",
        isPrimary: true,
        table: "Head Table - Fairytale",
        seat: "Debutante Throne",
        dietary: "Halal / No Shellfish",
        status: "pending",
      },
      {
        id: "att-07",
        name: "Samantha Tan (Cotillion Maid of Honor)",
        isPrimary: false,
        table: "Table 04 - 18 Roses",
        seat: "Seat 4C",
        dietary: "Vegetarian",
        status: "pending",
      },
    ],
  },
};

export function StaffStationScanner() {
  const [station, setStation] = useState<StationDefinition>(STATIONS[0]);
  const [isStationLocked, setIsStationLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [activeScan, setActiveScan] = useState<ScanResult | null>(null);
  const [scannedHistory, setScannedHistory] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log-seed-1",
      time: "18:42",
      guest: "Sofia Lorenzana",
      action: "Admitted (Primary + 1 Companion)",
      status: "admitted",
      stationCode: "GATE-01",
      details: "Turnstile cleared with Titanium NFC Card #NFC-8821",
    },
    {
      id: "log-seed-2",
      time: "18:46",
      guest: "Carlos Alcaraz",
      action: "VIP Table Assigned",
      status: "admitted",
      stationCode: "VIP-SEAT",
      details: "Escorted to Table 02 - Entourage",
    },
  ]);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [scanState, setScanState] = useState<
    "idle" | "listening" | "validating" | "success" | "duplicate" | "error"
  >("idle");
  const [bannerNotice, setBannerNotice] = useState<string>("");

  const totalCapacity = 180;
  const checkedInCount = 42 + logs.filter((l) => l.status === "admitted").length;
  const remainingArrivals = Math.max(0, totalCapacity - checkedInCount);
  const duplicateAlerts = logs.filter((l) => l.status === "duplicate").length;

  const handleAudio = useCallback(
    (type: "success" | "warning" | "error") => {
      if (!audioEnabled) return;
      if (type === "success") audioFeedback.playSuccessChime();
      else if (type === "warning") audioFeedback.playWarningBuzzer();
      else audioFeedback.playErrorTone();
    },
    [audioEnabled],
  );

  const handleHaptic = useCallback(
    (pattern: number | number[]) => {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // ignore unsupported haptics
        }
      }
    },
    [],
  );

  // Process NFC / Token scan
  const processScanCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return;

      setScanState("validating");
      setBannerNotice("Validating token against server atomic registry…");

      // Check online duplicate protection
      if (scannedHistory.includes(`${station.id}:${code}`)) {
        setScanState("duplicate");
        handleAudio("warning");
        handleHaptic([120, 80, 120]);
        setBannerNotice(`DUPLICATE DETECTED: This pass was already validated at ${station.name}!`);

        const duplicateLog: LogEntry = {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          guest: "Duplicate Card Scanned",
          action: "REJECTED - Atomic Duplicate",
          status: "duplicate",
          stationCode: station.code,
          details: `Card token ${code} already stamped at ${station.name}. Physical turnstile kept locked.`,
        };
        setLogs((prev) => [duplicateLog, ...prev.slice(0, 19)]);
        return;
      }

      // Lookup invitation
      const mockRecord = SAMPLE_INVITATIONS[code] || {
        primaryGuest: `Guest (${code})`,
        client: "Bespoke Client",
        event: "Private Gathering",
        attendees: [
          {
            id: `att-${code}-1`,
            name: `Primary Attendee (${code})`,
            isPrimary: true,
            table: "Table 03 - Garden",
            seat: "Seat 3B",
            dietary: "Chef Standard",
            status: "pending" as const,
          },
        ],
      };

      const result: ScanResult = {
        invitationId: code,
        primaryGuest: mockRecord.primaryGuest,
        client: mockRecord.client,
        event: mockRecord.event,
        attendees: mockRecord.attendees.map((a) => ({ ...a })),
        nfcCardId: `NFC-${Math.floor(1000 + Math.random() * 9000)}`,
        station: station.id,
        timestamp: new Date().toLocaleTimeString(),
        scannedCount: mockRecord.attendees.length,
      };

      setActiveScan(result);
      setScanState("idle");
      setBannerNotice(`Card recognized for ${mockRecord.primaryGuest}. Tap confirm to record admission.`);
    },
    [station, scannedHistory, handleAudio, handleHaptic],
  );

  // Confirm check-in mutation at the station
  const confirmStationCheckIn = (attendeeIdsToCheckIn: string[]) => {
    if (!activeScan) return;

    // Mutate state atomically
    setScannedHistory((prev) => [...prev, `${station.id}:${activeScan.invitationId}`]);
    setScanState("success");
    handleAudio("success");
    handleHaptic(90);

    const names = activeScan.attendees
      .filter((a) => attendeeIdsToCheckIn.includes(a.id))
      .map((a) => a.name)
      .join(", ");

    setBannerNotice(
      `✓ Confirmed! Checked in ${attendeeIdsToCheckIn.length} attendee(s) at ${station.name}.`,
    );

    const log: LogEntry = {
      id: crypto.randomUUID(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      guest: activeScan.primaryGuest,
      action: `${station.badge}: ${names}`,
      status: "admitted",
      stationCode: station.code,
      details: `${activeScan.nfcCardId} · Table: ${activeScan.attendees[0]?.table || "General"}`,
    };

    setLogs((prev) => [log, ...prev.slice(0, 19)]);
    setActiveScan(null);
    setManualCode("");

    setTimeout(() => {
      setScanState("idle");
      setBannerNotice("");
    }, 4500);
  };

  // Station PIN lock protection
  const unlockStation = () => {
    if (pinInput === "1234" || pinInput === "0000") {
      setIsStationLocked(false);
      setPinInput("");
      setPinError("");
      handleAudio("success");
    } else {
      setPinError("Invalid Station PIN. Default demo PIN is 1234.");
      handleAudio("error");
      handleHaptic([100, 50, 100]);
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
      {/* Top Station Bar */}
      <header
        style={{
          backgroundColor: "#161b22",
          borderBottom: "1px solid #30363d",
          padding: "14px 20px",
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
            ← Back
          </Link>
          <div
            style={{
              height: "16px",
              width: "1px",
              backgroundColor: "#30363d",
            }}
          />
          <span
            style={{
              letterSpacing: "0.08em",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#c8a870",
            }}
          >
            MOMENTUS · STAFF SCANNER PWA
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            type="button"
            style={{
              backgroundColor: audioEnabled ? "#238636" : "#21262d",
              color: "#f0f6fc",
              border: "1px solid #30363d",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Toggle Web Audio Synthesizer Chimes"
          >
            {audioEnabled ? "🔊 Sound ON" : "🔇 Sound Muted"}
          </button>
          <button
            onClick={() => setIsStationLocked(true)}
            type="button"
            style={{
              backgroundColor: "#21262d",
              color: "#8b949e",
              border: "1px solid #30363d",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            🔒 Lock Station
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "20px" }}>
        {/* Station Security Modal (if locked) */}
        {isStationLocked && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "12px",
                padding: "28px",
                maxWidth: "400px",
                width: "100%",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔒</div>
              <h2 style={{ fontSize: "1.25rem", color: "#f0f6fc", marginBottom: "6px" }}>
                Station Security Guard
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#8b949e", marginBottom: "16px" }}>
                Enter your 4-digit Station Supervisor PIN to change station or perform check-ins. (Demo PIN: <strong>1234</strong>)
              </p>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN (1234)"
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "1.2rem",
                  letterSpacing: "0.2em",
                  textAlign: "center",
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  color: "#f0f6fc",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              />
              {pinError && (
                <p style={{ color: "#f85149", fontSize: "0.8rem", marginBottom: "12px" }}>
                  {pinError}
                </p>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={unlockStation}
                  type="button"
                  style={{
                    flex: 1,
                    backgroundColor: "#238636",
                    color: "#fff",
                    fontWeight: 600,
                    padding: "10px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Unlock Station
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Station Selector Bar */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  backgroundColor: station.color,
                  color: "#0d1117",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                }}
              >
                {station.badge}
              </span>
              <h1 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>
                {station.name}
              </h1>
              <span style={{ color: "#8b949e", fontSize: "0.85rem" }}>
                [{station.code}]
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#8b949e", margin: "4px 0 0 0" }}>
              Location: <strong>{station.location}</strong> · {station.description}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {STATIONS.map((s) => (
              <button
                key={s.id}
                data-testid={`station-tab-${s.id}`}
                onClick={() => setStation(s)}
                type="button"
                style={{
                  backgroundColor: station.id === s.id ? "#21262d" : "transparent",
                  color: station.id === s.id ? "#f0f6fc" : "#8b949e",
                  border: station.id === s.id ? `1px solid ${s.color}` : "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {s.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Live Station Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <span style={{ color: "#8b949e", fontSize: "0.75rem", textTransform: "uppercase" }}>
              Admitted Today
            </span>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#22c55e", marginTop: "4px" }}>
              {checkedInCount}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              {Math.round((checkedInCount / totalCapacity) * 100)}% of hall capacity
            </span>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <span style={{ color: "#8b949e", fontSize: "0.75rem", textTransform: "uppercase" }}>
              Remaining Expected
            </span>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#38bdf8", marginTop: "4px" }}>
              {remainingArrivals}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Awaiting arrival
            </span>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <span style={{ color: "#8b949e", fontSize: "0.75rem", textTransform: "uppercase" }}>
              Duplicate Interceptions
            </span>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: duplicateAlerts > 0 ? "#f85149" : "#8b949e", marginTop: "4px" }}>
              {duplicateAlerts}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Online atomic shield active
            </span>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <span style={{ color: "#8b949e", fontSize: "0.75rem", textTransform: "uppercase" }}>
              Acoustic Synthesizer
            </span>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#c8a870", marginTop: "4px" }}>
              {audioEnabled ? "D5 ➔ A5" : "MUTED"}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Pure Web Audio oscillator
            </span>
          </div>
        </div>

        {/* Status Notification Banner */}
        {bannerNotice && (
          <div
            data-testid="station-banner"
            style={{
              backgroundColor:
                scanState === "duplicate"
                  ? "rgba(248, 81, 73, 0.15)"
                  : scanState === "success"
                  ? "rgba(34, 197, 94, 0.15)"
                  : "#161b22",
              border:
                scanState === "duplicate"
                  ? "1px solid #f85149"
                  : scanState === "success"
                  ? "1px solid #22c55e"
                  : "1px solid #30363d",
              borderRadius: "8px",
              padding: "12px 18px",
              marginBottom: "20px",
              fontSize: "0.9rem",
              fontWeight: 600,
              color:
                scanState === "duplicate"
                  ? "#f85149"
                  : scanState === "success"
                  ? "#22c55e"
                  : "#f0f6fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{bannerNotice}</span>
            <button
              onClick={() => setBannerNotice("")}
              type="button"
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Scan & Inspection Station Box */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "10px",
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
              Physical NFC & Rapid QR Inspection
            </h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleAudio("success")}
                type="button"
                style={{
                  backgroundColor: "#21262d",
                  color: "#22c55e",
                  border: "1px solid #30363d",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                title="Test Chime (D5 to A5)"
              >
                🎵 Test Chime
              </button>
              <button
                onClick={() => handleAudio("warning")}
                type="button"
                style={{
                  backgroundColor: "#21262d",
                  color: "#eab308",
                  border: "1px solid #30363d",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                title="Test Buzzer (Sawtooth 180Hz)"
              >
                ⚡ Test Buzzer
              </button>
            </div>
          </div>

          {/* Quick Tap Synthetic NFC Card Triggers */}
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "0.8rem", color: "#8b949e", display: "block", marginBottom: "8px" }}>
              Simulate NFC Card Tap (Desktop / Fast Test):
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <button
                onClick={() => processScanCode("MOM-AMARA-01")}
                type="button"
                data-testid="test-card-amara"
                style={{
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  color: "#f0f6fc",
                  borderRadius: "6px",
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                💳 <strong>Tap Card: Amara Santos</strong> (3 Guests)
              </button>
              <button
                onClick={() => processScanCode("MOM-LUCA-02")}
                type="button"
                style={{
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  color: "#f0f6fc",
                  borderRadius: "6px",
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                💳 <strong>Tap Card: Luca Reyes</strong> (2 Guests)
              </button>
              <button
                onClick={() => processScanCode("MOM-MIKAELA-03")}
                type="button"
                style={{
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  color: "#f0f6fc",
                  borderRadius: "6px",
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                💳 <strong>Tap Card: Mikaela Cruz</strong> (Debutante)
              </button>
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processScanCode(manualCode);
            }}
            style={{ display: "flex", gap: "10px" }}
          >
            <input
              type="text"
              placeholder="Or enter NFC card ID, invitation token, or QR payload…"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              data-testid="scanner-manual-input"
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
              data-testid="scanner-submit-btn"
              style={{
                backgroundColor: "#238636",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Verify Pass
            </button>
          </form>
        </div>

        {/* Active Inspection / Confirmation Card */}
        {activeScan && (
          <div
            data-testid="active-scan-card"
            style={{
              backgroundColor: "#1c2128",
              border: "1px solid #c8a870",
              borderRadius: "10px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span
                  style={{
                    backgroundColor: "#c8a870",
                    color: "#0d1117",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.05em",
                  }}
                >
                  CREDENTIAL IDENTIFIED
                </span>
                <h3 style={{ fontSize: "1.4rem", margin: "8px 0 2px 0", color: "#f0f6fc" }}>
                  {activeScan.primaryGuest}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#8b949e", margin: 0 }}>
                  Event: {activeScan.event} · Card: <code>{activeScan.nfcCardId}</code>
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "#8b949e" }}>Station Action</span>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: station.color }}>
                  {station.badge}
                </div>
              </div>
            </div>

            {/* Invariant Rule Reminder */}
            <div
              style={{
                backgroundColor: "rgba(200, 168, 112, 0.08)",
                border: "1px solid rgba(200, 168, 112, 0.25)",
                borderRadius: "6px",
                padding: "10px 14px",
                fontSize: "0.8rem",
                color: "#e8ded1",
                marginBottom: "16px",
              }}
            >
              💡 <strong>System Invariant:</strong> Attendance and vouchers belong to individual people, not the card. Confirm who is present:
            </div>

            {/* Individual Attendees Roster */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {activeScan.attendees.map((att) => (
                <div
                  key={att.id}
                  style={{
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: "6px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{att.name}</span>
                      {att.isPrimary && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            backgroundColor: "#21262d",
                            color: "#8b949e",
                            border: "1px solid #30363d",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#8b949e", marginTop: "2px" }}>
                      Seating: <strong>{att.table}</strong> ({att.seat}) · Dietary: {att.dietary}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#22c55e",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: 600,
                    }}
                  >
                    READY FOR {station.badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Confirmation Buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setActiveScan(null)}
                type="button"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #30363d",
                  color: "#8b949e",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmStationCheckIn(activeScan.attendees.map((a) => a.id))
                }
                type="button"
                data-testid="confirm-checkin-btn"
                style={{
                  backgroundColor: "#238636",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ✓ Confirm Station Admission ({activeScan.attendees.length})
              </button>
            </div>
          </div>
        )}

        {/* Live Station Scan Audit Log */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "1rem", margin: 0, fontWeight: 600 }}>
              Live Station Activity Stream
            </h2>
            <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Auto-refreshed in real time
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  backgroundColor: "#0d1117",
                  border:
                    log.status === "duplicate"
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
                    <span style={{ color: "#8b949e", fontSize: "0.75rem" }}>{log.time}</span>
                    <strong style={{ color: "#f0f6fc" }}>{log.guest}</strong>
                    <span
                      style={{
                        backgroundColor: "#21262d",
                        fontSize: "0.7rem",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        color: "#c8a870",
                      }}
                    >
                      {log.stationCode}
                    </span>
                  </div>
                  <div style={{ color: "#8b949e", fontSize: "0.75rem", marginTop: "2px" }}>
                    {log.details}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color:
                      log.status === "duplicate"
                        ? "#f85149"
                        : log.status === "admitted"
                        ? "#22c55e"
                        : "#8b949e",
                  }}
                >
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
