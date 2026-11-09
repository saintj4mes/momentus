"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="site-header-redesign" id="top">
      <div className="header-inner">
        <a className="wordmark" href="#top" aria-label="MOMENTUS home">
          <span className="wordmark-symbol" aria-hidden="true">
            m
          </span>
          <span>MOMENTUS</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#events" className="nav-item">
            Events
          </a>
          <a href="#experience" className="nav-item">
            The Experience
          </a>
          <a href="#value" className="nav-item">
            Organizer Value
          </a>
          <a href="#designer" className="nav-item">
            Designer Studio
          </a>
          <a href="#memories" className="nav-item">
            Memories
          </a>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          <Link href="/sign-in" className="header-quiet-link">
            Sign In
          </Link>
          <Link href="/sign-up" className="header-primary-btn">
            <span>Create Your Event</span>
            <span className="btn-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? "bar-1-open" : ""}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? "bar-2-open" : ""}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? "bar-3-open" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
        <div className="mobile-nav-content">
          <div className="mobile-nav-header">
            <span className="wordmark-symbol" aria-hidden="true">
              m
            </span>
            <span className="mobile-nav-brand">MOMENTUS</span>
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="mobile-links" aria-label="Mobile navigation">
            <a
              href="#events"
              className="mobile-link-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="link-roman">I.</span> Events We Bring to Life
            </a>
            <a
              href="#experience"
              className="mobile-link-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="link-roman">II.</span> The MOMENTUS Experience
            </a>
            <a
              href="#value"
              className="mobile-link-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="link-roman">III.</span> Event Management Value
            </a>
            <a
              href="#designer"
              className="mobile-link-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="link-roman">IV.</span> Designer Studio
            </a>
            <a
              href="#memories"
              className="mobile-link-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="link-roman">V.</span> Post-Event Memories
            </a>
          </nav>

          <div className="mobile-drawer-footer">
            <Link
              href="/sign-in"
              className="mobile-secondary-cta"
              onClick={() => setMobileMenuOpen(false)}
            >
              Organizer Sign In
            </Link>
            <Link
              href="/sign-up"
              className="mobile-primary-cta"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Create Your Event</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <p className="mobile-footer-note">VINTAGE EDITORIAL · MODERN EVENT CRAFT</p>
          </div>
        </div>
      </div>
    </header>
  );
}

