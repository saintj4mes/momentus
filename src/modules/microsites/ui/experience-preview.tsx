const steps = [
  {
    number: "01",
    title: "Plan with clarity",
    copy: "Keep client details, event information, and guest registration settings organized.",
    marker: "I",
  },
  {
    number: "02",
    title: "Configure each event",
    copy: "Choose the service areas that suit a celebration, conference, community day, or company gathering.",
    marker: "II",
  },
  {
    number: "03",
    title: "Shape the experience",
    copy: "Design event pages and prepare follow-up experiences in a dedicated workspace.",
    marker: "III",
  },
];

export function ExperiencePreview() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Momentus home">
          <span className="wordmark-symbol" aria-hidden="true">
            m
          </span>
          <span>MOMENTUS</span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#experience">The experience</a>
          <a href="#details">Made for real days</a>
        </nav>

        <a className="header-link" href="/sign-up">
          Start your event <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" />
            THE EVENT STUDIO
          </p>
          <h1 id="hero-title">
            Bring every part
            <br />
            <span className="serif-italic">of your event together.</span>
          </h1>
          <p className="hero-description">
            MOMENTUS is a workspace for planning event information, guest
            registration, event day operations, and the memories that follow.
            Choose the experiences that fit each gathering.
          </p>
          <a className="primary-link" href="#experience">
            Discover Momentus <span aria-hidden="true">↓</span>
          </a>
          <p className="hero-caption">MADE FOR THE MOMENTS THAT MATTER</p>
        </div>

        <div
          className="hero-art"
          role="img"
          aria-label="An event experience preview"
        >
          <div className="art-orbit art-orbit-outer" aria-hidden="true" />
          <div className="art-orbit art-orbit-inner" aria-hidden="true" />
          <div className="art-sun" aria-hidden="true" />
          <div className="invitation-card" id="sample-invitation">
            <p className="card-overline">A SAMPLE EVENT</p>
            <div className="card-flower" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <i />
            </div>
            <p className="card-intro">A place for every gathering</p>
            <p className="couple-names">
              Your <span>&</span> Moment
            </p>
            <p className="card-message">event information, shared with care</p>
            <span className="card-divider" aria-hidden="true" />
            <p className="card-date">SATURDAY · 12 DECEMBER · 2026</p>
            <p className="card-place">INTRAMUROS, MANILA</p>
            <span className="card-footer-mark" aria-hidden="true">
              m
            </span>
          </div>
          <p className="art-note">
            <span className="note-dot" aria-hidden="true" />A LITTLE PREVIEW OF
            WHAT&apos;S TO COME
          </p>
          <span className="hero-index" aria-hidden="true">
            01 — 03
          </span>
        </div>
      </section>

      <section
        className="experience-section"
        id="experience"
        aria-labelledby="experience-title"
      >
        <div className="section-heading">
          <p className="eyebrow">ONE CARD · EVERY CHAPTER</p>
          <h2 id="experience-title">
            Events take many forms.
            <br />
            <span className="serif-italic">
              Shape the details around yours.
            </span>
          </h2>
          <p className="section-description">
            Create separate event workspaces for celebrations, company events,
            conferences, community gatherings, and more. Configure services for
            each event as its needs become clear.
          </p>
        </div>

        <div className="steps-grid" id="details">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-topline">
                <span className="step-number">{step.number}</span>
                <span className="step-marker" aria-hidden="true">
                  {step.marker}
                </span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <a
          className="wordmark footer-wordmark"
          href="#top"
          aria-label="Momentus, back to top"
        >
          <span className="wordmark-symbol" aria-hidden="true">
            m
          </span>
          <span>MOMENTUS</span>
        </a>
        <p>A flexible workspace for events and experiences.</p>
        <span className="footer-place">PHILIPPINES · 2026</span>
      </footer>
    </main>
  );
}
