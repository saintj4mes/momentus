import Link from "next/link";

interface ValueItem {
  icon: string;
  number: string;
  title: string;
  lead: string;
  benefit: string;
}

const valueItems: ValueItem[] = [
  {
    icon: "🏛",
    number: "01",
    title: "Manage Multiple Clients",
    lead: "Dedicated client workspaces with strict multi-tenant isolation.",
    benefit:
      "Agencies and private celebrants operate in segregated environments with clear role-based access, keeping confidential guest lists and credentials pristine.",
  },
  {
    icon: "📅",
    number: "02",
    title: "Organize Multiple Events",
    lead: "Orchestrate your full event calendar without friction.",
    benefit:
      "Run concurrent galas, outdoor music festivals, and corporate summits with independent capacity limits, stage rosters, and admission policies.",
  },
  {
    icon: "⚡",
    number: "03",
    title: "Instant Turnstile & Gate Operations",
    lead: "Sub-second Web NFC scanning built for peak crowd arrivals.",
    benefit:
      "Equip door staff with lightning-fast tap validation on standard Android phones. Check-in is instantaneous, with online atomic duplicate pass rejection.",
  },
  {
    icon: "📋",
    number: "04",
    title: "Personalized Guest Welcoming & Seating",
    lead: "Banquet seating charts, companion quotas, and dietary care.",
    benefit:
      "Guests are greeted by name at the courtyard with their exact table assignment and dietary notes communicated directly to catering in real time.",
  },
  {
    icon: "🎨",
    number: "05",
    title: "Artisanal Event Microsite Canvas",
    lead: "Bespoke digital presence reflecting each client's signature aesthetic.",
    benefit:
      "Publish captivating responsive invitation pages with custom typography, interactive RSVP forms, venue maps, and real-time live event modes.",
  },
  {
    icon: "✦",
    number: "06",
    title: "Enduring Physical Keepsake Cards",
    lead: "A physical NFC card permanently bound to each private invitation.",
    benefit:
      "Turn invitations into cherished mementos. Guests take their engraved cards home and tap them anytime to revisit high-resolution memory galleries.",
  },
];

export function ValueSection() {
  return (
    <section
      className="value-management-section"
      id="value"
      aria-labelledby="value-section-title"
    >
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header-editorial" data-reveal>
          <div className="vintage-eyebrow justify-center">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">OPERATIONAL EXCELLENCE</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>

          <h2 id="value-section-title" className="editorial-section-title">
            Beautiful experiences.
            <br />
            <span className="serif-italic-accent">Thoughtfully organized.</span>
          </h2>

          <p className="editorial-section-desc">
            Event directors, creative agencies, and independent planners balance hundreds
            of critical details. MOMENTUS provides the calm operational foundation behind
            flawless live executions.
          </p>
        </div>

        {/* 6 Value Pillars Grid */}
        <div className="value-pillars-grid" data-reveal>
          {valueItems.map((item) => (
            <article key={item.number} className="value-pillar-card">
              <div className="pillar-top-row">
                <span className="pillar-number">{item.number}</span>
                <span className="pillar-icon" aria-hidden="true">
                  {item.icon}
                </span>
              </div>

              <h3 className="pillar-title">{item.title}</h3>
              <p className="pillar-lead">{item.lead}</p>
              <p className="pillar-benefit">{item.benefit}</p>
            </article>
          ))}
        </div>

        {/* Organizer Callout Banner */}
        <div className="organizer-callout-banner" data-reveal>
          <div className="callout-inner">
            <div className="callout-text">
              <span className="callout-kicker">BUILT FOR REAL OPERATIONAL MASTERY</span>
              <h3 className="callout-headline">
                Experience the MOMENTUS Organizer Studio
              </h3>
              <p className="callout-desc">
                From initial guest onboarding and seating arrangements to real-time
                event-day scanner dashboards, see how our platform empowers your team.
              </p>
            </div>

            <div className="callout-actions">
              <Link href="/admin" className="callout-primary-btn">
                <span>Explore Organizer Console</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/admin/events" className="callout-secondary-btn">
                <span>View Event Workspace</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
