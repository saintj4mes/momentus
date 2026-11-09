"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "@/modules/auth/public";
import {
  defaultEventSettings,
  demoCards,
  demoConfigStorageKey,
  demoSites,
  type DemoCard,
  type DemoEventSettings,
  type DemoLocalState,
  type DemoMode,
  type DemoRsvp,
  type DemoSite,
} from "../demo-sites";

type AdminTab = "overview" | "rsvp" | "meal-booth" | "album" | "guests" | "cards";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "rsvp", label: "RSVP page" },
  { id: "meal-booth", label: "Meal & Booth" },
  { id: "album", label: "Post-event album" },
  { id: "guests", label: "Guest list" },
  { id: "cards", label: "NFC cards" },
];

const modeLabels: Record<DemoMode, string> = {
  rsvp: "RSVP",
  meal_booth: "Meal & Booth",
  album: "Post-event album",
};

function seededSettings() {
  return Object.fromEntries(demoSites.map((site) => [site.id, defaultEventSettings(site)]));
}

export function LocalDemoConsole({ email }: { email: string }) {
  const clients = useMemo(() => [...new Set(demoSites.map((site) => site.client))], []);
  const [client, setClient] = useState(clients[0]);
  const [selectedSiteId, setSelectedSiteId] = useState(demoSites[0].id);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [settings, setSettings] = useState<Record<string, DemoEventSettings>>(seededSettings);
  const [cards, setCards] = useState<DemoCard[]>(demoCards);
  const [rsvps, setRsvps] = useState<DemoRsvp[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cardLabel, setCardLabel] = useState("");
  const [cardInvitation, setCardInvitation] = useState("");

  const clientSites = demoSites.filter((site) => site.client === client);
  const site = demoSites.find((candidate) => candidate.id === selectedSiteId) ?? clientSites[0] ?? demoSites[0];
  const siteSettings = settings[site.id] ?? defaultEventSettings(site);
  const siteGuests = rsvps.filter((rsvp) => rsvp.siteId === site.id);
  const siteCards = cards.filter((card) => card.siteId === site.id);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(demoConfigStorageKey);
      if (raw) {
        const stored = JSON.parse(raw) as DemoLocalState;
        if (stored.settings) setSettings({ ...seededSettings(), ...stored.settings });
        else if (stored.modes) {
          setSettings(Object.fromEntries(demoSites.map((event) => [
            event.id,
            { ...defaultEventSettings(event), mode: stored.modes?.[event.id] ?? event.mode },
          ])));
        }
        if (stored.cards) setCards(stored.cards);
        if (stored.rsvps) setRsvps(stored.rsvps.map((response) => ({
          ...response,
          attendees: response.attendees ?? [response.primaryName, ...(response.companions ?? [])].map((name) => ({ name, table: "", mealNote: "" })),
        })));
      }
    } catch {
      window.localStorage.removeItem(demoConfigStorageKey);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    function syncMockData(event: StorageEvent) {
      if (event.key !== demoConfigStorageKey || !event.newValue) return;
      try {
        const stored = JSON.parse(event.newValue) as DemoLocalState;
        if (stored.settings) setSettings({ ...seededSettings(), ...stored.settings });
        if (stored.cards) setCards(stored.cards);
        if (stored.rsvps) setRsvps(stored.rsvps.map((response) => ({
          ...response,
          attendees: response.attendees ?? [response.primaryName, ...(response.companions ?? [])].map((name) => ({ name, table: "", mealNote: "" })),
        })));
      } catch {
        window.localStorage.removeItem(demoConfigStorageKey);
      }
    }
    window.addEventListener("storage", syncMockData);
    return () => window.removeEventListener("storage", syncMockData);
  }, []);

  function persist(nextSettings = settings, nextCards = cards, nextRsvps = rsvps) {
    window.localStorage.setItem(demoConfigStorageKey, JSON.stringify({
      settings: nextSettings,
      modes: Object.fromEntries(Object.entries(nextSettings).map(([id, value]) => [id, value.mode])),
      cards: nextCards,
      rsvps: nextRsvps,
    } satisfies DemoLocalState));
  }

  function updateSettings(patch: Partial<DemoEventSettings>) {
    const next = { ...settings, [site.id]: { ...siteSettings, ...patch } };
    setSettings(next);
    persist(next);
  }

  function updateSection<K extends "rsvp" | "mealBooth" | "album">(
    section: K,
    patch: Partial<DemoEventSettings[K]>,
  ) {
    updateSettings({ [section]: { ...siteSettings[section], ...patch } } as Partial<DemoEventSettings>);
  }

  function chooseMode(mode: DemoMode) {
    updateSettings({ mode });
  }

  function selectClient(nextClient: string) {
    setClient(nextClient);
    const firstEvent = demoSites.find((event) => event.client === nextClient);
    if (firstEvent) setSelectedSiteId(firstEvent.id);
    setTab("overview");
  }

  function updateGuest(id: string, attendeeIndex: number, patch: { table?: string; mealNote?: string }) {
    const next = rsvps.map((guest) => guest.id === id ? {
      ...guest,
      attendees: guest.attendees.map((attendee, index) => index === attendeeIndex ? { ...attendee, ...patch } : attendee),
    } : guest);
    setRsvps(next);
    persist(settings, cards, next);
  }

  function addCard() {
    if (cardLabel.trim().length < 2 || cardInvitation.trim().length < 2) return;
    const next = [...cards, {
      id: `MN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      label: cardLabel.trim(),
      siteId: site.id,
      invitation: cardInvitation.trim(),
      status: "Active" as const,
    }];
    setCards(next);
    persist(settings, next);
    setCardLabel("");
    setCardInvitation("");
  }

  function changeCard(card: DemoCard, status: "Replaced" | "Revoked") {
    const changed = cards.map((entry) => entry.id === card.id ? { ...entry, status } : entry);
    const next = status === "Replaced"
      ? [...changed, { ...card, id: `MN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: "Active" as const }]
      : changed;
    setCards(next);
    persist(settings, next);
  }

  return (
    <main className="demo-admin-shell event-admin-shell">
      <aside className="demo-sidebar">
        <Link className="wordmark demo-brand" href="/admin"><span aria-hidden="true" className="wordmark-symbol">m</span><span>MOMENTUS</span></Link>
        <div className="demo-nav-label">CLIENTS</div>
        <nav aria-label="Clients" className="demo-sidebar-nav client-sidebar-nav">
          {clients.map((name) => (
            <button aria-current={name === client ? "page" : undefined} className={name === client ? "active" : ""} key={name} onClick={() => selectClient(name)} type="button">
              <span className="demo-client-avatar">{demoSites.find((event) => event.client === name)?.initials}</span>
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="demo-sidebar-bottom"><span className="demo-avatar">MD</span><div><strong>MOMENTUS Demo</strong><small>{email}</small></div></div>
      </aside>

      <section className="demo-admin-content">
        <header className="demo-topbar">
          <div className="demo-breadcrumb">Clients <span>/</span> {client} <span>/</span> {site.event}</div>
          <form action={signOut}><button className="quiet-button" type="submit">Sign out</button></form>
        </header>

        <div className="demo-page-heading">
          <div><p className="eyebrow">CLIENT WORKSPACE</p><h1>{client}</h1><p className="demo-lede">Manage this client’s event, guest experience pages, and attendance.</p></div>
          <div className="demo-environment"><span /> LOCAL MOCK DATA</div>
        </div>

        <section className="demo-client-events">
          <div className="demo-section-heading"><div><h2>Events</h2><p>Choose an event to edit its microsite and guest experience.</p></div><span className="demo-count">{clientSites.length} event{clientSites.length === 1 ? "" : "s"}</span></div>
          <div className="demo-event-picker">
            {clientSites.map((event) => (
              <button aria-pressed={event.id === site.id} className={`demo-event-picker-card${event.id === site.id ? " selected" : ""}`} key={event.id} onClick={() => { setSelectedSiteId(event.id); setTab("overview"); }} type="button">
                <span className="demo-event-picker-main"><strong>{event.event}</strong><small>{event.date} · {event.venue}</small></span>
                <span className={`demo-site-status status-${event.status.toLowerCase().replace(" ", "-")}`}>{event.status}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="demo-event-workspace">
          <div className="demo-event-workspace-heading">
            <div><p className="eyebrow">EVENT MICROSITE</p><h2>{site.event}</h2><p>{site.date} · {site.theme} · {site.venue}</p></div>
            <div className="demo-workspace-actions"><Link className="button button-secondary" href={`/event/${site.id}`} target="_blank">Open guest microsite ↗</Link><Link className="button button-primary" href={`/admin/designer/${site.id}`}>Open Designer Studio</Link></div>
          </div>
          <nav aria-label="Event management" className="demo-event-tabs">
            {tabs.map((item) => <button aria-current={tab === item.id ? "page" : undefined} className={tab === item.id ? "active" : ""} key={item.id} onClick={() => setTab(item.id)} type="button">{item.label}{item.id === "guests" && siteGuests.length > 0 ? <span>{siteGuests.length}</span> : null}</button>)}
          </nav>

          {tab === "overview" && <div className="demo-event-panel">
            <div className="demo-panel-title"><div><h3>Active NFC experience</h3><p>Every linked card opens this event’s active page directly at <code>/event/{site.id}</code>.</p></div><span className="demo-active-mode">{modeLabels[siteSettings.mode]}</span></div>
            <div className="demo-mode-options" role="group" aria-label="Choose active guest experience">
              {(["rsvp", "meal_booth", "album"] as DemoMode[]).map((mode) => {
                const disabled = mode === "album" && site.status !== "Memories";
                return <button aria-pressed={siteSettings.mode === mode} className={`demo-mode-option${siteSettings.mode === mode ? " selected" : ""}`} disabled={disabled} key={mode} onClick={() => chooseMode(mode)} type="button"><span className="demo-mode-radio" aria-hidden="true" /><span><strong>{modeLabels[mode]}</strong><small>{disabled ? "Available after the event" : mode === "rsvp" ? "Collect guest names and responses" : mode === "meal_booth" ? "Meal pass, souvenirs, and photo booth" : "SDE film, photos, and videos"}</small></span></button>;
              })}
            </div>
            <div className="demo-event-shortcuts"><Link href={`/event/${site.id}`} target="_blank">Preview guest page ↗</Link><button onClick={() => setTab("rsvp")} type="button">Customize RSVP</button><button onClick={() => setTab("meal-booth")} type="button">Customize Meal & Booth</button><button onClick={() => setTab("album")} type="button">Customize album</button></div>
            <p className="demo-data-note">This is a local mock workspace. Settings and submitted sample RSVPs are saved in this browser only.</p>
          </div>}

          {tab === "rsvp" && <div className="demo-event-panel">
            <div className="demo-panel-title"><div><h3>Customize the reservation page</h3><p>Guests see this form immediately when RSVP is the active mode.</p></div><Link href={`/event/${site.id}`} target="_blank">Preview page ↗</Link></div>
            <label className="field-label">Page heading<input className="text-field" maxLength={140} onChange={(e) => updateSection("rsvp", { title: e.target.value })} value={siteSettings.rsvp.title} /></label>
            <label className="field-label">Welcome message<textarea className="text-field demo-textarea" maxLength={500} onChange={(e) => updateSection("rsvp", { intro: e.target.value })} value={siteSettings.rsvp.intro} /></label>
            <div className="demo-setting-list">
              <label><span><strong>Ask for email</strong><small>Email stays optional for guests.</small></span><input checked={siteSettings.rsvp.askEmail} onChange={(e) => updateSection("rsvp", { askEmail: e.target.checked })} type="checkbox" /></label>
              <label><span><strong>Allow a plus one</strong><small>Guests can add companion names on the same form.</small></span><input checked={siteSettings.rsvp.allowPlusOne} onChange={(e) => updateSection("rsvp", { allowPlusOne: e.target.checked })} type="checkbox" /></label>
              {siteSettings.rsvp.allowPlusOne && <label className="demo-inline-setting"><span><strong>Maximum companions</strong><small>Set the plus-one allowance for this mock page.</small></span><select className="text-field" onChange={(e) => updateSection("rsvp", { maxPlusOnes: Number(e.target.value) })} value={siteSettings.rsvp.maxPlusOnes}>{[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>}
            </div>
          </div>}

          {tab === "meal-booth" && <div className="demo-event-panel">
            <div className="demo-panel-title"><div><h3>Customize Meal & Booth</h3><p>Choose which features appear together on the guest’s live-event page.</p></div><Link href={`/event/${site.id}`} target="_blank">Preview page ↗</Link></div>
            <label className="field-label">Food stub label<input className="text-field" maxLength={100} onChange={(e) => updateSection("mealBooth", { foodLabel: e.target.value })} value={siteSettings.mealBooth.foodLabel} /></label>
            <label className="field-label">Guest instructions<textarea className="text-field demo-textarea" maxLength={500} onChange={(e) => updateSection("mealBooth", { instructions: e.target.value })} value={siteSettings.mealBooth.instructions} /></label>
            <div className="demo-setting-list">
              <label><span><strong>Food stub</strong><small>Show the guest’s sample meal pass.</small></span><input checked={siteSettings.mealBooth.foodStub} onChange={(e) => updateSection("mealBooth", { foodStub: e.target.checked })} type="checkbox" /></label>
              <label><span><strong>Souvenir claim</strong><small>Show a separate souvenir pickup pass.</small></span><input checked={siteSettings.mealBooth.souvenirClaim} onChange={(e) => updateSection("mealBooth", { souvenirClaim: e.target.checked })} type="checkbox" /></label>
              <label><span><strong>Photo booth</strong><small>Let guests select photos/videos locally in this mock.</small></span><input checked={siteSettings.mealBooth.photoBooth} onChange={(e) => updateSection("mealBooth", { photoBooth: e.target.checked })} type="checkbox" /></label>
            </div>
            <p className="demo-data-note">Real meal and souvenir claims must be confirmed by event staff. Mock selections do not upload media or redeem anything.</p>
          </div>}

          {tab === "album" && <div className="demo-event-panel">
            <div className="demo-panel-title"><div><h3>Customize the post-event album</h3><p>The album itself is the guest page, with no extra navigation button.</p></div><Link href={`/event/${site.id}`} target="_blank">Preview page ↗</Link></div>
            <label className="field-label">Album headline<input className="text-field" maxLength={180} onChange={(e) => updateSection("album", { headline: e.target.value })} value={siteSettings.album.headline} /></label>
            <label className="field-label">Welcome message<textarea className="text-field demo-textarea" maxLength={500} onChange={(e) => updateSection("album", { message: e.target.value })} value={siteSettings.album.message} /></label>
            <label className="field-label">SDE title<input className="text-field" maxLength={140} onChange={(e) => updateSection("album", { sdeTitle: e.target.value })} value={siteSettings.album.sdeTitle} /></label>
            <label className="field-label">SDE video URL<input className="text-field" maxLength={500} onChange={(e) => updateSection("album", { sdeUrl: e.target.value })} placeholder="https://..." type="url" value={siteSettings.album.sdeUrl} /></label>
            <label className="field-label">Gallery heading<input className="text-field" maxLength={140} onChange={(e) => updateSection("album", { galleryTitle: e.target.value })} value={siteSettings.album.galleryTitle} /></label>
          </div>}

          {tab === "guests" && <div className="demo-event-panel">
            <div className="demo-panel-title"><div><h3>RSVPs and guest planning</h3><p>See mock guest responses and organize tables and meal notes.</p></div><span className="demo-active-mode">{siteGuests.length} responses</span></div>
            {siteGuests.length === 0 ? <div className="demo-empty-state">No mock RSVPs yet. Submit one from the event microsite preview.</div> : <div className="demo-guest-list"><div className="demo-guest-head"><span>GUESTS</span><span>EMAIL</span><span>TABLE</span><span>MEAL PLAN</span></div>{siteGuests.flatMap((guest) => guest.attendees.map((attendee, index) => <div className="demo-guest-row" key={`${guest.id}-${index}`}><strong>{attendee.name}<small>{index === 0 ? "Primary guest" : "Companion"}</small></strong><span>{index === 0 ? guest.email || "—" : "—"}</span><input aria-label={`Table for ${attendee.name}`} className="text-field" onChange={(e) => updateGuest(guest.id, index, { table: e.target.value })} placeholder="Table 1" value={attendee.table} /><input aria-label={`Meal note for ${attendee.name}`} className="text-field" onChange={(e) => updateGuest(guest.id, index, { mealNote: e.target.value })} placeholder="Meal selection" value={attendee.mealNote} /></div>))}</div>}
            <p className="demo-data-note">Guest responses, table assignments, and meal notes are mock data saved only in this browser.</p>
          </div>}

          {tab === "cards" && <div className="demo-event-panel">
            <div className="demo-panel-title"><div><h3>NFC cards linked to this event</h3><p>Track which card record is assigned to each private invitation.</p></div><span className="demo-active-mode">{siteCards.filter((card) => card.status === "Active").length} active</span></div>
            <div className="demo-card-form"><label className="field-label">Card label<input className="text-field" onChange={(e) => setCardLabel(e.target.value)} placeholder="e.g. MN-0012" value={cardLabel} /></label><label className="field-label">Invitation label<input className="text-field" onChange={(e) => setCardInvitation(e.target.value)} placeholder="e.g. Santos family" value={cardInvitation} /></label><button className="button button-primary" onClick={addCard} type="button">Link mock card</button></div>
            <div className="demo-card-list">{siteCards.map((card) => <div className="demo-card-list-row" key={card.id}><strong>{card.label ?? card.id}</strong><span>{card.invitation}</span><span className={`demo-card-status ${card.status.toLowerCase()}`}>{card.status}</span>{card.status === "Active" && <div><button onClick={() => changeCard(card, "Replaced")} type="button">Replace</button><button onClick={() => changeCard(card, "Revoked")} type="button">Revoke</button></div>}</div>)}</div>
            <p className="demo-data-note">Mock card links are labels only; this demo does not program or resolve physical NFC tags.</p>
          </div>}
        </section>
        {!loaded && <p aria-live="polite" className="demo-data-note">Loading this browser’s local mock workspace…</p>}
      </section>
    </main>
  );
}
