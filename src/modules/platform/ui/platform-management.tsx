"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoSites } from "../demo-sites";
import {
  type DemoClient,
  type DemoEvent,
  type DemoPlatformState,
  type DemoRegistration,
  defaultRegistrationConfig,
  type EventServices,
  type EventStage,
  emptyServices,
  eventTypes,
  initialOnboardingDraft,
  isRegistrationQuestionVisible,
  lifecycleLabels,
  platformManagementStorageKey,
  type RegistrationConfig,
  type RegistrationQuestion,
  seedPlatformState,
  serviceLabels,
  validateRegistrationAnswers,
  validateRegistrationConfig,
} from "../management";

type View = "clients" | "events" | "onboarding";
const stages: EventStage[] = [
  "draft",
  "planning",
  "registration_open",
  "registration_closed",
  "live",
  "completed",
  "archived",
];
const stagesForDesigner = ["before", "during", "after"] as const;
const selectedEventStorageKey = `${platformManagementStorageKey}:selected-event`;

function id(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export function PlatformManagement({
  email,
  view = "clients",
  eventId,
}: {
  email: string;
  view?: View;
  eventId?: string;
}) {
  const seeded = useMemo(
    () =>
      seedPlatformState(
        demoSites.map((site) => ({ ...site, status: site.status })),
      ),
    [],
  );
  const [data, setData] = useState<DemoPlatformState>(seeded);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [selectedEventId, setSelectedEventId] = useState(eventId ?? "");
  const [message, setMessage] = useState("");
  const [questionLabel, setQuestionLabel] = useState("");
  const [questionOptionsDrafts, setQuestionOptionsDrafts] = useState<
    Record<string, string>
  >({});
  const [guestSearch, setGuestSearch] = useState("");
  const [guestStatus, setGuestStatus] = useState("all");
  const [previewAnswers, setPreviewAnswers] = useState<
    Record<string, string | string[] | boolean>
  >({});
  const [previewName, setPreviewName] = useState("");
  const [previewEmail, setPreviewEmail] = useState("");
  const [previewCompanions, setPreviewCompanions] = useState<
    Array<{
      id: string;
      name: string;
      attendance: "attending" | "declined" | "undecided";
    }>
  >([]);
  const [onboarding, setOnboarding] = useState(initialOnboardingDraft);
  const [newClient, setNewClient] = useState({
    name: "",
    category: "",
    primaryContact: "",
    email: "",
    phone: "",
    organizationDetails: "",
    notes: "",
  });
  const [newEvent, setNewEvent] = useState({
    clientId: "",
    name: "",
    type: "wedding" as DemoEvent["type"],
    date: "",
    venue: "",
    capacity: 100,
    services: emptyServices(),
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(platformManagementStorageKey);
      const savedEventId = localStorage.getItem(selectedEventStorageKey);
      if (savedEventId) setSelectedEventId(savedEventId);
      if (raw) {
        const saved = JSON.parse(raw) as DemoPlatformState;
        setData({ ...seeded, ...saved });
        setOnboarding(saved.onboarding ?? initialOnboardingDraft());
      }
    } catch {
      localStorage.removeItem(platformManagementStorageKey);
    }
    setLoaded(true);
  }, [seeded]);

  useEffect(() => {
    if (loaded)
      localStorage.setItem(platformManagementStorageKey, JSON.stringify(data));
  }, [data, loaded]);

  const activeEvent =
    data.events.find((event) => event.id === (selectedEventId || eventId)) ??
    data.events[0];
  const activeConfig = activeEvent
    ? (data.registrationConfigs[activeEvent.id] ??
      defaultRegistrationConfig(activeEvent))
    : null;
  const filteredClients = data.clients.filter((client) => {
    const matchesQuery =
      `${client.name} ${client.email} ${client.primaryContact} ${client.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery && (clientFilter === "all" || client.status === clientFilter)
    );
  });
  const eventRegistrations = activeEvent
    ? data.registrations.filter((entry) => entry.eventId === activeEvent.id)
    : [];
  const visibleLocalRegistrations = eventRegistrations.filter(
    (registration) =>
      (registration.primaryName
        .toLowerCase()
        .includes(guestSearch.toLowerCase()) ||
        registration.email.toLowerCase().includes(guestSearch.toLowerCase())) &&
      (guestStatus === "all" ||
        (registration.status ?? "confirmed") === guestStatus),
  );

  function update(patch: Partial<DemoPlatformState>) {
    setData((current) => ({ ...current, ...patch }));
    setMessage("Saved in this browser");
  }
  function saveClient() {
    if (!newClient.name.trim()) return setMessage("Enter a client name first.");
    const client: DemoClient = {
      ...newClient,
      id: id("client"),
      status: "active",
      createdAt: new Date().toISOString(),
      authorizedEmails: newClient.email ? [newClient.email.toLowerCase()] : [],
    };
    update({ clients: [...data.clients, client] });
    setNewClient({
      name: "",
      category: "",
      primaryContact: "",
      email: "",
      phone: "",
      organizationDetails: "",
      notes: "",
    });
  }
  function createEvent(clientId: string, eventInput = newEvent) {
    if (!clientId || !eventInput.name.trim())
      return setMessage("Choose a client and enter an event name.");
    const client = data.clients.find((entry) => entry.id === clientId);
    if (!client) return setMessage("Select an existing client.");
    const event: DemoEvent = {
      id: id("event"),
      clientId,
      name: eventInput.name.trim(),
      type: eventInput.type,
      description: "",
      date: eventInput.date,
      timezone: "Asia/Manila",
      venue: eventInput.venue,
      capacity: Number(eventInput.capacity) || 100,
      stage: "planning",
      organizer: client.name,
      services: { ...eventInput.services },
    };
    update({
      events: [...data.events, event],
      registrationConfigs: {
        ...data.registrationConfigs,
        [event.id]: defaultRegistrationConfig(event),
      },
      entitlements: event.services.entitlements
        ? [
            ...data.entitlements,
            {
              id: id("entitlement"),
              eventId: event.id,
              name: "General pass",
              category: "Admission",
              quantity: 1,
              station: "Admission",
              enabled: true,
            },
          ]
        : data.entitlements,
    });
    setSelectedEventId(event.id);
    localStorage.setItem(selectedEventStorageKey, event.id);
    setNewEvent({
      clientId,
      name: "",
      type: event.type,
      date: "",
      venue: "",
      capacity: 100,
      services: emptyServices(),
    });
  }
  function saveOnboarding() {
    const client: DemoClient = {
      id: id("client"),
      name: onboarding.clientName.trim(),
      category: onboarding.category,
      primaryContact: onboarding.primaryContact,
      email: onboarding.email,
      phone: onboarding.phone,
      organizationDetails: onboarding.organizationDetails,
      status: "active",
      notes: "Created from the local onboarding checklist.",
      createdAt: new Date().toISOString(),
      authorizedEmails: onboarding.email
        ? [onboarding.email.toLowerCase()]
        : [],
    };
    if (!client.name) return setMessage("Client name is required.");
    const nextClients = [...data.clients, client];
    const nextData = { ...data, clients: nextClients, onboarding: null };
    setData(nextData);
    if (onboarding.createFirstEvent && onboarding.eventName.trim()) {
      const eventInput = {
        clientId: client.id,
        name: onboarding.eventName,
        type: onboarding.eventType,
        date: onboarding.eventDate,
        venue: onboarding.venue,
        capacity: onboarding.capacity,
        services: onboarding.services,
      };
      setData({ ...nextData });
      const event: DemoEvent = {
        id: id("event"),
        clientId: client.id,
        name: eventInput.name.trim(),
        type: eventInput.type,
        description: "",
        date: eventInput.date,
        timezone: "Asia/Manila",
        venue: eventInput.venue,
        capacity: eventInput.capacity,
        stage: "planning",
        organizer: client.name,
        services: eventInput.services,
      };
      setData((current) => ({
        ...current,
        events: [...current.events, event],
        registrationConfigs: {
          ...current.registrationConfigs,
          [event.id]: defaultRegistrationConfig(event),
        },
      }));
      setSelectedEventId(event.id);
      localStorage.setItem(selectedEventStorageKey, event.id);
    }
    setOnboarding(initialOnboardingDraft());
    setMessage("Client onboarding saved in this browser.");
  }
  function setConfig(next: RegistrationConfig) {
    if (!activeEvent) return;
    const errors = validateRegistrationConfig(next);
    if (errors.length) return setMessage(errors[0]);
    update({
      registrationConfigs: {
        ...data.registrationConfigs,
        [activeEvent.id]: next,
      },
    });
  }
  function updateService(key: keyof EventServices, value: boolean) {
    if (!activeEvent) return;
    const events = data.events.map((event) =>
      event.id === activeEvent.id
        ? { ...event, services: { ...event.services, [key]: value } }
        : event,
    );
    update({ events });
  }
  function addQuestion() {
    if (!activeConfig || !questionLabel.trim()) return;
    const question: RegistrationQuestion = {
      id: id("question"),
      label: questionLabel.trim(),
      type: "short_text",
      required: false,
      options: [],
    };
    setConfig({
      ...activeConfig,
      questions: [...activeConfig.questions, question],
    });
    setQuestionLabel("");
  }
  function submitPreview() {
    if (!activeEvent || !activeConfig) return;
    const definitionErrors = validateRegistrationConfig(activeConfig);
    if (definitionErrors.length) return setMessage(definitionErrors[0]);
    const errors = validateRegistrationAnswers(activeConfig, previewAnswers);
    if (!previewName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(previewEmail))
      errors.unshift("Enter a name and valid email.");
    if (errors.length) return setMessage(errors[0]);
    const now = Date.now();
    if (activeConfig.opensAt && now < new Date(activeConfig.opensAt).getTime())
      return setMessage("Local registration has not opened yet.");
    if (
      activeConfig.closesAt &&
      now > new Date(activeConfig.closesAt).getTime()
    )
      return setMessage("Local registration is closed.");
    if (
      previewCompanions.length > activeConfig.companionAllowance ||
      previewCompanions.some((person) => !person.name.trim())
    )
      return setMessage(
        "Complete each companion name within the configured allowance.",
      );
    if (
      data.registrations.some(
        (registration) =>
          registration.eventId === activeEvent.id &&
          registration.email.toLowerCase() ===
            previewEmail.trim().toLowerCase(),
      )
    )
      return setMessage(
        "This email already has a local registration for this event.",
      );
    const alreadyAttending = data.registrations
      .filter(
        (registration) =>
          registration.eventId === activeEvent.id &&
          (registration.status === "confirmed" || !registration.status),
      )
      .flatMap((registration) => registration.attendees)
      .filter((attendee) => attendee.attendance === "attending").length;
    const attendanceValue = String(
      previewAnswers.attendance ?? "Attending",
    ).toLowerCase();
    const attendance: "attending" | "declined" | "undecided" =
      attendanceValue.startsWith("declin")
        ? "declined"
        : attendanceValue.startsWith("undec")
          ? "undecided"
          : "attending";
    const attendees = [
      { name: previewName.trim(), attendance },
      ...previewCompanions.map((person) => ({
        name: person.name.trim(),
        attendance: person.attendance,
      })),
    ];
    const requestedPlaces = attendees.filter(
      (person) => person.attendance === "attending",
    ).length;
    const visibleAnswers = Object.fromEntries(
      activeConfig.questions
        .filter((question) =>
          isRegistrationQuestionVisible(question, previewAnswers),
        )
        .filter((question) => previewAnswers[question.id] !== undefined)
        .map((question) => [question.id, previewAnswers[question.id]]),
    );
    const atCapacity =
      alreadyAttending + requestedPlaces > activeConfig.capacity;
    if (atCapacity && !activeConfig.waitlistEnabled)
      return setMessage("The local registration capacity has been reached.");
    const registrationStatus =
      requestedPlaces === 0
        ? ("declined" as const)
        : atCapacity
          ? ("waitlisted" as const)
          : activeConfig.mode === "approval"
            ? ("pending" as const)
            : ("confirmed" as const);
    const registration = {
      id: id("registration"),
      eventId: activeEvent.id,
      primaryName: previewName.trim(),
      email: previewEmail.trim(),
      attendees,
      answers: visibleAnswers,
      createdAt: new Date().toISOString(),
      status: registrationStatus,
      statusHistory: [
        {
          id: id("history"),
          status: registrationStatus,
          at: new Date().toISOString(),
          actor: "local-demo" as const,
        },
      ],
    };
    update({ registrations: [...data.registrations, registration] });
    setMessage(
      registrationStatus === "waitlisted"
        ? "You are on the local demo waitlist."
        : registrationStatus === "pending"
          ? "Your local demo response is awaiting approval."
          : registrationStatus === "declined"
            ? "Your local demo response has been recorded."
            : activeConfig.confirmationMessage,
    );
    setPreviewName("");
    setPreviewEmail("");
    setPreviewCompanions([]);
    setPreviewAnswers({});
  }

  function transitionLocalRegistration(
    registrationId: string,
    nextStatus: NonNullable<DemoRegistration["status"]>,
  ) {
    if (!activeEvent) return;
    const target = eventRegistrations.find(
      (registration) => registration.id === registrationId,
    );
    if (!target) return;
    const currentStatus = target.status ?? "confirmed";
    const allowedTransitions: Record<string, string[]> = {
      pending: ["confirmed", "declined", "cancelled"],
      waitlisted: ["confirmed", "declined", "cancelled"],
      confirmed: ["cancelled"],
      declined: ["cancelled"],
      cancelled: [],
    };
    if (!allowedTransitions[currentStatus]?.includes(nextStatus))
      return setMessage(
        `Cannot move a ${currentStatus} response to ${nextStatus}.`,
      );
    if (nextStatus === "confirmed") {
      const alreadyAttending = eventRegistrations
        .filter(
          (registration) =>
            registration.id !== registrationId &&
            (registration.status === "confirmed" || !registration.status),
        )
        .flatMap((registration) => registration.attendees)
        .filter((person) => person.attendance === "attending").length;
      const requested = target.attendees.filter(
        (person) => person.attendance === "attending",
      ).length;
      if (
        alreadyAttending + requested >
        (activeConfig?.capacity ?? activeEvent.capacity)
      )
        return setMessage(
          "There is not enough local demo capacity to confirm this group.",
        );
    }
    const at = new Date().toISOString();
    update({
      registrations: data.registrations.map((registration) =>
        registration.id === registrationId
          ? {
              ...registration,
              status: nextStatus,
              statusHistory: [
                ...(registration.statusHistory ?? [
                  {
                    id: "initial",
                    status: currentStatus,
                    at: registration.createdAt,
                    actor: "local-demo" as const,
                  },
                ]),
                {
                  id: id("history"),
                  status: nextStatus,
                  at,
                  actor: "local-demo" as const,
                },
              ],
            }
          : registration,
      ),
    });
  }

  if (!loaded)
    return (
      <main className="platform-management">
        <p>Loading local workspace…</p>
      </main>
    );
  return (
    <main className="platform-management">
      <header className="platform-management-head">
        <div>
          <Link href="/admin" className="platform-back">
            ← MOMENTUS Studio
          </Link>
          <p className="eyebrow">LOCAL PLATFORM WORKSPACE</p>
          <h1>
            {view === "onboarding"
              ? "Client onboarding"
              : view === "events"
                ? "Event workspace"
                : "Clients & events"}
          </h1>
          <p>
            Signed in as {email}. This workspace stores synthetic records in
            this browser only.
          </p>
        </div>
        <nav aria-label="Platform workspace">
          <Link href="/admin/clients">Clients</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/onboarding">Onboarding</Link>
        </nav>
      </header>
      {message && (
        <p className="platform-message" role="status">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </p>
      )}
      {view === "onboarding" && (
        <section className="platform-panel">
          <p className="eyebrow">
            STEP {onboarding.step} OF 3 · LOCAL CHECKLIST
          </p>
          <h2>
            {
              ["Client details", "First event", "Review & save"][
                Math.min(onboarding.step - 1, 2)
              ]
            }
          </h2>
          {onboarding.step === 1 && (
            <div className="platform-form-grid">
              <label>
                Client or organization name
                <input
                  value={onboarding.clientName}
                  onChange={(e) =>
                    setOnboarding({ ...onboarding, clientName: e.target.value })
                  }
                />
              </label>
              <label>
                Client category
                <input
                  value={onboarding.category}
                  onChange={(e) =>
                    setOnboarding({ ...onboarding, category: e.target.value })
                  }
                  placeholder="Couple, company, community…"
                />
              </label>
              <label>
                Primary contact
                <input
                  value={onboarding.primaryContact}
                  onChange={(e) =>
                    setOnboarding({
                      ...onboarding,
                      primaryContact: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Contact email
                <input
                  type="email"
                  value={onboarding.email}
                  onChange={(e) =>
                    setOnboarding({ ...onboarding, email: e.target.value })
                  }
                />
              </label>
              <label>
                Phone
                <input
                  value={onboarding.phone}
                  onChange={(e) =>
                    setOnboarding({ ...onboarding, phone: e.target.value })
                  }
                />
              </label>
              <label>
                Organization details
                <input
                  value={onboarding.organizationDetails}
                  onChange={(e) =>
                    setOnboarding({
                      ...onboarding,
                      organizationDetails: e.target.value,
                    })
                  }
                />
              </label>
            </div>
          )}
          {onboarding.step === 2 && (
            <>
              <label className="platform-check">
                <input
                  type="checkbox"
                  checked={onboarding.createFirstEvent}
                  onChange={(e) =>
                    setOnboarding({
                      ...onboarding,
                      createFirstEvent: e.target.checked,
                    })
                  }
                />{" "}
                Create the first event now
              </label>
              {onboarding.createFirstEvent && (
                <div className="platform-form-grid">
                  <label>
                    Event name
                    <input
                      value={onboarding.eventName}
                      onChange={(e) =>
                        setOnboarding({
                          ...onboarding,
                          eventName: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Event type
                    <select
                      value={onboarding.eventType}
                      onChange={(e) =>
                        setOnboarding({
                          ...onboarding,
                          eventType: e.target
                            .value as typeof onboarding.eventType,
                        })
                      }
                    >
                      {eventTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={onboarding.eventDate}
                      onChange={(e) =>
                        setOnboarding({
                          ...onboarding,
                          eventDate: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Venue
                    <input
                      value={onboarding.venue}
                      onChange={(e) =>
                        setOnboarding({ ...onboarding, venue: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Capacity
                    <input
                      type="number"
                      min="1"
                      value={onboarding.capacity}
                      onChange={(e) =>
                        setOnboarding({
                          ...onboarding,
                          capacity: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <div className="platform-service-list">
                    {Object.entries(serviceLabels).map(([key, label]) => (
                      <label className="platform-check" key={key}>
                        <input
                          type="checkbox"
                          checked={
                            onboarding.services[key as keyof EventServices]
                          }
                          onChange={(e) =>
                            setOnboarding({
                              ...onboarding,
                              services: {
                                ...onboarding.services,
                                [key]: e.target.checked,
                              },
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {onboarding.step === 3 && (
            <div className="platform-summary">
              <p>
                <strong>{onboarding.clientName || "Unnamed client"}</strong> ·{" "}
                {onboarding.category || "No category"}
              </p>
              <p>
                {onboarding.createFirstEvent
                  ? `${onboarding.eventName || "First event"} · ${eventTypes.find((item) => item.id === onboarding.eventType)?.label}`
                  : "Client only; event can be added later."}
              </p>
              <p>Records are synthetic and local to this browser.</p>
            </div>
          )}
          <div className="platform-actions">
            <button
              type="button"
              className="platform-button quiet"
              disabled={onboarding.step === 1}
              onClick={() =>
                setOnboarding({ ...onboarding, step: onboarding.step - 1 })
              }
            >
              Back
            </button>
            {onboarding.step < 3 ? (
              <button
                type="button"
                className="platform-button"
                onClick={() => {
                  if (onboarding.step === 1 && !onboarding.clientName.trim())
                    return setMessage(
                      "Client name is required before continuing.",
                    );
                  setOnboarding({ ...onboarding, step: onboarding.step + 1 });
                  update({
                    onboarding: { ...onboarding, step: onboarding.step + 1 },
                  });
                }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="platform-button"
                onClick={saveOnboarding}
              >
                Save onboarding
              </button>
            )}
          </div>
        </section>
      )}
      {view === "clients" && (
        <div className="platform-columns">
          <section className="platform-panel">
            <div className="platform-toolbar">
              <h2>Client directory</h2>
              <select
                aria-label="Filter clients"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All clients</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <input
              className="platform-search"
              aria-label="Search clients"
              placeholder="Search clients…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="platform-record-list">
              {filteredClients.map((client) => (
                <article key={client.id}>
                  <div>
                    <strong>{client.name}</strong>
                    <small>
                      {client.category || "Uncategorized"} ·{" "}
                      {client.primaryContact || client.email || "No contact"}
                    </small>
                  </div>
                  <span>
                    {
                      data.events.filter(
                        (event) => event.clientId === client.id,
                      ).length
                    }{" "}
                    events
                  </span>
                  <button
                    type="button"
                    className="platform-button quiet"
                    onClick={() =>
                      update({
                        clients: data.clients.map((entry) =>
                          entry.id === client.id
                            ? {
                                ...entry,
                                status:
                                  entry.status === "active"
                                    ? "archived"
                                    : "active",
                              }
                            : entry,
                        ),
                      })
                    }
                  >
                    {client.status === "active" ? "Archive" : "Restore"}
                  </button>
                </article>
              ))}
              {!filteredClients.length && <p>No clients match this search.</p>}
            </div>
          </section>
          <section className="platform-panel">
            <h2>Add client</h2>
            <div className="platform-form-grid one">
              <label>
                Client name
                <input
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
              </label>
              <label>
                Category
                <input
                  value={newClient.category}
                  onChange={(e) =>
                    setNewClient({ ...newClient, category: e.target.value })
                  }
                />
              </label>
              <label>
                Primary contact
                <input
                  value={newClient.primaryContact}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      primaryContact: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                />
              </label>
              <label>
                Phone
                <input
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                />
              </label>
              <label>
                Organization details
                <input
                  value={newClient.organizationDetails}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      organizationDetails: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <button
              className="platform-button"
              type="button"
              onClick={saveClient}
            >
              Save client
            </button>
          </section>
        </div>
      )}
      {view === "events" && (
        <>
          <section className="platform-panel">
            <div className="platform-toolbar">
              <div>
                <p className="eyebrow">EVENTS ARE INDEPENDENT EXPERIENCES</p>
                <h2>Event directory</h2>
              </div>
              <select
                aria-label="Select event"
                value={activeEvent?.id ?? ""}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  localStorage.setItem(selectedEventStorageKey, e.target.value);
                  setPreviewAnswers({});
                }}
              >
                <option value="" disabled>
                  Choose event
                </option>
                {data.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ·{" "}
                    {
                      data.clients.find(
                        (client) => client.id === event.clientId,
                      )?.name
                    }
                  </option>
                ))}
              </select>
            </div>
            <div className="platform-record-list">
              {data.events.map((event) => (
                <article key={event.id}>
                  <div>
                    <strong>{event.name}</strong>
                    <small>
                      {
                        data.clients.find(
                          (client) => client.id === event.clientId,
                        )?.name
                      }{" "}
                      ·{" "}
                      {eventTypes.find((type) => type.id === event.type)?.label}{" "}
                      · {event.date || "Date not set"}
                    </small>
                  </div>
                  <span>{lifecycleLabels[event.stage]}</span>
                  <button
                    type="button"
                    className="platform-button quiet"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      localStorage.setItem(selectedEventStorageKey, event.id);
                    }}
                  >
                    Manage
                  </button>
                </article>
              ))}
            </div>
          </section>
          <div className="platform-columns">
            <section className="platform-panel">
              <h2>Create an event</h2>
              <div className="platform-form-grid">
                <label>
                  Client
                  <select
                    value={newEvent.clientId}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, clientId: e.target.value })
                    }
                  >
                    <option value="">Choose client</option>
                    {data.clients
                      .filter((c) => c.status === "active")
                      .map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Event name
                  <input
                    value={newEvent.name}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Event type
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        type: e.target.value as DemoEvent["type"],
                      })
                    }
                  >
                    {eventTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                  />
                </label>
                <label>
                  Venue
                  <input
                    value={newEvent.venue}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, venue: e.target.value })
                    }
                  />
                </label>
                <label>
                  Capacity
                  <input
                    type="number"
                    min="1"
                    value={newEvent.capacity}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        capacity: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="platform-service-list">
                {Object.entries(serviceLabels).map(([key, label]) => (
                  <label className="platform-check" key={key}>
                    <input
                      type="checkbox"
                      checked={newEvent.services[key as keyof EventServices]}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          services: {
                            ...newEvent.services,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="platform-button"
                onClick={() => createEvent(newEvent.clientId)}
              >
                Create event
              </button>
            </section>
            {activeEvent && (
              <section className="platform-panel">
                <div className="platform-toolbar">
                  <div>
                    <p className="eyebrow">EVENT CONFIGURATION</p>
                    <h2>{activeEvent.name}</h2>
                  </div>
                  <select
                    aria-label="Event lifecycle"
                    value={activeEvent.stage}
                    onChange={(e) =>
                      update({
                        events: data.events.map((event) =>
                          event.id === activeEvent.id
                            ? { ...event, stage: e.target.value as EventStage }
                            : event,
                        ),
                      })
                    }
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {lifecycleLabels[stage]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="platform-service-list">
                  {Object.entries(serviceLabels).map(([key, label]) => (
                    <label className="platform-check" key={key}>
                      <input
                        type="checkbox"
                        checked={
                          activeEvent.services[key as keyof EventServices]
                        }
                        onChange={(e) =>
                          updateService(
                            key as keyof EventServices,
                            e.target.checked,
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="platform-note">
                  Service selection is independent from event lifecycle.
                </p>
                <div className="platform-stage-links">
                  {stagesForDesigner.map((stage) => (
                    <Link
                      className="platform-button quiet"
                      key={stage}
                      href={`/admin/designer/${activeEvent.id}?experience=${stage}&type=${activeEvent.type}`}
                    >
                      Design {stage}
                    </Link>
                  ))}
                </div>
                <p className="platform-note">
                  {eventRegistrations.length} synthetic registrations · capacity{" "}
                  {activeEvent.capacity}
                </p>
              </section>
            )}
          </div>
          {activeEvent && activeConfig && activeEvent.services.registration && (
            <div className="platform-columns">
              <section className="platform-panel">
                <p className="eyebrow">REGISTRATION CONFIGURATION</p>
                <h2>Questions & policy</h2>
                <div className="platform-form-grid">
                  <label>
                    Registration mode
                    <select
                      value={activeConfig.mode}
                      onChange={(e) =>
                        setConfig({
                          ...activeConfig,
                          mode: e.target.value as RegistrationConfig["mode"],
                        })
                      }
                    >
                      <option value="private_invitation">
                        Private invitation
                      </option>
                      <option value="open">Open registration</option>
                      <option value="approval">Approval required</option>
                      <option value="ticket_placeholder">
                        Ticketing placeholder
                      </option>
                    </select>
                  </label>
                  <label>
                    Companion allowance
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={activeConfig.companionAllowance}
                      onChange={(e) =>
                        setConfig({
                          ...activeConfig,
                          companionAllowance: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Opens
                    <input
                      type="datetime-local"
                      value={activeConfig.opensAt}
                      onChange={(e) =>
                        setConfig({ ...activeConfig, opensAt: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Closes
                    <input
                      type="datetime-local"
                      value={activeConfig.closesAt}
                      onChange={(e) =>
                        setConfig({ ...activeConfig, closesAt: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  Confirmation message
                  <textarea
                    value={activeConfig.confirmationMessage}
                    maxLength={500}
                    onChange={(e) =>
                      setConfig({
                        ...activeConfig,
                        confirmationMessage: e.target.value,
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="platform-button quiet"
                  onClick={() => {
                    const errors = validateRegistrationConfig(activeConfig);
                    if (errors.length) return setMessage(errors[0]);
                    update({
                      registrationConfigs: {
                        ...data.registrationConfigs,
                        [activeEvent.id]: activeConfig,
                      },
                    });
                    setMessage("RSVP configuration saved in this browser.");
                  }}
                >
                  Save RSVP configuration
                </button>
                <h3>Questions</h3>
                <div className="platform-question-list">
                  {activeConfig.questions.map((question, questionIndex) => (
                    <div className="platform-question" key={question.id}>
                      <input
                        value={question.label}
                        aria-label={`Question ${question.label}`}
                        onChange={(e) =>
                          setConfig({
                            ...activeConfig,
                            questions: activeConfig.questions.map((q) =>
                              q.id === question.id
                                ? { ...q, label: e.target.value }
                                : q,
                            ),
                          })
                        }
                      />
                      <select
                        aria-label={`Type for ${question.label}`}
                        value={question.type}
                        onChange={(e) =>
                          (() => {
                            const type = e.target
                              .value as RegistrationQuestion["type"];
                            setConfig({
                              ...activeConfig,
                              questions: activeConfig.questions.map((q) =>
                                q.id === question.id
                                  ? {
                                      ...q,
                                      type,
                                      options:
                                        (type === "single_select" ||
                                          type === "radio" ||
                                          type === "multi_select") &&
                                        q.options.length === 0
                                          ? ["Option 1", "Option 2"]
                                          : q.options,
                                    }
                                  : q,
                              ),
                            });
                          })()
                        }
                      >
                        <option value="short_text">Short text</option>
                        <option value="long_text">Long text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="number">Number</option>
                        <option value="single_select">Single select</option>
                        <option value="radio">Radio</option>
                        <option value="multi_select">Multi select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="consent">Consent</option>
                      </select>
                      {(question.type === "single_select" ||
                        question.type === "radio" ||
                        question.type === "multi_select") && (
                        <input
                          aria-label={`Options for ${question.label}`}
                          value={
                            questionOptionsDrafts[question.id] ??
                            question.options.join(", ")
                          }
                          onChange={(e) =>
                            setQuestionOptionsDrafts({
                              ...questionOptionsDrafts,
                              [question.id]: e.target.value,
                            })
                          }
                          onBlur={() => {
                            const values = (
                              questionOptionsDrafts[question.id] ??
                              question.options.join(", ")
                            )
                              .split(",")
                              .map((option) => option.trim())
                              .filter(Boolean);
                            if (values.length) {
                              setConfig({
                                ...activeConfig,
                                questions: activeConfig.questions.map((q) =>
                                  q.id === question.id
                                    ? { ...q, options: values }
                                    : q,
                                ),
                              });
                              setQuestionOptionsDrafts({
                                ...questionOptionsDrafts,
                                [question.id]: values.join(", "),
                              });
                            }
                          }}
                        />
                      )}
                      <select
                        aria-label={`Conditional parent for ${question.label}`}
                        value={question.conditionalOn?.questionId ?? ""}
                        onChange={(e) => {
                          const parent = activeConfig.questions.find(
                            (item) => item.id === e.target.value,
                          );
                          setConfig({
                            ...activeConfig,
                            questions: activeConfig.questions.map((item) =>
                              item.id === question.id
                                ? {
                                    ...item,
                                    conditionalOn: parent
                                      ? {
                                          questionId: parent.id,
                                          value:
                                            item.conditionalOn?.value ??
                                            parent.options[0] ??
                                            "yes",
                                        }
                                      : undefined,
                                  }
                                : item,
                            ),
                          });
                        }}
                      >
                        <option value="">Always show</option>
                        {activeConfig.questions
                          .slice(0, questionIndex)
                          .map((parent) => (
                            <option key={parent.id} value={parent.id}>
                              When {parent.label} matches…
                            </option>
                          ))}
                      </select>
                      {question.conditionalOn && (
                        <input
                          aria-label={`Condition value for ${question.label}`}
                          value={question.conditionalOn.value}
                          onChange={(e) =>
                            setConfig({
                              ...activeConfig,
                              questions: activeConfig.questions.map((item) =>
                                item.id === question.id && item.conditionalOn
                                  ? {
                                      ...item,
                                      conditionalOn: {
                                        ...item.conditionalOn,
                                        value: e.target.value,
                                      },
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                      )}
                      <label className="platform-check">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) =>
                            setConfig({
                              ...activeConfig,
                              questions: activeConfig.questions.map((q) =>
                                q.id === question.id
                                  ? { ...q, required: e.target.checked }
                                  : q,
                              ),
                            })
                          }
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        className="platform-button quiet"
                        aria-label={`Move ${question.label} up`}
                        disabled={questionIndex === 0}
                        onClick={() => {
                          if (questionIndex === 0) return;
                          const questions = [...activeConfig.questions];
                          [
                            questions[questionIndex - 1],
                            questions[questionIndex],
                          ] = [
                            questions[questionIndex],
                            questions[questionIndex - 1],
                          ];
                          setConfig({ ...activeConfig, questions });
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="platform-button quiet"
                        onClick={() =>
                          setConfig({
                            ...activeConfig,
                            questions: activeConfig.questions.filter(
                              (q) => q.id !== question.id,
                            ),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="platform-inline">
                  <input
                    placeholder="Add a question"
                    value={questionLabel}
                    onChange={(e) => setQuestionLabel(e.target.value)}
                  />
                  <button
                    type="button"
                    className="platform-button quiet"
                    onClick={addQuestion}
                  >
                    Add question
                  </button>
                </div>
              </section>
              <section className="platform-panel">
                <p className="eyebrow">LOCAL PREVIEW</p>
                <h2>Try the registration form</h2>
                <p className="platform-note">
                  Synthetic preview only; it does not issue invitations or
                  reserve production capacity.
                </p>
                <div className="platform-form-grid one">
                  <label>
                    Name
                    <input
                      value={previewName}
                      onChange={(e) => setPreviewName(e.target.value)}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={previewEmail}
                      onChange={(e) => setPreviewEmail(e.target.value)}
                    />
                  </label>
                  {activeConfig.questions
                    .filter((question) =>
                      isRegistrationQuestionVisible(question, previewAnswers),
                    )
                    .map((question) => (
                      <div
                        className="platform-question-preview"
                        key={question.id}
                      >
                        {!["radio", "multi_select"].includes(question.type) && (
                          <span>{question.label}</span>
                        )}
                        {question.type === "single_select" ? (
                          <select
                            aria-label={question.label}
                            value={String(previewAnswers[question.id] ?? "")}
                            onChange={(e) =>
                              setPreviewAnswers({
                                ...previewAnswers,
                                [question.id]: e.target.value,
                              })
                            }
                          >
                            <option value="">Choose…</option>
                            {question.options.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        ) : question.type === "radio" ? (
                          <fieldset className="platform-choice-group">
                            <legend>{question.label}</legend>
                            {question.options.map((option) => (
                              <label className="platform-check" key={option}>
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option}
                                  checked={
                                    previewAnswers[question.id] === option
                                  }
                                  onChange={() =>
                                    setPreviewAnswers({
                                      ...previewAnswers,
                                      [question.id]: option,
                                    })
                                  }
                                />
                                {option}
                              </label>
                            ))}
                          </fieldset>
                        ) : question.type === "multi_select" ? (
                          <fieldset className="platform-choice-group">
                            <legend>{question.label}</legend>
                            {question.options.map((option) => {
                              const selected = Array.isArray(
                                previewAnswers[question.id],
                              )
                                ? (previewAnswers[question.id] as string[])
                                : [];
                              return (
                                <label className="platform-check" key={option}>
                                  <input
                                    type="checkbox"
                                    aria-label={question.label}
                                    checked={selected.includes(option)}
                                    onChange={(e) =>
                                      setPreviewAnswers({
                                        ...previewAnswers,
                                        [question.id]: e.target.checked
                                          ? [...selected, option]
                                          : selected.filter(
                                              (entry) => entry !== option,
                                            ),
                                      })
                                    }
                                  />
                                  {option}
                                </label>
                              );
                            })}
                          </fieldset>
                        ) : question.type === "checkbox" ||
                          question.type === "consent" ? (
                          <span className="platform-check">
                            <input
                              type="checkbox"
                              checked={Boolean(previewAnswers[question.id])}
                              onChange={(e) =>
                                setPreviewAnswers({
                                  ...previewAnswers,
                                  [question.id]: e.target.checked,
                                })
                              }
                            />{" "}
                            Acknowledge
                          </span>
                        ) : question.type === "long_text" ? (
                          <textarea
                            aria-label={question.label}
                            value={String(previewAnswers[question.id] ?? "")}
                            onChange={(e) =>
                              setPreviewAnswers({
                                ...previewAnswers,
                                [question.id]: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <input
                            aria-label={question.label}
                            type={
                              question.type === "date"
                                ? "date"
                                : question.type === "email"
                                  ? "email"
                                  : question.type === "phone"
                                    ? "tel"
                                    : question.type === "number"
                                      ? "number"
                                      : "text"
                            }
                            value={String(previewAnswers[question.id] ?? "")}
                            onChange={(e) =>
                              setPreviewAnswers({
                                ...previewAnswers,
                                [question.id]: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
                    ))}
                </div>
                <div className="platform-companion-preview">
                  <div className="platform-toolbar">
                    <strong>Companions</strong>
                    <button
                      type="button"
                      className="platform-button quiet"
                      disabled={
                        previewCompanions.length >=
                        activeConfig.companionAllowance
                      }
                      onClick={() =>
                        setPreviewCompanions([
                          ...previewCompanions,
                          {
                            id: id("person"),
                            name: "",
                            attendance: "attending",
                          },
                        ])
                      }
                    >
                      Add companion ({previewCompanions.length}/
                      {activeConfig.companionAllowance})
                    </button>
                  </div>
                  {previewCompanions.map((person, index) => (
                    <div className="platform-companion-row" key={person.id}>
                      <input
                        aria-label={`Companion ${index + 1} name`}
                        value={person.name}
                        onChange={(e) =>
                          setPreviewCompanions(
                            previewCompanions.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, name: e.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder={`Companion ${index + 1} name`}
                      />
                      <select
                        aria-label={`Companion ${index + 1} attendance`}
                        value={person.attendance}
                        onChange={(e) =>
                          setPreviewCompanions(
                            previewCompanions.map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    attendance: e.target
                                      .value as typeof person.attendance,
                                  }
                                : entry,
                            ),
                          )
                        }
                      >
                        <option value="attending">Attending</option>
                        <option value="declined">Declining</option>
                        <option value="undecided">Undecided</option>
                      </select>
                      <button
                        type="button"
                        className="platform-button quiet"
                        onClick={() =>
                          setPreviewCompanions(
                            previewCompanions.filter(
                              (_, entryIndex) => entryIndex !== index,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="platform-button"
                  onClick={submitPreview}
                >
                  Submit local preview
                </button>
              </section>
            </div>
          )}
          {activeEvent && (
            <section className="platform-panel platform-guest-directory">
              <div className="platform-toolbar">
                <div>
                  <p className="eyebrow">SYNTHETIC LOCAL RECORDS</p>
                  <h2>Guest directory</h2>
                </div>
                <span>{eventRegistrations.length} registrations</span>
              </div>
              <div className="platform-guest-metrics">
                <span>
                  Confirmed{" "}
                  {
                    eventRegistrations
                      .filter((r) => r.status === "confirmed" || !r.status)
                      .flatMap((r) => r.attendees)
                      .filter((person) => person.attendance === "attending")
                      .length
                  }
                </span>
                <span>
                  Pending approval{" "}
                  {
                    eventRegistrations.filter((r) => r.status === "pending")
                      .length
                  }
                </span>
                <span>
                  Declined{" "}
                  {
                    eventRegistrations.filter((r) => r.status === "declined")
                      .length
                  }
                </span>
                <span>
                  Waitlisted{" "}
                  {
                    eventRegistrations.filter((r) => r.status === "waitlisted")
                      .length
                  }
                </span>
              </div>
              <div className="platform-guest-filters">
                <input
                  aria-label="Search demo guests"
                  placeholder="Search name or email"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                />
                <select
                  aria-label="Filter demo RSVP status"
                  value={guestStatus}
                  onChange={(e) => setGuestStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending approval</option>
                  <option value="declined">Declined</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>
              {visibleLocalRegistrations.length ? (
                <div className="platform-record-list">
                  {visibleLocalRegistrations.map((registration) => (
                    <article key={registration.id}>
                      <div>
                        <strong>{registration.primaryName}</strong>
                        <small>
                          {registration.email} · {registration.attendees.length}{" "}
                          person(s) ·{" "}
                          {new Date(registration.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <span>{registration.status ?? "confirmed"}</span>
                      <div className="platform-guest-actions">
                        {(registration.status === "pending" ||
                          registration.status === "waitlisted") && (
                          <>
                            <button
                              type="button"
                              className="platform-button quiet"
                              onClick={() =>
                                transitionLocalRegistration(
                                  registration.id,
                                  "confirmed",
                                )
                              }
                            >
                              {registration.status === "waitlisted"
                                ? "Promote"
                                : "Approve"}
                            </button>
                            <button
                              type="button"
                              className="platform-button quiet"
                              onClick={() =>
                                transitionLocalRegistration(
                                  registration.id,
                                  "declined",
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(registration.status === "confirmed" ||
                          registration.status === "declined" ||
                          !registration.status) && (
                          <button
                            type="button"
                            className="platform-button quiet"
                            onClick={() =>
                              transitionLocalRegistration(
                                registration.id,
                                "cancelled",
                              )
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <details className="platform-guest-response-details">
                        <summary>Response details</summary>
                        <p>
                          {registration.attendees
                            .map(
                              (person) =>
                                `${person.name} · ${person.attendance}`,
                            )
                            .join("; ")}
                        </p>
                        <p>
                          Created{" "}
                          {new Date(registration.createdAt).toLocaleString()}
                        </p>
                        <ul>
                          {(registration.statusHistory ?? []).map((entry) => (
                            <li key={entry.id ?? entry.at}>
                              {entry.status} ·{" "}
                              {new Date(entry.at).toLocaleString()} ·{" "}
                              {entry.actor}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="platform-note">
                  No local RSVP records match this filter.
                </p>
              )}
            </section>
          )}
        </>
      )}
      <footer className="platform-footnote">
        Local demo workspace · synthetic browser storage · {data.clients.length}{" "}
        clients · {data.events.length} events · No database changes
      </footer>
    </main>
  );
}
