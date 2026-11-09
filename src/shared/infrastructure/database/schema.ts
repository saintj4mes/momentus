import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const organizationRole = pgEnum("organization_role", [
  "owner",
  "admin",
  "manager",
  "staff",
]);

export const eventStatus = pgEnum("event_status", [
  "draft",
  "published",
  "live",
  "memories",
  "archived",
  "cancelled",
]);

export const eventGuestMode = pgEnum("event_guest_mode", [
  "rsvp",
  "meal_booth",
  "album",
]);

export const nfcCardStatus = pgEnum("nfc_card_status", [
  "unassigned",
  "active",
  "replaced",
  "revoked",
]);

export const micrositeStatus = pgEnum("microsite_status", [
  "draft",
  "published",
  "unpublished",
]);

export const eventType = pgEnum("event_type", [
  "wedding",
  "birthday",
  "corporate",
  "concert",
  "fun_run",
  "conference",
  "community",
  "custom",
]);

export const registrationMode = pgEnum("registration_mode", [
  "private_invitation",
  "open",
  "approval",
]);

export const registrationQuestionType = pgEnum("registration_question_type", [
  "short_text",
  "long_text",
  "email",
  "phone",
  "number",
  "date",
  "dropdown",
  "radio",
  "checkbox",
  "multi_select",
  "consent",
]);

export const openRegistrationStatus = pgEnum("open_registration_status", [
  "pending",
  "confirmed",
  "declined",
  "waitlisted",
  "cancelled",
]);

export const clientStatus = pgEnum("client_status", ["active", "archived"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: organizationRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.userId] })],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    eventDate: date("event_date").notNull(),
    eventTime: time("event_time").notNull(),
    timezone: text("timezone").notNull().default("Asia/Manila"),
    venue: text("venue"),
    capacity: integer("capacity").notNull(),
    reservedPlaces: integer("reserved_places").notNull().default(0),
    rsvpDeadline: timestamp("rsvp_deadline", { withTimezone: true }),
    status: eventStatus("status").notNull().default("draft"),
    guestMode: eventGuestMode("guest_mode").notNull().default("rsvp"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("events_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    check("events_capacity_positive", sql`${table.capacity} > 0`),
    check(
      "events_reserved_places_valid",
      sql`${table.reservedPlaces} >= 0 AND ${table.reservedPlaces} <= ${table.capacity}`,
    ),
  ],
);

// Organizations remain the tenant and client boundary. Contact metadata is
// descriptive only and must never grant membership or authorization.
export const clientProfiles = pgTable(
  "client_profiles",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    category: text("category").notNull().default("unclassified"),
    primaryContactName: text("primary_contact_name"),
    primaryContactEmail: text("primary_contact_email"),
    primaryContactPhone: text("primary_contact_phone"),
    details: text("details").notNull().default(""),
    status: clientStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "client_profiles_contact_email_valid",
      sql`${table.primaryContactEmail} is null OR length(${table.primaryContactEmail}) <= 320`,
    ),
    check(
      "client_profiles_contact_name_valid",
      sql`${table.primaryContactName} is null OR length(${table.primaryContactName}) <= 160`,
    ),
  ],
);

export const eventSettings = pgTable(
  "event_settings",
  {
    eventId: uuid("event_id").primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    type: eventType("event_type").notNull().default("custom"),
    registrationEnabled: boolean("registration_enabled")
      .notNull()
      .default(true),
    admissionEnabled: boolean("admission_enabled").notNull().default(false),
    entitlementsEnabled: boolean("entitlements_enabled")
      .notNull()
      .default(false),
    memoriesEnabled: boolean("memories_enabled").notNull().default(false),
    settings: jsonb("settings")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "event_settings_event_organization_fk",
      columns: [table.eventId, table.organizationId],
      foreignColumns: [events.id, events.organizationId],
    }).onDelete("cascade"),
  ],
);

export const eventRegistrationConfigs = pgTable(
  "event_registration_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull(),
    version: integer("version").notNull(),
    mode: registrationMode("mode").notNull().default("private_invitation"),
    approvalRequired: boolean("approval_required").notNull().default(false),
    waitlistEnabled: boolean("waitlist_enabled").notNull().default(false),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    settings: jsonb("settings")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    isCurrent: boolean("is_current").notNull().default(true),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "event_registration_configs_event_fk",
      columns: [table.eventId],
      foreignColumns: [events.id],
    }).onDelete("cascade"),
    uniqueIndex("event_registration_configs_event_version_unique").on(
      table.eventId,
      table.version,
    ),
    uniqueIndex("event_registration_configs_id_event_unique").on(
      table.id,
      table.eventId,
    ),
    uniqueIndex("event_registration_configs_one_current_unique")
      .on(table.eventId)
      .where(sql`${table.isCurrent}`),
    check(
      "event_registration_configs_version_valid",
      sql`${table.version} >= 1`,
    ),
    check(
      "event_registration_configs_window_valid",
      sql`${table.closesAt} IS NULL OR ${table.opensAt} IS NULL OR ${table.closesAt} > ${table.opensAt}`,
    ),
  ],
);

export const eventRegistrationQuestions = pgTable(
  "event_registration_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    configId: uuid("config_id").notNull(),
    eventId: uuid("event_id").notNull(),
    stableKey: text("stable_key").notNull(),
    label: text("label").notNull(),
    type: registrationQuestionType("question_type").notNull(),
    position: integer("position").notNull(),
    required: boolean("required").notNull().default(false),
    options: jsonb("options").$type<unknown[]>().notNull().default([]),
    validation: jsonb("validation")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    visibility: jsonb("visibility").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "event_registration_questions_config_event_fk",
      columns: [table.configId, table.eventId],
      foreignColumns: [
        eventRegistrationConfigs.id,
        eventRegistrationConfigs.eventId,
      ],
    }).onDelete("cascade"),
    uniqueIndex("event_registration_questions_key_unique").on(
      table.configId,
      table.stableKey,
    ),
    uniqueIndex("event_registration_questions_position_unique").on(
      table.configId,
      table.position,
    ),
    uniqueIndex("event_registration_questions_id_config_unique").on(
      table.id,
      table.configId,
    ),
    uniqueIndex("event_registration_questions_id_event_unique").on(
      table.id,
      table.eventId,
    ),
    check(
      "event_registration_questions_position_valid",
      sql`${table.position} >= 0`,
    ),
    check(
      "event_registration_questions_key_valid",
      sql`${table.stableKey} ~ '^[a-z][a-z0-9_]{1,63}$'`,
    ),
    check(
      "event_registration_questions_label_valid",
      sql`length(btrim(${table.label})) between 1 and 160`,
    ),
  ],
);

export const openRegistrations = pgTable(
  "open_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull(),
    configId: uuid("config_id").notNull(),
    status: openRegistrationStatus("status").notNull(),
    primaryEmail: text("primary_email").notNull(),
    idempotencyKeyHash: text("idempotency_key_hash").notNull(),
    payloadHash: text("payload_hash").notNull(),
    requestedPlaces: integer("requested_places").notNull(),
    reservedPlaces: integer("reserved_places").notNull().default(0),
    statusVersion: integer("status_version").notNull().default(1),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "open_registrations_config_event_fk",
      columns: [table.configId, table.eventId],
      foreignColumns: [
        eventRegistrationConfigs.id,
        eventRegistrationConfigs.eventId,
      ],
    }).onDelete("restrict"),
    uniqueIndex("open_registrations_event_idempotency_unique").on(
      table.eventId,
      table.idempotencyKeyHash,
    ),
    uniqueIndex("open_registrations_id_event_unique").on(
      table.id,
      table.eventId,
    ),
    uniqueIndex("open_registrations_event_active_email_unique")
      .on(table.eventId, sql`lower(${table.primaryEmail})`)
      .where(sql`${table.status} in ('pending', 'confirmed', 'waitlisted')`),
    check(
      "open_registrations_places_valid",
      sql`${table.requestedPlaces} >= 1 AND ${table.reservedPlaces} >= 0 AND ${table.reservedPlaces} <= ${table.requestedPlaces}`,
    ),
    check("open_registrations_version_valid", sql`${table.statusVersion} >= 1`),
    check(
      "open_registrations_idempotency_hash_valid",
      sql`${table.idempotencyKeyHash} ~ '^[0-9a-f]{64}$' AND ${table.payloadHash} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const openRegistrationPeople = pgTable(
  "open_registration_people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id").notNull(),
    eventId: uuid("event_id").notNull(),
    slot: integer("slot").notNull(),
    name: text("name").notNull(),
    attendanceStatus: text("attendance_status").notNull().default("attending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "open_registration_people_registration_event_fk",
      columns: [table.registrationId, table.eventId],
      foreignColumns: [openRegistrations.id, openRegistrations.eventId],
    }).onDelete("cascade"),
    uniqueIndex("open_registration_people_slot_unique").on(
      table.registrationId,
      table.slot,
    ),
    uniqueIndex("open_registration_people_id_event_unique").on(
      table.id,
      table.eventId,
    ),
    check(
      "open_registration_people_slot_valid",
      sql`${table.slot} between 1 and 21`,
    ),
    check(
      "open_registration_people_name_valid",
      sql`length(btrim(${table.name})) between 1 and 120`,
    ),
    check(
      "open_registration_people_attendance_valid",
      sql`${table.attendanceStatus} in ('attending', 'declined', 'undecided')`,
    ),
  ],
);

export const registrationAnswers = pgTable(
  "registration_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id").notNull(),
    personId: uuid("person_id").notNull(),
    questionId: uuid("question_id").notNull(),
    configId: uuid("config_id").notNull(),
    eventId: uuid("event_id").notNull(),
    answer: jsonb("answer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "registration_answers_person_event_fk",
      columns: [table.personId, table.eventId],
      foreignColumns: [
        openRegistrationPeople.id,
        openRegistrationPeople.eventId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "registration_answers_registration_event_fk",
      columns: [table.registrationId, table.eventId],
      foreignColumns: [openRegistrations.id, openRegistrations.eventId],
    }).onDelete("cascade"),
    foreignKey({
      name: "registration_answers_question_event_fk",
      columns: [table.questionId, table.eventId],
      foreignColumns: [
        eventRegistrationQuestions.id,
        eventRegistrationQuestions.eventId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "registration_answers_question_config_fk",
      columns: [table.questionId, table.configId],
      foreignColumns: [
        eventRegistrationQuestions.id,
        eventRegistrationQuestions.configId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "registration_answers_config_event_fk",
      columns: [table.configId, table.eventId],
      foreignColumns: [
        eventRegistrationConfigs.id,
        eventRegistrationConfigs.eventId,
      ],
    }).onDelete("restrict"),
    uniqueIndex("registration_answers_person_question_unique").on(
      table.personId,
      table.questionId,
    ),
  ],
);

export const registrationHistory = pgTable("registration_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => openRegistrations.id, { onDelete: "cascade" }),
  fromStatus: openRegistrationStatus("from_status"),
  toStatus: openRegistrationStatus("to_status").notNull(),
  actorUserId: uuid("actor_user_id"),
  actorType: text("actor_type").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const microsites = pgTable(
  "microsites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    eventId: uuid("event_id").notNull(),
    publicSlug: text("public_slug").notNull(),
    status: micrositeStatus("status").notNull().default("draft"),
    draftProject: jsonb("draft_project")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    draftRevision: integer("draft_revision").notNull().default(0),
    updatedBy: uuid("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedRevision: integer("published_revision"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("microsites_event_unique").on(table.eventId),
    uniqueIndex("microsites_public_slug_unique").on(table.publicSlug),
    foreignKey({
      name: "microsites_event_organization_fk",
      columns: [table.eventId, table.organizationId],
      foreignColumns: [events.id, events.organizationId],
    }).onDelete("cascade"),
    check(
      "microsites_revision_valid",
      sql`${table.draftRevision} >= 0 AND (${table.publishedRevision} IS NULL OR ${table.publishedRevision} >= 1)`,
    ),
  ],
);

export const micrositeVersions = pgTable(
  "microsite_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    micrositeId: uuid("microsite_id")
      .notNull()
      .references(() => microsites.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    projectData: jsonb("project_data")
      .$type<Record<string, unknown>>()
      .notNull(),
    publishedBy: uuid("published_by").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("microsite_versions_number_unique").on(
      table.micrositeId,
      table.versionNumber,
    ),
    check("microsite_versions_number_valid", sql`${table.versionNumber} >= 1`),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    registrationConfigId: uuid("registration_config_id"),
    label: text("label").notNull(),
    companionAllowance: integer("companion_allowance").notNull().default(0),
    reservedPlaces: integer("reserved_places").notNull(),
    tokenHash: text("token_hash").notNull(),
    primaryEmail: text("primary_email"),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    rsvpSubmittedAt: timestamp("rsvp_submitted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("invitations_token_hash_unique").on(table.tokenHash),
    uniqueIndex("invitations_id_event_unique").on(table.id, table.eventId),
    foreignKey({
      name: "invitations_registration_config_event_fk",
      columns: [table.registrationConfigId, table.eventId],
      foreignColumns: [
        eventRegistrationConfigs.id,
        eventRegistrationConfigs.eventId,
      ],
    }).onDelete("restrict"),
    check(
      "invitations_companion_allowance_valid",
      sql`${table.companionAllowance} >= 0 AND ${table.companionAllowance} <= 20`,
    ),
    check(
      "invitations_reserved_places_valid",
      sql`${table.reservedPlaces} = ${table.companionAllowance} + 1`,
    ),
  ],
);

export const nfcCards = pgTable(
  "nfc_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    eventId: uuid("event_id"),
    invitationId: uuid("invitation_id"),
    label: text("label").notNull(),
    credentialHash: text("credential_hash"),
    status: nfcCardStatus("status").notNull().default("unassigned"),
    replacedById: uuid("replaced_by_id"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    replacedAt: timestamp("replaced_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "nfc_cards_event_organization_fk",
      columns: [table.eventId, table.organizationId],
      foreignColumns: [events.id, events.organizationId],
    }).onDelete("cascade"),
    foreignKey({
      name: "nfc_cards_invitation_event_fk",
      columns: [table.invitationId, table.eventId],
      foreignColumns: [invitations.id, invitations.eventId],
    }).onDelete("cascade"),
    foreignKey({
      name: "nfc_cards_replaced_by_fk",
      columns: [table.replacedById],
      foreignColumns: [table.id],
    }).onDelete("set null"),
    uniqueIndex("nfc_cards_credential_hash_unique").on(table.credentialHash),
    uniqueIndex("nfc_cards_one_active_per_invitation_unique")
      .on(table.invitationId)
      .where(sql`${table.status} = 'active'`),
    check(
      "nfc_cards_assignment_valid",
      sql`(
        ${table.status} = 'unassigned'
        AND ${table.eventId} IS NULL
        AND ${table.invitationId} IS NULL
        AND ${table.credentialHash} IS NULL
      ) OR (
        ${table.status} <> 'unassigned'
        AND ${table.organizationId} IS NOT NULL
        AND ${table.eventId} IS NOT NULL
        AND ${table.invitationId} IS NOT NULL
        AND ${table.credentialHash} IS NOT NULL
        AND ${table.assignedAt} IS NOT NULL
      )`,
    ),
    check(
      "nfc_cards_terminal_timestamp_valid",
      sql`(
        (${table.status} = 'replaced' AND ${table.replacedAt} IS NOT NULL)
        OR (${table.status} <> 'replaced' AND ${table.replacedAt} IS NULL)
      ) AND (
        (${table.status} = 'revoked' AND ${table.revokedAt} IS NOT NULL)
        OR (${table.status} <> 'revoked' AND ${table.revokedAt} IS NULL)
      )`,
    ),
  ],
);

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    slot: integer("slot").notNull(),
    name: text("name").notNull(),
    attendanceStatus: text("attendance_status").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("attendees_invitation_slot_unique").on(
      table.invitationId,
      table.slot,
    ),
    uniqueIndex("attendees_id_event_unique").on(table.id, table.eventId),
    check(
      "attendees_slot_valid",
      sql`${table.slot} >= 1 AND ${table.slot} <= 21`,
    ),
    check(
      "attendees_status_valid",
      sql`${table.attendanceStatus} IN ('attending', 'declined', 'undecided')`,
    ),
  ],
);

export const privateRegistrationAnswers = pgTable(
  "private_registration_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attendeeId: uuid("attendee_id").notNull(),
    invitationId: uuid("invitation_id").notNull(),
    eventId: uuid("event_id").notNull(),
    configId: uuid("config_id").notNull(),
    questionId: uuid("question_id").notNull(),
    answer: jsonb("answer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "private_registration_answers_attendee_event_fk",
      columns: [table.attendeeId, table.eventId],
      foreignColumns: [attendees.id, attendees.eventId],
    }).onDelete("cascade"),
    foreignKey({
      name: "private_registration_answers_invitation_event_fk",
      columns: [table.invitationId, table.eventId],
      foreignColumns: [invitations.id, invitations.eventId],
    }).onDelete("cascade"),
    foreignKey({
      name: "private_registration_answers_question_config_fk",
      columns: [table.questionId, table.configId],
      foreignColumns: [
        eventRegistrationQuestions.id,
        eventRegistrationQuestions.configId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "private_registration_answers_config_event_fk",
      columns: [table.configId, table.eventId],
      foreignColumns: [
        eventRegistrationConfigs.id,
        eventRegistrationConfigs.eventId,
      ],
    }).onDelete("restrict"),
    uniqueIndex("private_registration_answers_attendee_question_unique").on(
      table.attendeeId,
      table.questionId,
    ),
  ],
);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "cascade",
  }),
  actorUserId: uuid("actor_user_id"),
  actorType: text("actor_type").notNull(),
  action: text("action").notNull(),
  subjectId: uuid("subject_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    aggregateId: uuid("aggregate_id").notNull(),
    aggregateVersion: integer("aggregate_version").notNull(),
    kind: text("kind").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("notification_outbox_aggregate_version_unique").on(
      table.kind,
      table.aggregateId,
      table.aggregateVersion,
    ),
  ],
);
