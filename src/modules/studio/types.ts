export type StudioStage =
  | "setup"
  | "designer"
  | "guests"
  | "credentials"
  | "live_ops";

export interface StudioStageConfig {
  id: StudioStage;
  number: string;
  label: string;
  shortDesc: string;
  badge?: string;
}

export const STUDIO_STAGES: StudioStageConfig[] = [
  {
    id: "setup",
    number: "01",
    label: "Setup & Plan",
    shortDesc: "Details, quotas & custom domains",
  },
  {
    id: "designer",
    number: "02",
    label: "Microsite Studio",
    shortDesc: "Visual canvas & interactive RSVP",
  },
  {
    id: "guests",
    number: "03",
    label: "Guests & Seating",
    shortDesc: "Invitations, dietary & tables",
  },
  {
    id: "credentials",
    number: "04",
    label: "NFC Cards & QR",
    shortDesc: "Tap-to-encode & batch export",
  },
  {
    id: "live_ops",
    number: "05",
    label: "Live Operations",
    shortDesc: "Turnstile control & memories",
  },
];

export interface StudioEvent {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  venue: string;
  capacity: number;
  reservedPlaces: number;
  status: "draft" | "published" | "live" | "memories" | "archived";
  guestMode: "rsvp" | "meal_booth" | "album";
  planTier: "starter" | "bespoke" | "grand" | "agency_pro" | "enterprise";
  customDomain?: string;
  micrositeSlug: string;
  publishedRevision?: number;
}

export interface StudioGuestParty {
  id: string;
  label: string;
  primaryGuestName: string;
  primaryEmail?: string;
  companionAllowance: number;
  reservedPlaces: number;
  tableAssignment?: string;
  seatAssignment?: string;
  dietaryNotes?: string;
  tokenHash: string;
  rsvpStatus: "pending" | "confirmed" | "declined";
  issuedNfcCardId?: string;
  nfcCardStatus?: "active" | "replaced" | "revoked";
  companions: Array<{
    id: string;
    name: string;
    attendance: "attending" | "declined" | "undecided";
    dietaryNotes?: string;
  }>;
}

export interface StationLiveMetrics {
  gateScans: number;
  vipEscorts: number;
  cateringClaims: number;
  barVouchers: number;
  duplicateAlerts: number;
}

