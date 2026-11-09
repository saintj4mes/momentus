"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface HeroEventCard {
  id: string;
  category: string;
  badge: string;
  title: string;
  meta: string;
  imageSrc: string;
  imageAlt: string;
  stamp: string;
  rotation: string;
}

const heroEventCards: HeroEventCard[] = [
  {
    id: "corporate",
    category: "Corporate Summit",
    badge: "GLOBAL SUMMIT '26",
    title: "Executive Keynote & Seated Banquet",
    meta: "450 Delegates · NFC Fast Pass · Scoped Access",
    imageSrc: "/images/events/summit-real.jpg",
    imageAlt: "Corporate summit and keynote conference credential artwork",
    stamp: "STAGE I · PLENARY",
    rotation: "-rotate-1",
  },
  {
    id: "concert",
    category: "Music Festival",
    badge: "SOLSTICE GROUNDS",
    title: "Amphitheater Live Acoustic Tour",
    meta: "2,500 Attendees · Wave QR Gate · Zero Duplicate",
    imageSrc: "/images/events/festival-real.jpg",
    imageAlt: "Live concert festival grounds and acoustic stage pass artwork",
    stamp: "GATE 02 · ALL-ACCESS",
    rotation: "rotate-2",
  },
  {
    id: "sporting",
    category: "Endurance & Fun Run",
    badge: "COASTAL 21K",
    title: "Half-Marathon & Community Run",
    meta: "Bib #0421 · Chip Timed · Hydration Checkpoint",
    imageSrc: "/images/events/marathon-real.jpg",
    imageAlt: "Sporting marathon bib number and elevation course route artwork",
    stamp: "WAVE A · VERIFIED",
    rotation: "-rotate-2",
  },
  {
    id: "birthday",
    category: "Milestone & Debut",
    badge: "GRAND COMMEMORATIVE",
    title: "Ballroom Jubilee & Debutante Roster",
    meta: "Custom Companion Allowances · 18 Roses Ceremony",
    imageSrc: "/images/events/debut-real.jpg",
    imageAlt: "Milestone birthday celebration and commemorative debut medallion artwork",
    stamp: "ROSTER #018",
    rotation: "rotate-1",
  },
  {
    id: "celebration",
    category: "Weddings & Galas",
    badge: "INTRAMUROS COURTYARD",
    title: "Courtyard Vows & Seated Dining",
    meta: "Table Seating Chart · Dietary Preferences · NFC Keepsake",
    imageSrc: "/images/events/wedding-real.jpg",
    imageAlt: "Courtyard wedding celebration and seated banquet architecture artwork",
    stamp: "TABLE 07 · BANQUET",
    rotation: "rotate-0",
  },
];

export function HeroSection() {
  const [activeEventId, setActiveEventId] = useState("corporate");

  const currentCard =
    heroEventCards.find((c) => c.id === activeEventId) ?? heroEventCards[0];

  return (
    <section className="hero-editorial" aria-labelledby="hero-main-title">
      <div className="hero-editorial-container">
        {/* Left Column: Editorial Headline & Value Storytelling */}
        <div className="hero-editorial-copy" data-reveal>
          <div className="vintage-eyebrow">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">THE EVENT EXPERIENCE PLATFORM</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>

          <h1 id="hero-main-title" className="hero-headline">
            Every Event.
            <br />
            <span className="serif-italic-accent">Every Experience.</span>
            <br />
            Every Memory.
          </h1>

          <p className="hero-lead-text">
            From intimate celebrations to extraordinary gatherings. MOMENTUS brings
            invitations, registration, event-day experiences, and lasting memories
            together in one beautifully organized platform.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="hero-cta-group">
            <Link href="/sign-up" className="hero-primary-cta">
              <span>Create Your Event</span>
              <span className="cta-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>

            <a href="#events" className="hero-secondary-cta">
              <span>Explore Experiences</span>
              <span className="cta-arrow-down" aria-hidden="true">
                ↓
              </span>
            </a>
          </div>

          {/* Occasion Switcher Selector Strip */}
          <div className="hero-occasion-selector">
            <span className="selector-label">SPOTLIGHT AN OCCASION:</span>
            <div className="occasion-pills" role="tablist" aria-label="Featured Occasion Selector">
              {heroEventCards.map((card) => {
                const isActive = card.id === activeEventId;
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="hero-active-card"
                    className={`occasion-pill-btn ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveEventId(card.id)}
                  >
                    {card.category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hero-trust-strip">
            <div className="trust-item">
              <span className="trust-bullet" aria-hidden="true">
                ✦
              </span>
              <span>Web NFC & Rapid QR Gate Scanning</span>
            </div>
            <div className="trust-item">
              <span className="trust-bullet" aria-hidden="true">
                ✦
              </span>
              <span>Online Atomic Duplicate Protection</span>
            </div>
            <div className="trust-item">
              <span className="trust-bullet" aria-hidden="true">
                ✦
              </span>
              <span>GrapesJS Visual Designer Canvas</span>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Event Layered Editorial Composition */}
        <div className="hero-editorial-visuals" data-reveal id="hero-active-card">
          {/* Subtle Background Geometries & Warm Orbit Lines */}
          <div className="visual-orbit-outer" aria-hidden="true" />
          <div className="visual-orbit-inner" aria-hidden="true" />

          {/* Primary Featured Event Frame */}
          <div className="featured-hero-frame">
            <div className="frame-vintage-mat">
              {/* Top Header of Card */}
              <div className="frame-card-top">
                <span className="frame-badge-pill">{currentCard.badge}</span>
                <span className="frame-event-counter">0{heroEventCards.findIndex(c => c.id === currentCard.id) + 1} — 05</span>
                <span className="frame-stamp-chip">{currentCard.stamp}</span>
              </div>

              {/* Main Artwork Window */}
              <div className="frame-artwork-window">
                <Image
                  src={currentCard.imageSrc}
                  alt={currentCard.imageAlt}
                  width={560}
                  height={380}
                  priority
                  loading="eager"
                  className="frame-image"
                />
                <div className="frame-vignette-overlay" aria-hidden="true" />
                <div className="frame-live-indicator">
                  <span className="pulse-indicator" />
                  <span>Live Event Mode</span>
                </div>
              </div>

              {/* Card Bottom Meta */}
              <div className="frame-card-bottom">
                <div className="frame-text-block">
                  <span className="frame-category-kicker">{currentCard.category}</span>
                  <h3 className="frame-title">{currentCard.title}</h3>
                  <p className="frame-meta-line">{currentCard.meta}</p>
                </div>
                <div className="frame-seal-mark" aria-hidden="true">
                  <span>m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layered Satellite Cards (Showing the other event categories) */}
          <div className="satellite-cards-layer" aria-hidden="true">
            {heroEventCards
              .filter((c) => c.id !== activeEventId)
              .slice(0, 2)
              .map((satCard, idx) => (
                <div
                  key={satCard.id}
                  className={`satellite-mini-card sat-pos-${idx + 1}`}
                  onClick={() => setActiveEventId(satCard.id)}
                >
                  <div className="satellite-thumb">
                    <Image
                      src={satCard.imageSrc}
                      alt=""
                      width={120}
                      height={80}
                      className="satellite-img"
                    />
                  </div>
                  <div className="satellite-info">
                    <span className="sat-badge">{satCard.badge}</span>
                    <span className="sat-title">{satCard.category}</span>
                  </div>
                </div>
              ))}
          </div>

          {/* Floating Vintage Platform Monogram Badge */}
          <div className="floating-vintage-token">
            <div className="token-inner">
              <span className="token-symbol">m</span>
              <div className="token-text">
                <strong>MOMENTUS PLATFORM</strong>
                <small>One Card · Every Experience</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
