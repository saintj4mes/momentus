import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="app-page auth-page">
      <header className="app-header">
        <Link className="wordmark" href="/">
          <span className="wordmark-symbol" aria-hidden="true">
            m
          </span>
          <span>MOMENTUS</span>
        </Link>
        <Link className="quiet-link" href="/">
          Return to the home page
        </Link>
      </header>
      <section className="auth-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </section>
      <p className="auth-footnote">
        Private celebrations, thoughtfully brought together.
      </p>
    </main>
  );
}
