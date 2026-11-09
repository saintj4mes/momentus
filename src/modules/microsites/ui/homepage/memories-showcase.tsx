import Image from "next/image";

interface MemoryPillar {
  number: string;
  badge: string;
  title: string;
  description: string;
  tag: string;
}

const memoryPillars: MemoryPillar[] = [
  {
    number: "01",
    badge: "PHYSICAL KEEPSAKE BRIDGE",
    title: "The NFC Card Keepsake",
    description:
      "The physical card issued for the event remains permanently active. Weeks or months later, guests simply tap their card against any smartphone to reopen their curated retrospective.",
    tag: "ONE TOUCH ACCESS",
  },
  {
    number: "02",
    badge: "CURATED STORYTELLING",
    title: "Host-Curated Galleries & Films",
    description:
      "Hosts curate high-resolution event photography and official cinema films, organizing moments chronologically from preparation to the final celebration toast.",
    tag: "HIGH RESOLUTION ARCHIVE",
  },
  {
    number: "03",
    badge: "PRIVATE & EFFORTLESS",
    title: "No Guest Accounts Required",
    description:
      "Attendees enjoy instant, authenticated access through their private token or physical NFC card, without navigating forgotten passwords or app store installations.",
    tag: "TOKEN AUTHENTICATION",
  },
  {
    number: "04",
    badge: "THOUGHTFUL RETENTION",
    title: "12-Month Hosting & Data Privacy",
    description:
      "Full gallery hosting is maintained for 12 months with easy high-resolution host exports, while temporary operational notes and allergies are automatically purged 30 days post-event.",
    tag: "PRIVACY SAFEGUARDS",
  },
];

export function MemoriesShowcase() {
  return (
    <section
      className="memories-showcase-section"
      id="memories"
      aria-labelledby="memories-section-title"
    >
      <div className="section-container">
        {/* Header */}
        <div className="section-header-editorial" data-reveal>
          <div className="vintage-eyebrow justify-center">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">POST-EVENT RETROSPECTIVE</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>

          <h2 id="memories-section-title" className="editorial-section-title">
            The event ends.
            <br />
            <span className="serif-italic-accent">The memories stay.</span>
          </h2>

          <p className="editorial-section-desc">
            An extraordinary gathering does not conclude when the house lights come up.
            MOMENTUS bridges the physical occasion to a lasting digital keepsake,
            accessible with a single tap of the keepsake card.
          </p>
        </div>

        {/* Visual Memory Gallery Collage */}
        <div className="memory-visual-gallery" data-reveal>
          {/* Main Visual Feature Card */}
          <div className="memory-card-primary">
            <div className="memory-photo-frame">
              <div className="memory-mat">
                <Image
                  src="/images/events/wedding-real.jpg"
                  alt="Curated courtyard celebration retrospective photography"
                  width={600}
                  height={380}
                  className="memory-img"
                  loading="lazy"
                />
                <div className="memory-caption-strip">
                  <span className="memory-stamp">ARCHIVE · CHAPTER III</span>
                  <span className="memory-meta">Courtyard Reception · Manila 2026</span>
                </div>
              </div>
            </div>
            <div className="memory-card-caption">
              <span className="memory-kicker">CURATED RETROSPECTIVE</span>
              <h3 className="memory-title">A Living Album for Attendees</h3>
              <p className="memory-lead">
                Guests revisit the speeches, candids, and official photography in an
                editorial layout that matches the beauty of the original invitation.
              </p>
            </div>
          </div>

          {/* Secondary Visual Feature Card: Concert & Runner Celebrations */}
          <div className="memory-card-secondary">
            <div className="memory-photo-frame mb-4">
              <div className="memory-mat">
                <Image
                  src="/images/events/festival-real.jpg"
                  alt="Live festival stage lights and crowd retrospective"
                  width={400}
                  height={240}
                  className="memory-img"
                  loading="lazy"
                />
                <div className="memory-caption-strip">
                  <span className="memory-stamp">SOLSTICE RECAP</span>
                  <span className="memory-meta">Main Stage Moments</span>
                </div>
              </div>
            </div>

            <div className="memory-photo-frame">
              <div className="memory-mat">
                <Image
                  src="/images/events/marathon-real.jpg"
                  alt="Finish line marathon medal celebrations"
                  width={400}
                  height={240}
                  className="memory-img"
                  loading="lazy"
                />
                <div className="memory-caption-strip">
                  <span className="memory-stamp">21K FINISHER ALBUM</span>
                  <span className="memory-meta">Finish Line Glory</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="memory-pillars-grid" data-reveal>
          {memoryPillars.map((pillar) => (
            <article key={pillar.number} className="memory-pillar-card">
              <div className="pillar-header-row">
                <span className="pillar-roman">{pillar.number}</span>
                <span className="pillar-tag">{pillar.tag}</span>
              </div>
              <span className="pillar-badge">{pillar.badge}</span>
              <h3 className="pillar-heading">{pillar.title}</h3>
              <p className="pillar-copy">{pillar.description}</p>
            </article>
          ))}
        </div>

        {/* Retrospective Keepsake Card Spotlight */}
        <div className="memory-keepsake-spotlight" data-reveal>
          <div className="keepsake-showcase-box">
            <div className="keepsake-visual">
              <div className="realistic-nfc-card">
                <div className="card-texture-overlay" />
                <div className="card-chip-element">
                  <span className="chip-lines" />
                  <span className="chip-core" />
                </div>
                <div className="card-foil-brand">
                  <span className="brand-monogram">m</span>
                  <span className="brand-name">MOMENTUS KEEPSAKE</span>
                </div>
                <p className="card-holder-name">AMARA SANTOS &amp; LUCA REYES</p>
                <div className="card-details-row">
                  <span className="card-token-id">NFC-TKN · #C0829-26</span>
                  <span className="card-contactless-icon">))))</span>
                </div>
              </div>
            </div>

            <div className="keepsake-story">
              <span className="story-eyebrow">PHYSICAL TOUCHPOINT</span>
              <h3 className="story-title">A Keepsake They Keep for Years</h3>
              <p className="story-desc">
                Unlike digital app notifications or disposable paper stubs, MOMENTUS cards
                are designed as tangible keepsakes. Hand-finished wood, brushed metal, or
                heavy velvet cardstock, bound permanently to their private memories.
              </p>
              <div className="story-metrics">
                <div className="metric-col">
                  <strong>100%</strong>
                  <span>Private Tokenized Access</span>
                </div>
                <div className="metric-col">
                  <strong>12 Mo</strong>
                  <span>Extended Cloud Hosting</span>
                </div>
                <div className="metric-col">
                  <strong>0.4s</strong>
                  <span>Tap-to-Memory Speed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
