import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer-redesign" aria-label="Site footer">
      <div className="footer-container">
        {/* Top Footer Grid */}
        <div className="footer-top-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <a className="wordmark footer-wordmark" href="#top" aria-label="MOMENTUS, return to top">
              <span className="wordmark-symbol" aria-hidden="true">
                m
              </span>
              <span>MOMENTUS</span>
            </a>
            <p className="footer-mission-text">
              The premium event experience platform. Uniting bespoke invitations,
              frictionless registration, live event-day operations, and lasting memories
              in one beautifully organized system.
            </p>
            <div className="footer-vintage-stamp">
              <span>PHILIPPINES · EST. 2026</span>
            </div>
          </div>

          {/* Navigation Column 1: Journey & Product */}
          <div className="footer-links-col">
            <h4 className="footer-col-heading">EVENT EXPERIENCE</h4>
            <ul className="footer-nav-list">
              <li>
                <a href="#events">Events We Bring to Life</a>
              </li>
              <li>
                <a href="#experience">The Three-Stage Journey</a>
              </li>
              <li>
                <a href="#value">Event Management Value</a>
              </li>
              <li>
                <a href="#designer">GrapesJS Designer Studio</a>
              </li>
              <li>
                <a href="#memories">Post-Event Retrospective</a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Platform & Tools */}
          <div className="footer-links-col">
            <h4 className="footer-col-heading">PLATFORM TOOLS</h4>
            <ul className="footer-nav-list">
              <li>
                <Link href="/organizer">Organizer Studio</Link>
              </li>
              <li>
                <Link href="/admin">Admin Console Demo</Link>
              </li>
              <li>
                <Link href="/admin/onboarding">Client Onboarding</Link>
              </li>
              <li>
                <Link href="/admin/designer/amara-luca">Designer Studio Demo</Link>
              </li>
              <li>
                <Link href="/staff/nfc-prototype">Staff NFC Prototype</Link>
              </li>
              <li>
                <Link href="/sign-in">Organizer Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Trust & Architecture */}
          <div className="footer-links-col">
            <h4 className="footer-col-heading">CORE STANDARDS</h4>
            <p className="footer-standards-text">
              <strong>Modular Monolith:</strong> Next.js 16 App Router with PostgreSQL
              and atomic transaction guarantees.
            </p>
            <p className="footer-standards-text mt-2">
              <strong>Hardware Integrity:</strong> Physical NFC cards bound to private
              invitation tokens with online duplicate verification.
            </p>
            <p className="footer-standards-text mt-2">
              <strong>Data Stewardship:</strong> Sensitive dietary notes automatically
              purged 30 days post-event.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © 2026 MOMENTUS. All rights reserved. Designed with vintage editorial elegance & modern event craft.
          </p>
          <div className="footer-bottom-meta">
            <span>MANILA · ASIA PACIFIC</span>
            <span className="meta-bullet">•</span>
            <span>NEXT.JS 16 & TAILWIND 4</span>
            <span className="meta-bullet">•</span>
            <a href="#top" className="back-to-top-link">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

