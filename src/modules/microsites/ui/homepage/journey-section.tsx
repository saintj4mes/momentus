interface JourneyStage {
  phase: string;
  roman: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  items: { title: string; desc: string }[];
  tag: string;
}

const stages: JourneyStage[] = [
  {
    phase: "STAGE 01",
    roman: "I",
    badge: "BEFORE THE EVENT",
    title: "Plan & Invite",
    subtitle: "Anticipation, registration, and bespoke event identity.",
    description:
      "Craft a distinct aesthetic for your occasion and establish clear attendee records before the first guest arrives.",
    items: [
      {
        title: "Custom Invitations",
        desc: "High-entropy private token links delivered digitally or permanently programmed into physical keepsake cards.",
      },
      {
        title: "RSVP & Registration",
        desc: "Collect confirmed attendees, companion details, dietary requirements, and custom event questionnaire answers.",
      },
      {
        title: "Guest Management",
        desc: "Real-time guest lists, reserved place counters, companion allowances, and automatic table or seat assignments.",
      },
      {
        title: "Event Microsites",
        desc: "Design and publish responsive event pages using the built-in GrapesJS visual studio with custom typography.",
      },
    ],
    tag: "PLANNING & INVITATIONS",
  },
  {
    phase: "STAGE 02",
    roman: "II",
    badge: "DURING THE EVENT",
    title: "Welcome & Experience",
    subtitle: "Seamless entry, atomic verification, and live flow.",
    description:
      "Eliminate bottlenecks at the door and stations with fast tap-to-verify cards and role-scoped staff operation tools.",
    items: [
      {
        title: "NFC & QR Event Access",
        desc: "Tap physical cards via Web NFC on supported Android Chrome devices or scan high-speed QR passes on any smartphone.",
      },
      {
        title: "Server-Verified Check-In",
        desc: "Online atomic duplicate protection ensures credentials cannot be shared, cloned, or double-scanned at the gates.",
      },
      {
        title: "Meal & Booth Experiences",
        desc: "Station-specific scanning allows caterers and activity booths to verify claims and entitlements per individual guest.",
      },
      {
        title: "Event Operations Control",
        desc: "Authorized managers handle walk-ins within capacity limits, resolve changes with audit records, and track arrivals.",
      },
    ],
    tag: "LIVE EVENT OPERATIONS",
  },
  {
    phase: "STAGE 03",
    roman: "III",
    badge: "AFTER THE EVENT",
    title: "Remember & Relive",
    subtitle: "Enduring recollections and privacy-respecting archives.",
    description:
      "Transform a single day of celebration into a permanent keepsake that attendees can return to and cherish.",
    items: [
      {
        title: "Event Galleries",
        desc: "Host-curated photo collections and official film recaps presented in an elegant editorial visual album.",
      },
      {
        title: "One-Tap NFC Retrospective",
        desc: "Guests tap the physical card they took home to instantly reopen the memory experience without remembering passwords.",
      },
      {
        title: "Recaps & Downloads",
        desc: "Organizers can export high-resolution media collections and share retrospective digests with confirmed guests.",
      },
      {
        title: "Extended Access & Privacy",
        desc: "12-month private hosting with automatic 30-day purge of sensitive dietary notes and optional host extensions.",
      },
    ],
    tag: "RETROSPECTIVE & ARCHIVE",
  },
];

export function JourneySection() {
  return (
    <section
      className="journey-experience-section"
      id="experience"
      aria-labelledby="journey-section-title"
    >
      <div className="section-container">
        {/* Header */}
        <div className="section-header-editorial" data-reveal>
          <div className="vintage-eyebrow justify-center">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">THE MOMENTUS EXPERIENCE</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>

          <h2 id="journey-section-title" className="editorial-section-title">
            Three chapters of
            <br />
            <span className="serif-italic-accent">every extraordinary gathering.</span>
          </h2>

          <p className="editorial-section-desc">
            From the quiet anticipation of the first invitation to the energy of live operations
            and the permanence of post-event memories, MOMENTUS unites the full event arc.
          </p>
        </div>

        {/* 3 Connected Editorial Panels */}
        <div className="journey-timeline-grid" data-reveal>
          {stages.map((stage, idx) => (
            <div key={stage.phase} className="journey-editorial-card">
              <div className="journey-card-header">
                <div className="journey-phase-meta">
                  <span className="journey-phase-kicker">{stage.phase}</span>
                  <span className="journey-badge-tag">{stage.badge}</span>
                </div>
                <span className="journey-roman-numeral" aria-hidden="true">
                  {stage.roman}
                </span>
              </div>

              <div className="journey-card-heading">
                <h3 className="journey-stage-title">{stage.title}</h3>
                <p className="journey-stage-subtitle">{stage.subtitle}</p>
                <p className="journey-stage-intro">{stage.description}</p>
              </div>

              <div className="journey-separator-line" aria-hidden="true">
                <span className="separator-dot" />
              </div>

              <div className="journey-items-list">
                {stage.items.map((item) => (
                  <div key={item.title} className="journey-item-row">
                    <div className="journey-item-bullet" aria-hidden="true">
                      ✦
                    </div>
                    <div className="journey-item-text">
                      <h4 className="journey-item-title">{item.title}</h4>
                      <p className="journey-item-desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="journey-card-footer">
                <span className="journey-tag-pill">{stage.tag}</span>
                <span className="journey-step-indicator">
                  Step 0{idx + 1} of 03
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Truth and Pilot Assurance */}
        <div className="journey-footnote-banner" data-reveal>
          <div className="footnote-grid">
            <div className="footnote-col">
              <span className="footnote-kicker">PHYSICAL NFC CARDS</span>
              <p>
                One active card permanently bound to one private invitation.
                Staff Web NFC supported on tested Android Chrome devices;
                fast QR fallback available on all platforms.
              </p>
            </div>
            <div className="footnote-col">
              <span className="footnote-kicker">ATOMIC INTEGRITY</span>
              <p>
                Server-confirmed claims with transactional locking.
                Capacity and admission cannot be duplicated by forwardable
                links or simultaneous scans.
              </p>
            </div>
            <div className="footnote-col">
              <span className="footnote-kicker">PRIVACY ARCHITECTURE</span>
              <p>
                Guests access their passes and memories via private tokens
                without creating passwords. Sensitive notes purged 30 days
                post-event.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

