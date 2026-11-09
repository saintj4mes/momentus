"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  defaultEventSettings,
  demoConfigStorageKey,
  type DemoEventSettings,
  type DemoLocalState,
  type DemoMode,
  type DemoRsvp,
  type DemoSite,
} from "../demo-sites";

function readWorkspace(): DemoLocalState {
  try {
    const raw = window.localStorage.getItem(demoConfigStorageKey);
    return raw ? JSON.parse(raw) as DemoLocalState : {};
  } catch {
    window.localStorage.removeItem(demoConfigStorageKey);
    return {};
  }
}

export function DemoMicrosite({ site }: { site: DemoSite }) {
  const [mode, setMode] = useState<DemoMode>(site.mode);
  const [settings, setSettings] = useState<DemoEventSettings>(() => defaultEventSettings(site));
  const [primaryName, setPrimaryName] = useState("");
  const [email, setEmail] = useState("");
  const [companions, setCompanions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const workspace = readWorkspace();
    const savedSettings = workspace.settings?.[site.id] ?? {
      ...defaultEventSettings(site),
      mode: workspace.modes?.[site.id] ?? site.mode,
    };
    setSettings(savedSettings);
    setMode(savedSettings.mode);
    setLoaded(true);
  }, [site]);

  function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (primaryName.trim().length < 2) return;
    const workspace = readWorkspace();
    const record: DemoRsvp = {
      id: crypto.randomUUID(),
      siteId: site.id,
      primaryName: primaryName.trim(),
      email: settings.rsvp.askEmail ? email.trim() : "",
      companions: companions.map((name) => name.trim()).filter(Boolean),
      attendees: [primaryName.trim(), ...companions.map((name) => name.trim()).filter(Boolean)].map((name) => ({ name, table: "", mealNote: "" })),
      createdAt: new Date().toISOString(),
    };
    const next = [...(workspace.rsvps ?? []), record];
    window.localStorage.setItem(demoConfigStorageKey, JSON.stringify({ ...workspace, rsvps: next } satisfies DemoLocalState));
    setSubmitted(true);
  }

  const attendeeCount = companions.filter((name) => name.trim()).length + 1;
  const addCompanion = () => setCompanions((current) => current.length < settings.rsvp.maxPlusOnes ? [...current, ""] : current);

  if (!loaded) return <main className="demo-guest-shell"><p>Opening event experience…</p></main>;

  return (
    <main className={`demo-guest-shell demo-guest-${mode}`}>
      <div className="demo-microsite-preview-bar">
        <span>MOCK EVENT EXPERIENCE <i /></span>
        <Link href="/admin">← Back to event admin</Link>
      </div>
      <header className="demo-guest-header">
        <Link className="wordmark" href={`/event/${site.id}`}><span aria-hidden="true" className="wordmark-symbol">m</span><span>MOMENTUS</span></Link>
        <span>{site.client}</span>
      </header>

      {mode === "rsvp" && <section className="demo-guest-content demo-rsvp-page">
        <div className="demo-guest-event-intro">
          <p className="eyebrow">YOU’RE INVITED</p>
          <div className="demo-microsite-flourish" aria-hidden="true">✳</div>
          <h1>{settings.rsvp.title}</h1>
          <p>{settings.rsvp.intro}</p>
          <div className="demo-guest-event-details"><span>{site.dateLong}</span><span>{site.venue}</span></div>
        </div>
        <section className="demo-guest-form-card">
          {submitted ? <div className="demo-rsvp-thanks"><p className="eyebrow">RESPONSE SAVED</p><h2>We can’t wait to celebrate with you.</h2><p>Your mock RSVP is now visible in the event admin’s guest list.</p></div> : <form onSubmit={submitRsvp}>
            <p className="eyebrow">KINDLY REPLY</p>
            <h2>Who will be joining us?</h2>
            <label className="field-label">Your full name<input autoComplete="name" className="text-field" minLength={2} onChange={(e) => setPrimaryName(e.target.value)} placeholder="First and last name" required value={primaryName} /></label>
            {settings.rsvp.askEmail && <label className="field-label">Email <span className="demo-optional">OPTIONAL</span><input autoComplete="email" className="text-field" onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" value={email} /></label>}
            {companions.map((name, index) => <label className="field-label" key={index}>Guest {index + 2} name<input className="text-field" minLength={2} onChange={(e) => setCompanions((current) => current.map((entry, entryIndex) => entryIndex === index ? e.target.value : entry))} placeholder="Companion’s full name" required value={name} /></label>)}
            {settings.rsvp.allowPlusOne && companions.length < settings.rsvp.maxPlusOnes && <button className="demo-add-guest" onClick={addCompanion} type="button">+ Add a guest</button>}
            <p className="demo-attendee-count">{attendeeCount} guest{attendeeCount === 1 ? "" : "s"} in this response</p>
            <button className="button button-primary demo-submit-rsvp" type="submit">Confirm RSVP</button>
          </form>}
        </section>
      </section>}

      {mode === "meal_booth" && <section className="demo-guest-content demo-live-page">
        <div className="demo-live-intro"><p className="eyebrow">WELCOME TO THE CELEBRATION</p><h1>{site.client}</h1><p>{site.date} · {site.venue}</p><span>YOUR EVENT DAY EXPERIENCE</span></div>
        <div className="demo-live-features">
          {settings.mealBooth.foodStub && <article className="demo-live-feature demo-food-stub"><p className="eyebrow">FOOD STUB</p><h2>{settings.mealBooth.foodLabel}</h2><p>{settings.mealBooth.instructions}</p><div className="demo-pass-ticket"><span>GUEST MEAL</span><strong>1</strong><small>MOCK PASS · STAFF CONFIRMATION REQUIRED</small></div></article>}
          {settings.mealBooth.souvenirClaim && <article className="demo-live-feature"><p className="eyebrow">SOUVENIR</p><h2>Your keepsake claim</h2><p>Show this pass to the event team when you collect your souvenir.</p><div className="demo-pass-ticket souvenir"><span>SOUVENIR CLAIM</span><strong>1</strong><small>MOCK PASS · STAFF CONFIRMATION REQUIRED</small></div></article>}
          {settings.mealBooth.photoBooth && <article className="demo-live-feature demo-photo-booth"><p className="eyebrow">PHOTO BOOTH</p><h2>Save a memory</h2><p>Take a new photo or select event photos and videos to include in the couple’s album.</p><input accept="image/*,video/*" capture="environment" hidden multiple onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []).map((file) => file.name))} ref={fileInput} type="file" /><button className="button button-secondary" onClick={() => fileInput.current?.click()} type="button">Take or choose photos/videos</button>{selectedFiles.length > 0 && <small className="demo-local-selection">{selectedFiles.length} file(s) selected on this device. Mock preview only; nothing uploaded.</small>}</article>}
          {!settings.mealBooth.foodStub && !settings.mealBooth.souvenirClaim && !settings.mealBooth.photoBooth && <p className="demo-empty-state">The event organizer has not enabled any guest features yet.</p>}
        </div>
      </section>}

      {mode === "album" && <section className="demo-guest-content demo-album-experience">
        <div className="demo-album-intro"><p className="eyebrow">A DAY WE WILL ALWAYS REMEMBER</p><h1>{settings.album.headline}</h1><p>{settings.album.message}</p></div>
        <div className="demo-album-film">
          <span aria-hidden="true">▶</span>
          <div><small>SAME-DAY EDIT</small><strong>{settings.album.sdeTitle}</strong></div>
          {settings.album.sdeUrl && <a aria-label="Open the same-day edit video" href={settings.album.sdeUrl} rel="noreferrer" target="_blank">Watch film ↗</a>}
        </div>
        <div className="demo-album-gallery-heading"><h2>{settings.album.galleryTitle}</h2><p>Photos and videos from the celebration</p></div>
        <div className="demo-album-grid" aria-label="Mock event album">
          <div className="demo-album-tile photo-tile"><span>WEDDING MOMENT</span></div><div className="demo-album-tile film-tile"><span>CELEBRATION FILM</span></div><div className="demo-album-tile floral-tile"><span>FLOWERS & DETAILS</span></div><div className="demo-album-tile toast-tile"><span>TOASTS & LAUGHTER</span></div>
        </div>
        <p className="demo-album-disclaimer">These are illustrative mock gallery tiles. Album photos and videos are not stored here.</p>
      </section>}

      <footer className="demo-guest-footer">A celebration made with care <span>·</span> MOMENTUS</footer>
    </main>
  );
}
