"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ViewportMode = "desktop" | "tablet" | "mobile";

export function DesignerShowcase() {
  const [activeViewport, setActiveViewport] = useState<ViewportMode>("desktop");
  const [activeTheme, setActiveTheme] = useState("editorial");

  return (
    <section
      className="designer-studio-showcase-section"
      id="designer"
      aria-labelledby="designer-section-title"
    >
      <div className="section-container">
        {/* Header */}
        <div className="section-header-editorial" data-reveal>
          <div className="vintage-eyebrow justify-center">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">INTERACTIVE MICROSITE CANVAS</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>

          <h2 id="designer-section-title" className="editorial-section-title">
            Your event,
            <br />
            <span className="serif-italic-accent">your vision.</span>
          </h2>

          <p className="editorial-section-desc">
            A visual, open-standard GrapesJS canvas designed specifically for bespoke event microsites.
            Customize themes, preview responsive viewports in real time, and see how your guest invitation
            adapts across desktop, tablet, and mobile displays.
          </p>
        </div>

        {/* Feature Grid Summary */}
        <div className="designer-capabilities-row" data-reveal>
          <div className="cap-pill">
            <strong>Editable Microsite Designs</strong>
            <span>Drag-and-drop sections, banners & rosters</span>
          </div>
          <div className="cap-pill">
            <strong>Multiple Event Styles</strong>
            <span>Floral romantic, modern minimalist & editorial</span>
          </div>
          <div className="cap-pill">
            <strong>Responsive Layouts</strong>
            <span>Instant desktop, tablet, and mobile testing</span>
          </div>
          <div className="cap-pill">
            <strong>Custom Themes</strong>
            <span>Warm vintage palettes, antique gold & serif fonts</span>
          </div>
          <div className="cap-pill">
            <strong>AI-Assisted Design</strong>
            <span>Intelligent layout proposals & copy refinement</span>
          </div>
        </div>

        {/* High-Fidelity Product UI Composition */}
        <div className="designer-product-mockup" data-reveal>
          {/* Studio Window Chrome */}
          <div className="mockup-window-header">
            <div className="mockup-window-controls" aria-hidden="true">
              <span className="ctrl-dot red" />
              <span className="ctrl-dot yellow" />
              <span className="ctrl-dot green" />
            </div>

            <div className="mockup-titlebar">
              <span className="studio-brand">MOMENTUS CANVAS</span>
              <span className="studio-divider">/</span>
              <span className="studio-project">amara-luca-wedding-gala.preview</span>
            </div>

            {/* Viewport Switcher Buttons */}
            <div className="mockup-viewport-toggles" role="group" aria-label="Simulated viewport switcher">
              <button
                type="button"
                className={`viewport-btn ${activeViewport === "desktop" ? "is-active" : ""}`}
                onClick={() => setActiveViewport("desktop")}
                title="Desktop Viewport (1440px)"
              >
                <span>🖥️</span> Desktop
              </button>
              <button
                type="button"
                className={`viewport-btn ${activeViewport === "tablet" ? "is-active" : ""}`}
                onClick={() => setActiveViewport("tablet")}
                title="Tablet Viewport (768px)"
              >
                <span>📱</span> Tablet
              </button>
              <button
                type="button"
                className={`viewport-btn ${activeViewport === "mobile" ? "is-active" : ""}`}
                onClick={() => setActiveViewport("mobile")}
                title="Mobile Viewport (390px)"
              >
                <span>📲</span> Mobile
              </button>
            </div>

            <div className="mockup-header-actions">
              <span className="mockup-status-badge">● LIVE PREVIEW</span>
              <Link
                href="/admin/designer/amara-luca"
                className="mockup-open-btn"
                aria-label="Open full Designer Studio demo in admin"
              >
                Open Studio Demo ↗
              </Link>
            </div>
          </div>

          {/* Studio Body Layout */}
          <div className="mockup-studio-body">
            {/* Left Sidebar: Components & Block Palette */}
            <div className="mockup-sidebar-left">
              <div className="sidebar-section-title">ACTIVE SECTIONS</div>
              <div className="mockup-block-item is-selected">
                <span className="block-icon">❖</span>
                <div>
                  <strong>Hero Banner</strong>
                  <small>Botanical Intramuros Title</small>
                </div>
              </div>
              <div className="mockup-block-item">
                <span className="block-icon">▤</span>
                <div>
                  <strong>Schedule & Program</strong>
                  <small>Courtyard Vows & Banquet</small>
                </div>
              </div>
              <div className="mockup-block-item">
                <span className="block-icon">✉</span>
                <div>
                  <strong>RSVP & Guest Survey</strong>
                  <small>Table 07 & Dietary notes</small>
                </div>
              </div>
              <div className="mockup-block-item">
                <span className="block-icon">📷</span>
                <div>
                  <strong>Photo Gallery</strong>
                  <small>Retrospective Album</small>
                </div>
              </div>

              <div className="sidebar-section-title mt-4">AI DESIGN ASSISTANT</div>
              <div className="mockup-ai-panel">
                <p className="ai-prompt-snippet">
                  &ldquo;Harmonize Intramuros twilight lighting with warm candle amber and antique gold serif accents.&rdquo;
                </p>
                <span className="ai-status-pill">✦ Aesthetic Optimized</span>
              </div>
            </div>

            {/* Center Canvas Area (Responsive Simulator) */}
            <div className="mockup-canvas-wrapper">
              <div className={`canvas-viewport-frame viewport-${activeViewport}`}>
                <div className="canvas-site-preview">
                  {/* Real Photo Hero in Canvas */}
                  <div className="canvas-hero-photo-wrap">
                    <Image
                      src="/images/events/wedding-real.jpg"
                      alt="Amara & Luca Courtyard Banquet Preview"
                      width={700}
                      height={280}
                      className="canvas-hero-img"
                    />
                    <div className="canvas-hero-gradient" />
                  </div>

                  <div className="preview-top-strip">
                    <span>SATURDAY · 12 DECEMBER · 2026</span>
                    <span>INTRAMUROS, MANILA</span>
                  </div>
                  <h3 className="preview-hero-title">
                    Amara <em>&</em> Luca
                  </h3>
                  <p className="preview-hero-sub">
                    A celebration of two journeys uniting under candlelit courtyard skies
                  </p>
                  <div className="preview-cta-row">
                    <span className="preview-btn">CONFIRM YOUR ATTENDANCE</span>
                  </div>
                  <div className="preview-roster-preview">
                    <div className="roster-cell">
                      <strong>06:00 PM</strong>
                      <small>Courtyard Vows</small>
                    </div>
                    <div className="roster-cell">
                      <strong>07:30 PM</strong>
                      <small>Seated Dining</small>
                    </div>
                    <div className="roster-cell">
                      <strong>09:30 PM</strong>
                      <small>Live Acoustic</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Style Tokens & Inspector */}
            <div className="mockup-sidebar-right">
              <div className="sidebar-section-title">THEME PALETTE</div>
              <div className="color-swatches-grid">
                <div className="swatch-item">
                  <span className="swatch-circle" style={{ background: "#F6F1E7" }} />
                  <small>Ivory</small>
                </div>
                <div className="swatch-item">
                  <span className="swatch-circle" style={{ background: "#263F35" }} />
                  <small>Forest</small>
                </div>
                <div className="swatch-item">
                  <span className="swatch-circle" style={{ background: "#A66B54" }} />
                  <small>Terracotta</small>
                </div>
                <div className="swatch-item">
                  <span className="swatch-circle" style={{ background: "#B89B6A" }} />
                  <small>Gold</small>
                </div>
              </div>

              <div className="sidebar-section-title mt-4">TYPOGRAPHY</div>
              <div className="mockup-font-select">
                <label>Editorial Title</label>
                <div className="font-pill">Iowan Old Style (Serif)</div>
              </div>
              <div className="mockup-font-select mt-2">
                <label>Body Content</label>
                <div className="font-pill">Aptos (Humanist Sans)</div>
              </div>

              <div className="sidebar-bottom-link mt-6">
                <Link
                  href="/demo/microsites/amara-luca"
                  className="preview-live-link"
                >
                  View Live Microsite Demo ↗
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Bar below mockup */}
        <div className="designer-cta-row" data-reveal>
          <div className="designer-cta-text">
            <strong>Ready to experience the designer?</strong>
            <p>Test the interactive drag-and-drop studio right now in our sandbox environment.</p>
          </div>
          <div className="designer-cta-buttons">
            <Link href="/admin/designer/amara-luca" className="btn-open-studio">
              <span>Open Studio Demo</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/demo/microsites/amara-luca" className="btn-preview-microsite">
              <span>Preview Microsite</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
