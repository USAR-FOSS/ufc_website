/**
 * Everything the Support us page says, in one place. Edit here and the page follows (run scripts/make-brochure.mjs to refresh the PDF too).
 * Sponsorship amounts are in US dollars.
 */

export const FORGE = {
  name: "FOSS Forge 2.0",
  dates: "21 and 22 October 2026",
  short: "21 to 22 Oct",
  /** When it starts, for the countdown. The 21st, from midnight in Delhi. */
  starts: "2026-10-21T00:00:00+05:30",
  venue: "USAR, GGSIPU, Delhi",
  fest: "Elysian",
} as const;

export const ELYSIAN = {
  footfall: "6000+",
  features: ["Hackathons", "Design competitions", "Robotics competitions", "Workshops", "Speaker sessions"],
} as const;

/** A backer and its logo (a file in public/). `mark` is true for a square badge, which is shown with the name beside it. */
export type Backer = {
  name: string;
  href: string;
  src: string;
  w: number;
  h: number;
  /** A square badge (an app icon, a community's avatar), shown with the name beside it. */
  mark?: boolean;
  /** Logos that are made for a dark or coloured background sit on their own brand colour, so they look the way their owners drew them. */
  tile?: string;
  /** The colour of the name beside a badge, and whether it is set in a serif face (as CodeCrafters does). */
  ink?: string;
  serif?: boolean;
};

const KIWIX: Backer = { name: "Kiwix", href: "https://www.kiwix.org", src: "/logos/kiwix-light.svg", w: 3071.4, h: 773.7, tile: "#0b0a1c" };
const FOSS_UNITED: Backer = { name: "FOSS United", href: "https://fossunited.org", src: "/logos/fossunited.webp", w: 600, h: 472 };
const MINIMAX: Backer = { name: "MiniMax", href: "https://www.minimax.io", src: "/logos/minimax.webp", w: 349, h: 128 };
const TRAE: Backer = { name: "TRAE", href: "https://www.trae.ai", src: "/logos/trae.svg", w: 1, h: 1, mark: true };
const UNSTOP: Backer = { name: "Unstop", href: "https://unstop.com", src: "/logos/unstop.svg", w: 2000, h: 796 };
const CODECAP: Backer = {
  name: "CodeCap",
  href: "https://www.linkedin.com/company/codecap-community",
  src: "/logos/codecap.jpg",
  w: 1,
  h: 1,
  mark: true,
};
const CODECRAFTERS: Backer = {
  name: "CodeCrafters",
  href: "https://codecrafters.io",
  src: "/logos/codecrafters.svg",
  w: 27.3211,
  h: 18.7013,
  mark: true,
  tile: "#061418",
  ink: "#f1eff0",
  serif: true,
};
const ELEVENLABS: Backer = { name: "ElevenLabs", href: "https://elevenlabs.io", src: "/logos/elevenlabs.svg", w: 694, h: 90 };
const XYZ: Backer = { name: ".XYZ", href: "https://gen.xyz", src: "/logos/xyz.svg", w: 85, h: 49.5, tile: "#4A1955" };

/** Backing FOSS Forge 2.0 right now. */
export const CURRENT_SPONSORS: Backer[] = [KIWIX, FOSS_UNITED, CODECRAFTERS, ELEVENLABS, XYZ, UNSTOP];

/** A community standing with us. Its card goes to `href`, and shows `label` under the name. */
export type Partner = {
  name: string;
  /** Their Instagram page, or their website. */
  href: string;
  /** What the card shows under the name: their Instagram handle, or the address of their website. */
  label: string;
  /** Which of the two `href` is, so the card shows the right icon and says where it goes. */
  kind: "instagram" | "website";
  /** A square picture in public/. */
  src: string;
};

/** The communities partnering with us for FOSS Forge 2.0, shown under the sponsors. */
export const COMMUNITY_PARTNERS: Partner[] = [
  { name: "UI Pixel", href: "https://www.instagram.com/ui.pixel/", label: "@ui.pixel", kind: "instagram", src: "/logos/ui-pixel.webp" },
  {
    name: "DevSphere",
    href: "https://www.instagram.com/devsphereindia/",
    label: "@devsphereindia",
    kind: "instagram",
    src: "/logos/devsphere.webp",
  },
  { name: "Backstage", href: "https://www.mybackstage.in/", label: "mybackstage.in", kind: "website", src: "/logos/backstage.webp" },
  { name: "DTC FOSS Club", href: "https://thefossclub.org", label: "thefossclub.org", kind: "website", src: "/logos/dtc-foss-club.webp" },
];

/** Who backed which event of ours, newest first. Links go to the event pages. */
export const PAST_BACKERS: { event: string; when: string; href: string; poster?: string; backers: Backer[] }[] = [
  { event: "Build with TRAE", when: "Mar 2026", href: "/events/build-with-trae", backers: [MINIMAX, TRAE] },
  { event: "Elysian 2025", when: "Oct 2025", href: "/events/foss-forge-2025", poster: "/foss-forge-2025.jpg", backers: [UNSTOP, CODECAP] },
  { event: "Git Gud", when: "Oct 2025", href: "/events/git-gud", backers: [FOSS_UNITED] },
];

export type Tier = { id: "bronze" | "silver" | "gold" | "title"; name: string; short: string; price: string; line: string; bg: string };

export const TIERS: Tier[] = [
  { id: "bronze", name: "Bronze", short: "Bronze", price: "$150", line: "Everything every tier gets.", bg: "#f2c7a5" },
  { id: "silver", name: "Silver", short: "Silver", price: "$300", line: "On the posters, the banner and the screens.", bg: "#dfe4ea" },
  { id: "gold", name: "Gold", short: "Gold", price: "$600", line: "A stand at the venue and a voice on the day.", bg: "var(--butter)" },
  { id: "title", name: "Title sponsor", short: "Title", price: "$1000+", line: "FOSS Forge 2.0, presented by you.", bg: "var(--signal)" },
];

/** true is a tick, false is a dash, and a string is shown as it is. One value per tier, in the order of TIERS. */
export type Cell = boolean | string;

export const BENEFITS: { label: string; short: string; values: [Cell, Cell, Cell, Cell] }[] = [
  { label: "Logo on the FOSS Forge 2.0 page of our website", short: "Logo on our website", values: [true, true, true, true] },
  {
    label: "Mention on our social media",
    short: "Social media",
    values: ["Thank-you post", "1 dedicated post", "2 dedicated posts", "A campaign series"],
  },
  { label: "Logo on posters and digital creatives", short: "Posters", values: [false, "Small", "Medium", "Top billing"] },
  {
    label: "Logo on the stage banner and the screens at the venue",
    short: "Stage banner, screens",
    values: [false, "Small", "Medium", "Largest"],
  },
  { label: "Logo on certificates and participant goodies", short: "Certificates, goodies", values: [true, true, true, true] },
  { label: "Shout-out at the opening and closing ceremonies", short: "Shout-out", values: [true, true, true, true] },
  { label: "A stand or table at the venue", short: "A stand at the venue", values: [false, false, true, "Prime spot"] },
  { label: "A talk slot", short: "Talk slot", values: ["5 minutes", "10 minutes", "15 minutes", "30 minutes"] },
  { label: "A challenge for participants", short: "A challenge", values: [false, false, "A sponsor challenge", "Your own track"] },
  { label: "A seat on the judging panel", short: "A judging seat", values: [false, false, false, true] },
  { label: "A report after the event, with the numbers", short: "Post-event report", values: [false, false, true, true] },
  { label: "Naming rights: FOSS Forge 2.0, presented by you", short: "Naming rights", values: [false, false, false, true] },
];

/** The same cell values, shorter, for narrow screens. Anything not listed is already short. */
export const SHORT_VALUE: Record<string, string> = {
  "Thank-you post": "Thanks",
  "1 dedicated post": "1 post",
  "2 dedicated posts": "2 posts",
  "A campaign series": "Series",
  "Top billing": "Top",
  "Prime spot": "Prime",
  "5 minutes": "5 min",
  "10 minutes": "10 min",
  "15 minutes": "15 min",
  "30 minutes": "30 min",
  "A sponsor challenge": "Yours",
  "Your own track": "Own",
};

/** What every tier gets, said once above the picker. These are the rows of BENEFITS that are the same in every column (or close to it). */
export const EVERYONE = [
  "A talk slot",
  "A shout-out at the opening and closing",
  "Your logo on certificates and goodies",
  "Your logo on our website",
] as const;

export const WELCOME = {
  intro:
    "Every kind of sponsor is welcome: large companies, startups, foundations, non-profits and individuals. We would especially like to hear from large organisations and non-profits, because of what we are building this year.",
  ways: ["Money", "Prizes", "Cloud credits and tools", "Mentors and judges", "Venue and logistics", "Swag", "Media and reach"],
  close: "If what you have in mind does not fit a tier, tell us what it is and we will shape something together.",
} as const;

export const CONTACTS = [
  { name: "Vikram Aditya Verma", phone: "+91-6283621362", email: "contact.vikramaditya33@gmail.com" },
  { name: "Sujal Maity", phone: "+91-8700504557", email: "sujalmaity26@gmail.com" },
  { name: "Siddharth Bansal", phone: "+91-9311025881", email: "sidd190bansal@gmail.com" },
] as const;

/** Where the downloadable brochure lives (public/). Made by scripts/make-brochure.mjs. */
export const BROCHURE = "/ufc-sponsorship-brochure.pdf";
