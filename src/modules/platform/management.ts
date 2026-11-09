export const platformManagementStorageKey = "momentus-platform-management-v1";

export const eventTypes = [
  { id: "wedding", label: "Wedding" },
  { id: "birthday", label: "Birthday or debut" },
  { id: "corporate", label: "Corporate event" },
  { id: "concert", label: "Concert or festival" },
  { id: "fun-run", label: "Fun run or sports" },
  { id: "conference", label: "Conference or seminar" },
  { id: "community", label: "Community event" },
  { id: "custom", label: "Other event" },
] as const;

export type EventType = (typeof eventTypes)[number]["id"];
export type EventStage =
  | "draft"
  | "planning"
  | "registration_open"
  | "registration_closed"
  | "live"
  | "completed"
  | "archived";
export type ClientStatus = "active" | "archived";
export type EventServices = {
  registration: boolean;
  admission: boolean;
  entitlements: boolean;
  memories: boolean;
};

export type DemoClient = {
  id: string;
  name: string;
  category: string;
  primaryContact: string;
  email: string;
  phone: string;
  organizationDetails: string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
  authorizedEmails: string[];
};

export type DemoEvent = {
  id: string;
  clientId: string;
  name: string;
  type: EventType;
  description: string;
  date: string;
  timezone: string;
  venue: string;
  capacity: number;
  stage: EventStage;
  organizer: string;
  services: EventServices;
  guestMode?: "rsvp" | "meal_booth" | "album";
};

export type RegistrationFieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "single_select"
  | "radio"
  | "multi_select"
  | "date"
  | "checkbox"
  | "consent";

export type RegistrationQuestion = {
  id: string;
  label: string;
  type: RegistrationFieldType;
  required: boolean;
  options: string[];
  conditionalOn?: { questionId: string; value: string };
};

export type RegistrationConfig = {
  mode: "private_invitation" | "open" | "approval" | "ticket_placeholder";
  opensAt: string;
  closesAt: string;
  attendanceDeadline: string;
  capacity: number;
  companionAllowance: number;
  waitlistEnabled: boolean;
  confirmationMessage: string;
  questions: RegistrationQuestion[];
};

export type DemoRegistration = {
  id: string;
  eventId: string;
  primaryName: string;
  email: string;
  attendees: Array<{
    name: string;
    attendance: "attending" | "declined" | "undecided";
  }>;
  answers: Record<string, string | string[] | boolean>;
  createdAt: string;
  status?: "pending" | "confirmed" | "declined" | "waitlisted" | "cancelled";
  statusHistory?: Array<{
    id?: string;
    status: "pending" | "confirmed" | "declined" | "waitlisted" | "cancelled";
    at: string;
    actor: "local-demo";
  }>;
};

export type DemoEntitlement = {
  id: string;
  eventId: string;
  name: string;
  category: string;
  quantity: number;
  station: string;
  enabled: boolean;
};

export type DemoClaim = {
  id: string;
  eventId: string;
  registrationId: string;
  attendeeIndex: number;
  entitlementId: string;
  station: string;
  staffActor: string;
  quantity: number;
  createdAt: string;
};

export type OnboardingDraft = {
  step: number;
  clientName: string;
  category: string;
  primaryContact: string;
  email: string;
  phone: string;
  organizationDetails: string;
  createFirstEvent: boolean;
  eventName: string;
  eventType: EventType;
  eventDate: string;
  venue: string;
  capacity: number;
  services: EventServices;
};

export type DemoPlatformState = {
  clients: DemoClient[];
  events: DemoEvent[];
  registrationConfigs: Record<string, RegistrationConfig>;
  registrations: DemoRegistration[];
  entitlements: DemoEntitlement[];
  claims: DemoClaim[];
  onboarding: OnboardingDraft | null;
};

export const serviceLabels: Record<keyof EventServices, string> = {
  registration: "Registration & RSVP",
  admission: "Admission & check-in",
  entitlements: "Passes & claims",
  memories: "Memories & feedback",
};

export const lifecycleLabels: Record<EventStage, string> = {
  draft: "Draft",
  planning: "Planning",
  registration_open: "Registration open",
  registration_closed: "Registration closed",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
};

export function emptyServices(): EventServices {
  return {
    registration: true,
    admission: false,
    entitlements: false,
    memories: false,
  };
}

export function initialOnboardingDraft(): OnboardingDraft {
  return {
    step: 1,
    clientName: "",
    category: "",
    primaryContact: "",
    email: "",
    phone: "",
    organizationDetails: "",
    createFirstEvent: true,
    eventName: "",
    eventType: "wedding",
    eventDate: "",
    venue: "",
    capacity: 100,
    services: emptyServices(),
  };
}

export function questionsForEventType(type: EventType): RegistrationQuestion[] {
  const base: RegistrationQuestion[] = [
    {
      id: "attendance",
      label: "Will you attend?",
      type: "single_select",
      required: true,
      options: ["Attending", "Declining", "Undecided"],
    },
  ];
  const question = (
    id: string,
    label: string,
    fieldType: RegistrationFieldType,
    required = false,
    options: string[] = [],
  ): RegistrationQuestion => ({
    id,
    label,
    type: fieldType,
    required,
    options,
  });
  const presets: Record<EventType, RegistrationQuestion[]> = {
    wedding: [
      question("meal", "Meal preference", "single_select", false, [
        "Chicken",
        "Fish",
        "Vegetarian",
      ]),
      question("dietary", "Dietary or accessibility needs", "long_text"),
    ],
    birthday: [
      question("family", "Family members attending", "number"),
      question("companions", "Companion names", "long_text"),
    ],
    corporate: [
      question("department", "Department", "short_text"),
      question("dietary", "Dietary requirements", "long_text"),
    ],
    concert: [
      question("category", "Admission category", "single_select", true, [
        "General",
        "Premium",
        "VIP",
      ]),
    ],
    "fun-run": [
      question("race", "Race category", "single_select", true, [
        "3K",
        "5K",
        "10K",
      ]),
      question("shirt", "Shirt size", "single_select", true, [
        "XS",
        "S",
        "M",
        "L",
        "XL",
      ]),
      question("emergency", "Emergency contact", "phone", true),
      question("waiver", "I acknowledge the event waiver", "consent", true),
    ],
    conference: [
      question("sessions", "Session selection", "multi_select", false, [
        "Opening",
        "Workshop A",
        "Workshop B",
      ]),
      question("badge", "Badge name", "short_text"),
    ],
    community: [question("interests", "Areas of interest", "long_text")],
    custom: [question("notes", "Anything we should know?", "long_text")],
  };
  return [...base, ...presets[type]];
}

export function defaultRegistrationConfig(
  event: Pick<DemoEvent, "type" | "capacity">,
): RegistrationConfig {
  return {
    mode: "private_invitation",
    opensAt: "",
    closesAt: "",
    attendanceDeadline: "",
    capacity: event.capacity,
    companionAllowance: 1,
    waitlistEnabled: false,
    confirmationMessage: "Thank you. Your response has been recorded.",
    questions: questionsForEventType(event.type),
  };
}

function clientId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function seedPlatformState(
  sites: Array<{
    id: string;
    client: string;
    event: string;
    date: string;
    venue: string;
    status: string;
    mode: string;
  }>,
): DemoPlatformState {
  const clientsByName = new Map<string, DemoClient>();
  const events: DemoEvent[] = sites.map((site) => {
    const id = clientId(site.client);
    if (!clientsByName.has(site.client)) {
      clientsByName.set(site.client, {
        id,
        name: site.client,
        category: "Private celebration",
        primaryContact: site.client,
        email: "",
        phone: "",
        organizationDetails: "Synthetic sample client",
        status: "active",
        notes: "Seeded local-demo record.",
        createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        authorizedEmails: [],
      });
    }
    const stage =
      site.status === "Memories"
        ? "completed"
        : site.status === "Published"
          ? "registration_open"
          : "planning";
    return {
      id: site.id,
      clientId: id,
      name: site.event,
      type: /wedding/i.test(site.event) ? "wedding" : "birthday",
      description: "Synthetic sample event.",
      date: site.date,
      timezone: "Asia/Manila",
      venue: site.venue,
      capacity: 100,
      stage,
      organizer: site.client,
      services: {
        registration: true,
        admission: stage === "completed",
        entitlements: stage !== "planning",
        memories: stage === "completed",
      },
      guestMode: site.mode as DemoEvent["guestMode"],
    };
  });
  const configs = Object.fromEntries(
    events.map((event) => [event.id, defaultRegistrationConfig(event)]),
  );
  const entitlements = events.flatMap((event) =>
    event.services.entitlements
      ? [
          {
            id: `${event.id}-admission`,
            eventId: event.id,
            name: "General admission",
            category: "Admission",
            quantity: 1,
            station: "Admission",
            enabled: true,
          },
          {
            id: `${event.id}-meal`,
            eventId: event.id,
            name: "Event meal",
            category: "Meal",
            quantity: 1,
            station: "Catering",
            enabled: true,
          },
        ]
      : [],
  );
  return {
    clients: [...clientsByName.values()],
    events,
    registrationConfigs: configs,
    registrations: [],
    entitlements,
    claims: [],
    onboarding: null,
  };
}

export function validateRegistrationConfig(
  config: RegistrationConfig,
): string[] {
  const errors: string[] = [];
  if (
    !Number.isInteger(config.capacity) ||
    config.capacity < 1 ||
    config.capacity > 100_000
  )
    errors.push("Capacity must be between 1 and 100,000.");
  if (
    !Number.isInteger(config.companionAllowance) ||
    config.companionAllowance < 0 ||
    config.companionAllowance > 20
  )
    errors.push("Companion allowance must be between 0 and 20.");
  if (
    !config.confirmationMessage.trim() ||
    config.confirmationMessage.length > 500
  )
    errors.push("Confirmation message must be 1–500 characters.");
  const ids = new Set<string>();
  for (const question of config.questions) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(question.id) || ids.has(question.id))
      errors.push("Question IDs must be unique stable identifiers.");
    ids.add(question.id);
    if (!question.label.trim() || question.label.length > 120)
      errors.push("Each question needs a label under 120 characters.");
    if (
      ["single_select", "radio", "multi_select"].includes(question.type) &&
      (question.options.length < 1 ||
        question.options.length > 30 ||
        question.options.some(
          (option) => !option.trim() || option.length > 100,
        ))
    )
      errors.push(`Add 1–30 valid options for “${question.label}”.`);
    if (question.conditionalOn && !ids.has(question.conditionalOn.questionId))
      errors.push(
        `Question “${question.label}” depends on an earlier question.`,
      );
  }
  if (config.opensAt && config.closesAt && config.opensAt >= config.closesAt)
    errors.push("Registration must open before it closes.");
  return [...new Set(errors)];
}

export function validateRegistrationAnswers(
  config: RegistrationConfig,
  answers: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  for (const question of config.questions) {
    if (!isRegistrationQuestionVisible(question, answers)) continue;
    const value = answers[question.id];
    const empty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      value === false;
    if (question.required && empty)
      errors.push(`${question.label} is required.`);
    if (empty) continue;
    if (
      question.type === "email" &&
      (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    )
      errors.push(`${question.label} must be a valid email address.`);
    if (
      question.type === "phone" &&
      (typeof value !== "string" || !/^\+?[0-9 ()-]{7,24}$/.test(value))
    )
      errors.push(`${question.label} must be a valid phone number.`);
    if (
      question.type === "number" &&
      (typeof value !== "string" || !/^\d{1,6}$/.test(value))
    )
      errors.push(`${question.label} must be a whole number.`);
    if (
      question.type === "date" &&
      (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
    )
      errors.push(`${question.label} must be a valid date.`);
    if (
      ["single_select", "radio"].includes(question.type) &&
      (typeof value !== "string" || !question.options.includes(value))
    )
      errors.push(`Choose a valid option for ${question.label}.`);
    if (
      question.type === "multi_select" &&
      (!Array.isArray(value) ||
        value.some(
          (item) =>
            typeof item !== "string" || !question.options.includes(item),
        ))
    )
      errors.push(`Choose valid options for ${question.label}.`);
    if (
      ["short_text", "long_text"].includes(question.type) &&
      (typeof value !== "string" ||
        value.length > (question.type === "short_text" ? 200 : 2000))
    )
      errors.push(`${question.label} is too long.`);
    if (["consent", "checkbox"].includes(question.type) && value !== true)
      errors.push(`${question.label} must be acknowledged.`);
  }
  return errors;
}

export function isRegistrationQuestionVisible(
  question: RegistrationQuestion,
  answers: Record<string, unknown>,
): boolean {
  if (!question.conditionalOn) return true;
  const answer = answers[question.conditionalOn.questionId];
  return Array.isArray(answer)
    ? answer.includes(question.conditionalOn.value)
    : String(answer ?? "") === question.conditionalOn.value;
}
