export type DemoMode = "rsvp" | "meal_booth" | "album";
export type DemoCard = { id: string; label?: string; siteId: string; invitation: string; status: "Active" | "Replaced" | "Revoked" };
export type DemoEventSettings = {
  mode: DemoMode;
  rsvp: { title: string; intro: string; askEmail: boolean; allowPlusOne: boolean; maxPlusOnes: number };
  mealBooth: { foodStub: boolean; souvenirClaim: boolean; photoBooth: boolean; foodLabel: string; instructions: string };
  album: { headline: string; message: string; sdeTitle: string; sdeUrl: string; galleryTitle: string };
};
export type DemoAttendee = { name: string; table: string; mealNote: string };
export type DemoRsvp = { id: string; siteId: string; primaryName: string; email: string; companions: string[]; attendees: DemoAttendee[]; createdAt: string };
export type DemoLocalState = {
  modes?: Record<string, DemoMode>;
  cards?: DemoCard[];
  settings?: Record<string, DemoEventSettings>;
  rsvps?: DemoRsvp[];
};

export type DemoSite = {
  id: string;
  client: string;
  initials: string;
  event: string;
  date: string;
  dateLong: string;
  theme: string;
  status: "Published" | "In design" | "Memories";
  venue: string;
  mode: DemoMode;
};

export const demoSites: DemoSite[] = [
  {
    id: "amara-luca",
    client: "Amara Santos & Luca Reyes",
    initials: "A L",
    event: "Wedding celebration",
    date: "14 Feb 2027",
    dateLong: "Sunday, the fourteenth of February",
    theme: "Romantic Floral",
    status: "Published",
    venue: "Casa Manila, Intramuros",
    mode: "rsvp",
  },
  {
    id: "mikaela-debut",
    client: "Mikaela Cruz",
    initials: "MC",
    event: "18th birthday",
    date: "28 Mar 2027",
    dateLong: "Sunday, the twenty-eighth of March",
    theme: "Fairytale Garden",
    status: "In design",
    venue: "The Glass Garden, Pasig",
    mode: "rsvp",
  },
  {
    id: "ella-noah",
    client: "Ella Lim & Noah Tan",
    initials: "E N",
    event: "Wedding celebration",
    date: "02 Nov 2026",
    dateLong: "Monday, the second of November",
    theme: "Modern Minimalist",
    status: "Memories",
    venue: "Antonio's, Tagaytay",
    mode: "album",
  },
];

export const demoConfigStorageKey = "momentus-local-demo-config-v3";

export function defaultEventSettings(site: DemoSite): DemoEventSettings {
  return {
    mode: site.mode,
    rsvp: {
      title: `Join ${site.client} for their celebration`,
      intro: "We would be delighted to celebrate this day with you. Please let us know who can attend.",
      askEmail: true,
      allowPlusOne: true,
      maxPlusOnes: 1,
    },
    mealBooth: {
      foodStub: true,
      souvenirClaim: true,
      photoBooth: true,
      foodLabel: "Celebration dinner",
      instructions: "Show your event pass to the team at each station. A team member will confirm each claim.",
    },
    album: {
      headline: `You are part of the memorable experience of ${site.client}`,
      message: "Thank you for making this day even more meaningful. Relive the celebration and share these memories with us.",
      sdeTitle: "The story of their celebration",
      sdeUrl: "",
      galleryTitle: "The celebration, through your eyes",
    },
  };
}

export const demoCards: DemoCard[] = [
  { id: "MN-0001", siteId: "amara-luca", invitation: "Primary invitation 01", status: "Active" },
  { id: "MN-0002", siteId: "amara-luca", invitation: "Primary invitation 02", status: "Active" },
  { id: "MN-0003", siteId: "mikaela-debut", invitation: "Primary invitation 01", status: "Active" },
  { id: "MN-0004", siteId: "ella-noah", invitation: "Primary invitation 01", status: "Active" },
];
