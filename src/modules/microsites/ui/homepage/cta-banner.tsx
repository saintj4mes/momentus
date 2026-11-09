import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="cta-banner-section" aria-labelledby="cta-banner-title">
      <div className="section-container">
        <div className="cta-banner-box" data-reveal>
          {/* Decorative Corner Ornaments */}
          <div className="box-corner-ornament top-left" aria-hidden="true" />
          <div className="box-corner-ornament top-right" aria-hidden="true" />
          <div className="box-corner-ornament bottom-left" aria-hidden="true" />
          <div className="box-corner-ornament bottom-right" aria-hidden="true" />

          <div className="cta-banner-content">
            <div className="vintage-eyebrow justify-center">
              <span className="eyebrow-rule" aria-hidden="true" />
              <span className="eyebrow-pill">BEGIN YOUR GATHERING</span>
              <span className="eyebrow-rule" aria-hidden="true" />
            </div>

            <h2 id="cta-banner-title" className="cta-headline">
              Ready to create an
              <br />
              <span className="serif-italic-accent">extraordinary event experience?</span>
            </h2>

            <p className="cta-description">
              Join visionary event directors, creative studios, and hosts crafting
              memorable gatherings across the Philippines and beyond. Get started
              with our full suite of planning, live operations, and memory tools today.
            </p>

            <div className="cta-buttons-cluster">
              <Link href="/sign-up" className="cta-primary-btn">
                <span>Create Your Event</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/admin" className="cta-secondary-btn">
                <span>Explore Demo Studio</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="cta-meta-strip">
              <span>✦ Local-first modular architecture</span>
              <span>✦ Tested Web NFC & Rapid QR</span>
              <span>✦ Atomic duplicate protection</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

