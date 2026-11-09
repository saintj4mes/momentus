"use client";

import { useEffect } from "react";

export function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      for (const el of elements) {
        el.classList.add("is-revealed");
      }
      return;
    }

    // Only apply hiding after JS initializes and attaches observer
    document.documentElement.classList.add("js-reveal-enabled");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -20px 0px",
        threshold: 0.05,
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
