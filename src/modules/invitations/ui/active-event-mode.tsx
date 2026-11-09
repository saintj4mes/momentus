import Link from "next/link";
import type { PublicInvitation } from "../queries";

export function ActiveEventMode({ invitation }: { invitation: PublicInvitation }) {
  const albumMode = invitation.guest_mode === "album";
  return (
    <main className={`guest-page active-event-mode${albumMode ? " album-mode" : ""}`}>
      <header className="guest-header">
        <Link className="wordmark" href="/">
          <span aria-hidden="true" className="wordmark-symbol">m</span>
          <span>MOMENTUS</span>
        </Link>
        <span className="guest-private-label">{albumMode ? "POST-EVENT ALBUM" : "MEAL & BOOTH"}</span>
      </header>

      {albumMode ? (
        <section className="live-album-view">
          <p className="eyebrow">A DAY WE WILL ALWAYS REMEMBER</p>
          <h1>You are part of the memorable experience of {invitation.event_name}</h1>
          <div className="live-sde-card">
            <span aria-hidden="true">▶</span>
            <div><small>SAME-DAY EDIT</small><strong>The story of their celebration</strong></div>
          </div>
          <div className="live-album-gallery">
            <h2>Moments from the day</h2>
            <p>The hosts have not published album media yet.</p>
          </div>
        </section>
      ) : (
        <section className="live-meal-booth-view">
          <p className="eyebrow">WELCOME TO THE CELEBRATION</p>
          <h1>{invitation.event_name}</h1>
          <p className="live-mode-intro">Choose your event experience.</p>
          <div className="live-mode-cards">
            <article>
              <span className="eyebrow">MEAL & SOUVENIR</span>
              <h2>Your guest pass</h2>
              <p>Staff will confirm each eligible meal or souvenir claim to prevent duplicate use.</p>
              <span className="live-mode-unavailable">Pass details will appear when event entitlements are configured.</span>
            </article>
            <article>
              <span className="eyebrow">PHOTO BOOTH</span>
              <h2>Save a memory</h2>
              <p>Event photos and videos will be collected for the couple's post-event album.</p>
              <span className="live-mode-unavailable">Booth uploads are not enabled in this local build.</span>
            </article>
          </div>
        </section>
      )}
      <footer className="guest-footer">Made for the moments that matter.</footer>
    </main>
  );
}
