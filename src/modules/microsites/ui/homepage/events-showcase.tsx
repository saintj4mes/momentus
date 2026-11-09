"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ClientShowcaseItem {
  id: string;
  number: string;
  category: string;
  clientName: string;
  eventType: string;
  venueAndDate: string;
  micrositeUrl: string;
  metricsBadge: string;
  clientQuote: string;
  clientAuthor: string;
  keepsakeDetail: string;
  summary: string;
  highlights: string[];
  imageSrc: string;
  imageAlt: string;
  tag: string;
  href: string;
  ctaText: string;
  isLiveDemo?: boolean;
  spanClass?: string;
  filterCategory: string;
}

const showcases: ClientShowcaseItem[] = [
  {
    id: "amara-luca",
    number: "01",
    category: "UNIONS & PRIVATE GATHERINGS",
    clientName: "Amara Santos & Luca Reyes",
    eventType: "Weddings & Celebrations",
    venueAndDate: "Casa Manila Courtyard, Intramuros · Nov 2026",
    micrositeUrl: "momentus.events/amara-luca",
    metricsBadge: "185 Confirmed RSVPs · 100% Turnout",
    clientQuote:
      "Our 185 guests arrived at the candlelit Intramuros courtyard and tapped their engraved wooden cards. Their table seating and dietary notes appeared instantly on the door staff's tablet. It felt like absolute magic.",
    clientAuthor: "Amara & Luca · Hosts",
    keepsakeDetail: "Mahogany-engraved NFC keepsake card permanently linked to their private photo retrospective.",
    summary:
      "A candlelit courtyard wedding in historic Intramuros. The couple used MOMENTUS to craft a romantic bilingual guest microsite, manage multi-table banquet seating, and welcome guests with hand-finished NFC invitation cards.",
    highlights: [
      "Bespoke botanical landing page with bilingual RSVP flow",
      "Courtyard banquet seating & per-guest dietary logs",
      "Wood-engraved NFC invitation cards bound to households",
    ],
    imageSrc: "/images/events/wedding-real.jpg",
    imageAlt: "Amara & Luca wedding microsite and candlelit courtyard banquet preview",
    tag: "LIVE MICROSITE",
    href: "/demo/microsites/amara-luca",
    ctaText: "View Client Microsite",
    isLiveDemo: true,
    spanClass: "grid-card-wide",
    filterCategory: "weddings",
  },
  {
    id: "mikaela-debut",
    number: "02",
    category: "TRADITIONS & JUBILEES",
    clientName: "Mikaela Cruz — XVIII The Grand Debut",
    eventType: "Birthdays & Milestones",
    venueAndDate: "The Glass Garden, Pasig · Oct 2026",
    micrositeUrl: "momentus.events/mikaela-debut",
    metricsBadge: "320 Guests · 18 Roses & Candles Program",
    clientQuote:
      "For my 18th debut, the rose-gold countdown microsite and commemorative tap medallions made every guest feel like royalty. The 18 Roses ceremony roster was coordinated seamlessly without a single hitch.",
    clientAuthor: "Mikaela Cruz · Debutante",
    keepsakeDetail: "Rose-gold tap-to-enter entry medallion with personalized companion allowances.",
    summary:
      "An illuminated fairytale eighteenth debut. Mikaela's family published an interactive program microsite, coordinated ceremonial rosters, and greeted guests with commemorative tap-to-enter debut medallions.",
    highlights: [
      "Rose-gold illuminated countdown & RSVP questionnaire",
      "18 Roses, Candles & Treasures ceremonial stage roster",
      "Commemorative tap-to-enter entry medallions",
    ],
    imageSrc: "/images/events/debut-real.jpg",
    imageAlt: "Mikaela Cruz 18th Debut microsite and grand chandelier celebration preview",
    tag: "LIVE MICROSITE",
    href: "/demo/microsites/mikaela-debut",
    ctaText: "View Client Microsite",
    isLiveDemo: true,
    filterCategory: "milestones",
  },
  {
    id: "solstice-fest",
    number: "03",
    category: "LIVE STAGE & FESTIVALS",
    clientName: "Solstice Sunset Music Festival",
    eventType: "Concerts & Festivals",
    venueAndDate: "Circuit Makati Event Grounds · Sept 2026",
    micrositeUrl: "momentus.events/solstice-live",
    metricsBadge: "2,800 Wristbands · 0.4s Tap Speed",
    clientQuote:
      "We processed 2,800 attendees across 12 gates with 0.4s tap speed on standard Android phones. Zero queues, and duplicate pass sharing was caught instantly by the atomic protection engine.",
    clientAuthor: "Vince Morales · Production Director",
    keepsakeDetail: "Waterproof fabric Web NFC festival wristband with multi-stage credentials.",
    summary:
      "A high-energy outdoor music festival across 3 stages. Solstice deployed MOMENTUS for festival ground admissions, Web NFC wristband scanning, and online duplicate pass rejection across 12 turnstiles.",
    highlights: [
      "Mobile festival guide with artist lineups & stage timetables",
      "High-volume Web NFC wristband check-in across 12 gates",
      "Atomic duplicate protection preventing pass re-use",
    ],
    imageSrc: "/images/events/festival-real.jpg",
    imageAlt: "Solstice Music Festival live stage and NFC festival admission preview",
    tag: "FIELD VERIFIED",
    href: "/sign-up?experience=festival",
    ctaText: "Explore Event Experience",
    filterCategory: "festivals",
  },
  {
    id: "coastal-marathon",
    number: "04",
    category: "ATHLETIC & ENDURANCE",
    clientName: "Metro Coastal 21K Half-Marathon",
    eventType: "Fun Runs & Sporting Events",
    venueAndDate: "Seaside Blvd, Pasay · Aug 2026",
    micrositeUrl: "momentus.events/coastal-21k",
    metricsBadge: "1,450 Runners · Wave-Timed Registry",
    clientQuote:
      "1,450 runners checked in through digital consent waivers and received wave corral badges. Finishers tapped at the timing line for instant split recaps without a single paper sheet printed.",
    clientAuthor: "Coach Ray Reyes · Race Marshal",
    keepsakeDetail: "Smart bib with embedded timing pass & digital finisher certificate token.",
    summary:
      "A premier sunrise coastal half-marathon and charity 5K. MOMENTUS handled runner registration, digital medical consent waivers, wave-corral assignments, and post-race split timing recaps.",
    highlights: [
      "Runner bib verification & digital medical consent flow",
      "Staggered wave release schedule & checkpoint tracking",
      "Post-race digital finisher badge & race recap gallery",
    ],
    imageSrc: "/images/events/marathon-real.jpg",
    imageAlt: "Metro Coastal 21K marathon bib and race day operations preview",
    tag: "FIELD VERIFIED",
    href: "/sign-up?experience=sports",
    ctaText: "Explore Event Experience",
    filterCategory: "sports",
  },
  {
    id: "apex-summit",
    number: "05",
    category: "SUMMITS & CONFERENCES",
    clientName: "Apex Global Technology Summit",
    eventType: "Corporate Events & Conferences",
    venueAndDate: "Shangri-La at The Fort BGC · Nov 2026",
    micrositeUrl: "momentus.events/apex-summit",
    metricsBadge: "520 Keynote Delegates · 3 Breakout Tracks",
    clientQuote:
      "Enterprise leaders from 24 countries moved smoothly between plenary keynotes, private boardrooms, and executive banquets with scoped NFC badges. The real-time flow dashboard was indispensable.",
    clientAuthor: "Elena Rostova · VP Global Events",
    keepsakeDetail: "Brushed titanium executive NFC badge with plenary & private salon credentials.",
    summary:
      "An annual executive summit for enterprise technology leaders. MOMENTUS delivered isolated company portals, customized keynote agendas, and role-scoped RFID badges for plenary and VIP lounges.",
    highlights: [
      "Multi-tenant executive portal with session schedules",
      "Encrypted RFID delegate badges with plenary access",
      "Staff station access control for VIP networking lounge",
    ],
    imageSrc: "/images/events/summit-real.jpg",
    imageAlt: "Apex Global Technology Summit auditorium and keynote credential preview",
    tag: "ENTERPRISE CLIENT",
    href: "/sign-up?experience=corporate",
    ctaText: "Explore Event Experience",
    spanClass: "grid-card-wide",
    filterCategory: "corporate",
  },
  {
    id: "obsidian-room",
    number: "06",
    category: "EXCLUSIVE CLUBS & GALAS",
    clientName: "The Obsidian Room · Private Society",
    eventType: "Exclusive Parties & VIP Experiences",
    venueAndDate: "Salcedo Village Speakeasy, Makati · Dec 2026",
    micrositeUrl: "momentus.events/obsidian-vip",
    metricsBadge: "85 Encrypted Keycards · 100% Attendance",
    clientQuote:
      "An unlisted midnight salon for 85 founders. The private microsite revealed the secret address 3 hours prior. Tap-in was discreet, elegant, and protected by online atomic duplicate prevention.",
    clientAuthor: "Anonymous Patron · Society Curator",
    keepsakeDetail: "Matte-black NFC token card granting one-time speakeasy admission & tasting vouchers.",
    summary:
      "A clandestine midnight dinner and tasting salon for founders. Organizers issued private unlisted invitations, single-card token credentials, and real-time beverage tasting voucher tracking.",
    highlights: [
      "Password-protected unlisted invitation microsite",
      "One-card access token with embedded tasting tokens",
      "Live sommelier bar & private tasting voucher tracking",
    ],
    imageSrc: "/images/events/vip-real.jpg",
    imageAlt: "The Obsidian Room private speakeasy and gold foil VIP access card preview",
    tag: "PRIVATE INVITATION",
    href: "/sign-up?experience=vip",
    ctaText: "Explore Event Experience",
    filterCategory: "vip",
  },
];

const filterTabs = [
  { id: "all", label: "All Previous Clients", count: 6 },
  { id: "weddings", label: "Romantic Unions", count: 1 },
  { id: "milestones", label: "Grand Debuts", count: 1 },
  { id: "festivals", label: "Music Festivals", count: 1 },
  { id: "sports", label: "Half-Marathons", count: 1 },
  { id: "corporate", label: "Tech Summits", count: 1 },
  { id: "vip", label: "Private Societies", count: 1 },
];

export function EventsShowcaseSection() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  // Track active card view mode ("microsite" or "experience") per card id
  const [cardModes, setCardModes] = useState<Record<string, "microsite" | "experience">>({
    "amara-luca": "microsite",
    "mikaela-debut": "microsite",
    "solstice-fest": "microsite",
    "coastal-marathon": "microsite",
    "apex-summit": "microsite",
    "obsidian-room": "microsite",
  });

  const toggleCardMode = (cardId: string, mode: "microsite" | "experience") => {
    setCardModes((prev) => ({ ...prev, [cardId]: mode }));
  };

  const filteredShowcases =
    selectedFilter === "all"
      ? showcases
      : showcases.filter((item) => item.filterCategory === selectedFilter);

  return (
    <section
      className="events-showcase-section"
      id="events"
      aria-labelledby="events-section-title"
    >
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-editorial" data-reveal>
          <div className="vintage-eyebrow justify-center">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">PREVIOUS CLIENT SHOWCASE · REAL EVENT MICROSITES</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>

          <h2 id="events-section-title" className="editorial-section-title">
            Real clients. Live microsites.
            <br />
            <span className="serif-italic-accent">Unforgettable guest experiences.</span>
          </h2>

          <p className="editorial-section-desc">
            Explore how real organizers and couples used MOMENTUS to publish custom guest microsites,
            streamline RSVPs, issue physical NFC credentials, and choreograph memorable event-day operations
            across weddings, debuts, music festivals, marathons, and summits.
          </p>
        </div>

        {/* Interactive Filter Pills */}
        <div className="client-filter-bar" aria-label="Filter client showcase by event category" data-reveal>
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`filter-pill-btn ${isActive ? "is-active" : ""}`}
                onClick={() => setSelectedFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="tab-count-badge">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* 6 Client Showcase Editorial Grid */}
        <div className="editorial-categories-grid" data-reveal>
          {filteredShowcases.map((item) => {
            const currentMode = cardModes[item.id] || "microsite";
            return (
              <article
                key={item.number}
                className={`editorial-category-card client-showcase-card ${item.spanClass ?? ""}`}
              >
                {/* Dual-Perspective Card Header Toolbar */}
                <div className="card-perspective-toolbar">
                  <div className="perspective-tabs" role="group" aria-label="Showcase perspective selector">
                    <button
                      type="button"
                      className={`persp-btn ${currentMode === "microsite" ? "is-active" : ""}`}
                      onClick={() => toggleCardMode(item.id, "microsite")}
                      aria-label={`View Microsite card for ${item.clientName}`}
                    >
                      <span className="persp-icon" aria-hidden="true">🌐</span>
                      <span>Microsite Card</span>
                    </button>
                    <button
                      type="button"
                      className={`persp-btn ${currentMode === "experience" ? "is-active" : ""}`}
                      onClick={() => toggleCardMode(item.id, "experience")}
                      aria-label={`View Event Experience for ${item.clientName}`}
                    >
                      <span className="persp-icon" aria-hidden="true">✨</span>
                      <span>Event Experience</span>
                    </button>
                  </div>
                  <span className="card-roman-number">{item.number}</span>
                </div>

                {/* Media Preview: Browser Chrome or Experience Stage View */}
                <div className="card-media-wrapper">
                  {currentMode === "microsite" ? (
                    <>
                      {/* Browser top-bar chrome */}
                      <div className="client-card-browser-bar">
                        <div className="browser-dots" aria-hidden="true">
                          <span className="dot dot-close" />
                          <span className="dot dot-minimize" />
                          <span className="dot dot-maximize" />
                        </div>
                        <div className="browser-url-pill">
                          <span className="url-lock" aria-hidden="true">🔒</span>
                          <span className="url-domain">{item.micrositeUrl}</span>
                        </div>
                        {item.isLiveDemo && (
                          <span className="browser-live-pulse" title="Interactive live demo available">
                            <span className="pulse-indicator" /> Live
                          </span>
                        )}
                      </div>

                      {/* Realistic High-Res Photography Backdrop */}
                      <div className="card-media-viewport">
                        <Image
                          src={item.imageSrc}
                          alt={item.imageAlt}
                          width={600}
                          height={380}
                          className="card-category-image"
                          loading="eager"
                        />
                        <div className="microsite-glass-overlay">
                          <div className="overlay-microsite-header">
                            <span className="overlay-badge">{item.category}</span>
                            <span className="overlay-date">{item.venueAndDate.split("·")[1]?.trim() || "2026"}</span>
                          </div>
                          <p className="overlay-client-name">{item.clientName}</p>
                          <div className="overlay-footer-row">
                            <span className="overlay-pill">{item.metricsBadge.split("·")[0]?.trim()}</span>
                            <span className="overlay-cta-hint">Touch to preview microsite →</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Event Day Experience & Keepsake Card View */
                    <div className="card-experience-visual">
                      <div className="experience-photo-wrap">
                        <Image
                          src={item.imageSrc}
                          alt={item.imageAlt}
                          width={600}
                          height={380}
                          className="card-category-image experience-back-img"
                        />
                        <div className="experience-glass-card">
                          <div className="experience-gold-chip">
                            <span className="chip-symbol">✦</span>
                            <span className="chip-label">PHYSICAL NFC KEEPSAKE</span>
                          </div>
                          <p className="experience-detail-quote">&ldquo;{item.clientQuote}&rdquo;</p>
                          <div className="experience-quote-footer">
                            <span className="quote-author">{item.clientAuthor}</span>
                            <span className="turnout-pill">100% Attended</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="card-badge-overlay">
                    <span className="card-tag-pill">{item.tag}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-content-body">
                  {/* Category & Venue Kicker */}
                  <div className="client-kicker-row">
                    <p className="card-category-kicker">{item.eventType}</p>
                    <span className="client-metrics-chip">{item.metricsBadge}</span>
                  </div>

                  {/* Client & Event Title */}
                  <h3 className="card-category-title client-name-title">{item.clientName}</h3>

                  {/* Venue & Date Metadata */}
                  <p className="client-venue-meta">
                    <span className="venue-pin" aria-hidden="true">📍</span>
                    {item.venueAndDate}
                  </p>

                  {/* Narrative Summary */}
                  <p className="card-category-summary">{item.summary}</p>

                  {/* Physical Keepsake Highlight Banner */}
                  <div className="card-keepsake-banner">
                    <span className="keepsake-badge">PHYSICAL CREDENTIAL</span>
                    <p className="keepsake-text">{item.keepsakeDetail}</p>
                  </div>

                  {/* Lived Experience Highlights */}
                  <div className="card-features-list">
                    <p className="features-subhead">GUEST EXPERIENCE HIGHLIGHTS</p>
                    {item.highlights.map((highlight) => (
                      <div key={highlight} className="card-feature-point">
                        <span className="feature-marker" aria-hidden="true">✦</span>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Card Action Button */}
                  <div className="card-footer-action">
                    <Link
                      href={item.href}
                      className="card-explore-link client-microsite-btn"
                      aria-label={`${item.ctaText} for ${item.clientName}`}
                    >
                      <span>{item.ctaText}</span>
                      <span className="link-arrow" aria-hidden="true">↗</span>
                    </Link>

                    {item.isLiveDemo && (
                      <span className="live-demo-subtext">Interactive demo with live RSVP</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Assurance Note */}
        <div className="categories-bottom-note" data-reveal>
          <div className="note-card">
            <span className="note-icon" aria-hidden="true">✦</span>
            <div className="note-text-content">
              <strong>Tailored to your occasion:</strong> Whether you need an intimate wedding microsite with
              assigned seating or a 2,800-person music festival with rapid NFC turnstiles, MOMENTUS scales
              effortlessly to your vision.
            </div>
            <Link href="/sign-up" className="note-cta-link">
              <span>Start Your Event Setup</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
