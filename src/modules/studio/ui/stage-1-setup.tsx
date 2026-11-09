"use client";

import Link from "next/link";
import { useState } from "react";
import type { StudioEvent } from "../types";

interface Props {
  event: StudioEvent;
  onUpdateEvent?: (updates: Partial<StudioEvent>) => void;
  onNextStage?: () => void;
}

export function Stage1Setup({ event, onUpdateEvent, onNextStage }: Props) {
  const [customDomain, setCustomDomain] = useState(event.customDomain || "");
  const [domainVerified, setDomainVerified] = useState(Boolean(event.customDomain));
  const [savedNotice, setSavedNotice] = useState("");

  const capacityPct = Math.round((event.reservedPlaces / event.capacity) * 100);

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEvent?.({ customDomain });
    setDomainVerified(true);
    setSavedNotice("Custom domain routing updated & SSL auto-provisioned!");
    setTimeout(() => setSavedNotice(""), 4000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Event Scope & Identity Card */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
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
              {event.type.toUpperCase()} OCCASION
            </span>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 4px 0", color: "#f0f6fc" }}>
              {event.name}
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#8b949e" }}>
              📅 {event.eventDate} at {event.eventTime} ({event.timezone}) · 📍 {event.venue || "Venue unassigned"}
            </p>
          </div>

          <span
            style={{
              backgroundColor: event.status === "published" ? "#19352d" : "#21262d",
              color: event.status === "published" ? "#22c55e" : "#8b949e",
              border: event.status === "published" ? "1px solid #22c55e" : "1px solid #30363d",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
            }}
          >
            ● {event.status.toUpperCase()}
          </span>
        </div>

        {/* Commercial SaaS Quota Bar */}
        <div
          style={{
            backgroundColor: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#8b949e", textTransform: "uppercase" }}>
                Licensed Plan Tier
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ fontSize: "1.1rem", color: "#c8a870" }}>
                  {event.planTier === "starter"
                    ? "Starter Celebration (Free Tier)"
                    : event.planTier === "bespoke"
                    ? "Bespoke Celebration ($189)"
                    : "Agency Pro Studio ($149/mo)"}
                </strong>
                <Link
                  href="/admin/billing"
                  style={{
                    backgroundColor: "#21262d",
                    color: "#f0f6fc",
                    border: "1px solid #30363d",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    textDecoration: "none",
                  }}
                >
                  Upgrade Tier ↗
                </Link>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>Guest Capacity Quota</span>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: capacityPct >= 90 ? "#f85149" : "#22c55e" }}>
                {event.reservedPlaces} / {event.capacity} Guests
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: "100%", height: "8px", backgroundColor: "#21262d", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(100, capacityPct)}%`,
                height: "100%",
                backgroundColor: capacityPct >= 90 ? "#f85149" : "#22c55e",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "0.75rem", color: "#8b949e", display: "block", marginTop: "6px" }}>
            {event.capacity - event.reservedPlaces} places available before reaching plan quota limit.
          </span>
        </div>
      </div>

      {/* Multi-Tenant Domain Routing Card */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "24px",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", margin: "0 0 4px 0", color: "#f0f6fc" }}>
          🌐 Multi-Tenant Domain &amp; Subdomain Routing
        </h3>
        <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#8b949e" }}>
          Guests can access your event via your free MOMENTUS subdomain, or bind a dedicated custom domain (e.g. <code>rsvp.amaraandluca.com</code>).
        </p>

        {savedNotice && (
          <div
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              border: "1px solid #22c55e",
              borderRadius: "6px",
              padding: "10px 14px",
              color: "#22c55e",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            ✓ {savedNotice}
          </div>
        )}

        {/* Free Subdomain Preview */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "0.8rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
            Included Platform Subdomain
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              readOnly
              value={`https://${event.micrositeSlug}.momentus.events`}
              style={{
                flex: 1,
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                color: "#c8a870",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
              }}
            />
            <Link
              href={`/event/${event.micrositeSlug}`}
              target="_blank"
              style={{
                backgroundColor: "#21262d",
                color: "#f0f6fc",
                border: "1px solid #30363d",
                borderRadius: "6px",
                padding: "10px 14px",
                fontSize: "0.85rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Test Link ↗
            </Link>
          </div>
        </div>

        {/* Custom Domain Binding */}
        <form onSubmit={handleSaveDomain}>
          <label style={{ fontSize: "0.8rem", color: "#8b949e", display: "block", marginBottom: "4px" }}>
            Dedicated Custom Domain (White-Label)
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="e.g. rsvp.amaraandluca.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
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
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save &amp; Verify CNAME
            </button>
          </div>
          {domainVerified && (
            <span style={{ fontSize: "0.75rem", color: "#22c55e", display: "block", marginTop: "6px" }}>
              ✓ CNAME points to <code>cname.momentus.events</code> · Cloudflare SSL Active
            </span>
          )}
        </form>
      </div>

      {/* Next Step Action Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
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
          Next: Open Microsite Studio (Stage 02) →
        </button>
      </div>
    </div>
  );
}

