/** Static content for the landing page. Kept apart from markup so copy edits stay one-line diffs. */

export const LINKS = {
  github: "https://github.com/USAR-FOSS",
  whatsapp: "https://chat.whatsapp.com/CyN8KlKDUfh8zmzp5VYGSh",
  discord: "https://discord.com/invite/7HrTYAUpdd",
  instagram: "https://www.instagram.com/foss_usar/",
} as const;

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Events", href: "/events" },
  { label: "Achievements", href: "/achievements" },
  { label: "Archive", href: "/archive" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

/** The page's chapters, in order. Drives the nav's "you are here" tag and the menu's jump list. */
export const SECTIONS = [
  { id: "manifesto", n: "01", label: "The premise" },
  { id: "bazaar", n: "02", label: "The bazaar" },
  { id: "big-tent", n: "03", label: "The big tent" },
  { id: "history", n: "04", label: "The log" },
  { id: "team", n: "05", label: "The core leads" },
  { id: "workshop", n: "06", label: "The workshop" },
  { id: "zoo", n: "07", label: "The zoo" },
  { id: "join", n: "08", label: "The invitation" },
] as const;

export const RIBBON_WORDS = [
  "fork it",
  "read the source",
  "open a pull request",
  "review kindly",
  "ship in public",
  "learn out loud",
  "git gud",
  "break things together",
  "merge small, merge often",
  "leave it better",
] as const;

export type Freedom = {
  n: number;
  verb: string;
  rule: string;
  ours: string;
  chips: string[];
};

/** The four essential freedoms of free software (GNU), each paired with what the club does about it. */
export const FREEDOMS: Freedom[] = [
  {
    n: 0,
    verb: "Run",
    rule: "The freedom to run the program, for any purpose.",
    ours: "Everyone is welcome: any year, any branch, any stack. All we ask for is community awareness. If you want to contribute seriously and work for the people around you, you’re in.",
    chips: ["open door", "all branches", "zero gatekeeping"],
  },
  {
    n: 1,
    verb: "Study",
    rule: "The freedom to study how it works, and change it.",
    ours: "Git Gud and the Open Community Chintans open up the tools you use every day. You see how they’re built and how the people who maintain them think.",
    chips: ["workshops", "read the source", "ask why"],
  },
  {
    n: 2,
    verb: "Share",
    rule: "The freedom to redistribute copies, to help your neighbour.",
    ours: "Maintainers and GSoC alumni talk to the whole community, not a lucky few. The link goes out on WhatsApp and anyone can walk in.",
    chips: ["open talks", "mentors", "pass it on"],
  },
  {
    n: 3,
    verb: "Improve",
    rule: "The freedom to improve the program, and release your improvements.",
    ours: "At FOSS Forge you go from reading code to getting it merged. Git Clash and the repo sprints give you real issues and real pull requests, all in public.",
    chips: ["git clash", "repo sprint", "merged PRs"],
  },
];

export type Commit = {
  hash: string;
  date: string;
  type: string;
  title: string;
  summary: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
  /** Landscape photos get a wider thumbnail than posters. */
  aspect?: "portrait" | "landscape";
  href?: string;
  branch: "main" | "talks";
};

/**
 * The club’s history, newest first, as `git log --graph`.
 * Dates mirror src/data/events.ts (the source of truth for the events pages).
 */
export const COMMITS: Commit[] = [
  {
    hash: "c0ffee3",
    date: "6 May 2026",
    type: "talk",
    title: "All roads lead to open source",
    summary: "Open Community Chintan #02 — Jigyasu Rajput on GSoC, remote work and doing it all from a Tier-3 college.",
    tags: ["GSoC", "careers", "online"],
    image: "/event-images/OCC2.png",
    imageAlt: "Poster for Open Community Chintan #02: All roads lead to open source",
    href: "/events/chintan-2",
    branch: "talks",
  },
  {
    hash: "9d1ce5a",
    date: "29 Apr 2026",
    type: "talk",
    title: "Open threat models",
    summary: "Open Community Chintan #01 — the creator of Precogly on threat modeling, and how to contribute to it.",
    tags: ["security", "Precogly", "online"],
    image: "/event-images/OCC1.png",
    imageAlt: "Poster for Open Community Chintan #01: Open threat models",
    href: "/events/chintan-1",
    branch: "talks",
  },
  {
    hash: "a1e7a1c",
    date: "28 Mar 2026",
    type: "hackathon",
    title: "Build with TRAE",
    summary: "TRAE and MiniMax in New Delhi: AI-native coding, then a mini hackathon to try it for real.",
    tags: ["AI", "TRAE", "hackathon"],
    image: "/event-images/build-with-trae.webp",
    imageAlt: "Poster for Build with TRAE at New Delhi with MiniMax, 28th March",
    aspect: "landscape",
    href: "/events/build-with-trae",
    branch: "main",
  },
  {
    hash: "f055f09",
    date: "15–16 Oct 2025",
    type: "flagship",
    title: "FOSS Forge 2025",
    summary: "Two days of Git Clash, the Pokémon YAML Showdown and a Repo Sprint, as part of ELYSIAN 2025.",
    tags: ["competition", "git clash", "repo sprint"],
    image: "/foss-forge-2025.jpg",
    imageAlt: "FOSS Forge 2025 poster",
    href: "/events/foss-forge-2025",
    branch: "main",
  },
  {
    hash: "6179f0d",
    date: "10 Oct 2025",
    type: "workshop",
    title: "Git Gud",
    summary: "Commits, branches and the first pull request — version control from scratch, hands on.",
    tags: ["git", "github", "first PR"],
    image: "/event-images/git-gud.webp",
    imageAlt: "Git Gud poster: Git and GitHub intro, October 10. Learn, try, grow.",
    aspect: "landscape",
    href: "/events/git-gud",
    branch: "main",
  },
  {
    hash: "0000001",
    date: "9 Aug 2025",
    type: "init",
    title: "Genesis — initial commit",
    summary: "The founding orientation. A room of curious builders and a whiteboard of ideas.",
    tags: ["orientation", "founding"],
    image: "/about-images/team.jpg",
    imageAlt: "The UFC team introducing themselves on stage at the orientation",
    aspect: "landscape",
    href: "/events/genesis",
    branch: "main",
  },
];

export type Member = {
  name: string;
  role: string;
  img: string;
  line: string;
  /** CSS object-position, tuned per photo so faces stay in frame. */
  focus?: string;
};

export const TEAM: Member[] = [
  // presidents
  {
    name: "Siddharth Bansal",
    role: "President 1.0",
    img: "/team-images/siddharth.jpg",
    line: "The One Piece… THE ONE PIECE IS REAL!!",
    focus: "50% 25%",
  },
  { name: "Vikram Aditya Verma", role: "President 2.0", img: "/team-images/vikram.webp", line: "Mera khel khatam hai.", focus: "50% 30%" },

  // current leads
  {
    name: "Harsh",
    role: "Tech Lead",
    img: "/team-images/harsh.jpg",
    line: "Believes every problem can be solved with one more npm install.",
    focus: "50% 38%",
  },
  {
    name: "Moksh",
    role: "Oldie",
    img: "/team-images/moksh.jpg",
    line: "Trained a model to predict his wake-up time. Accuracy: 0%.",
    focus: "50% 20%",
  },
  {
    name: "Mridul",
    role: "Tech Lead",
    img: "/team-images/mridul.jpg",
    line: "Pushed to main at 3 a.m. and called it “a small fix”.",
    focus: "50% 12%",
  },
  {
    name: "Aayush",
    role: "Tech Lead",
    img: "/team-images/Aayush-katoch.jpg",
    line: " So Sam altman ,F**k you!",
    focus: "50% 6%",
  },
  {
    name: "Shifali",
    role: "Non-Tech Lead",
    img: "/team-images/shifali.jpg",
    line: "Runs on chai, spreadsheets and zero tolerance for missed deadlines.",
    focus: "50% 32%",
  },
  {
    name: "Sujal",
    role: "Non-Tech Lead",
    img: "/team-images/sujal.jpg",
    line: "Main character of every landscape photo. The waterfall is just a prop.",
    focus: "37% 40%",
  },
  {
    name: "Abhi",
    role: "Operations Lead",
    img: "/team-images/abhi.jpg",
    line: "Plans events like a pro. Trusts the projector like an amateur.",
    focus: "50% 10%",
  },
  {
    name: "Piyush Gupta",
    role: "Oldie",
    img: "/team-images/piyush.jpg",
    line: "sudhar gye toh sher kaun bolega",
    focus: "50% 25%",
  },
  // oldies
  {
    name: "Dhruv Sharma",
    role: "Oldie",
    img: "/team-images/dhruv.jpg",
    line: "Merged on a Friday. Zero regrets, several incidents.",
    focus: "50% 30%",
  },
  {
    name: "Pranshu Bansal",
    role: "Oldie",
    img: "/team-images/pranshu.jpg",
    line: "Retired, but the cat memes never will.",
    focus: "50% 22%",
  },
  {
    name: "Ojaswini Fauzdar",
    role: "Oldie",
    img: "/team-images/ojaswini.jpg",
    line: "Has seen every bug in this club and still hears “works on my machine”.",
    focus: "50% 25%",
  },
  {
    name: "Ananya Jain",
    role: "Oldie",
    img: "/team-images/ananya.jpg",
    line: "Fluent in LGTM, Python and politely savage PR comments.",
    focus: "50% 25%",
  },
  {
    name: "Manandeep Singh",
    role: "Oldie",
    img: "/team-images/manandeep.jpg",
    line: "Went to touch grass in 2024. Grass is still loading.",
    focus: "50% 25%",
  },
  {
    name: "Avish Chaudhary",
    role: "Oldie",
    img: "/team-images/avish.jpg",
    line: "Still waiting on the intern stipend. Buffering since forever.",
    focus: "50% 35%",
  },
  {
    name: "Meyank",
    role: "Operations Lead",
    img: "/team-images/meyank.jpg",
    line: "Keeps the whole club organised. Cannot explain his own desktop.",
    focus: "50% 15%",
  },

  {
    name: "Harshit",
    role: "Tech Lead",
    img: "/team-images/harshit.jpg",
    line: "“I dont care.” (He cares deeply. About everything.)",
    focus: "50% 22%",
  },
  {
    name: "Gursimar Singh",
    role: "Oldie",
    img: "/team-images/gursimar.jpg",
    line: "Now ships code at Zomato. The delivery is always on time.",
    focus: "50% 35%",
  },
];

export type RoleId = "dev" | "design" | "hardware" | "data" | "words" | "people" | "newbie";

export type Role = {
  id: RoleId;
  chip: string;
  title: string;
  pitch: string;
  can: string[];
  tools: string[];
  first: string;
  tone: "butter" | "mint" | "pink" | "lilac" | "sky";
  /** Open-source mascots/logos from /public/collage that "belong" to this kind of contributor. */
  stickers: string[];
};

/** Who open source is for. Deliberately wider than "people who write code". */
export const ROLES: Role[] = [
  {
    id: "dev",
    chip: "I write code",
    title: "Developers",
    pitch: "The part everyone pictures — and only one slice of the pie.",
    can: ["Fix a bug or ship a feature", "Review someone else's pull request", "Add tests, set up CI, untangle the build"],
    tools: ["Git", "GitHub", "Linux", "VS Code"],
    first: "Pick a “good first issue” in any repo we maintain.",
    tone: "mint",
    stickers: ["tux", "git", "ferris", "gopher"],
  },
  {
    id: "design",
    chip: "I design things",
    title: "Designers",
    pitch: "Most projects look the way they do because no designer ever walked in.",
    can: ["Logos, posters and brand systems", "UX audits and redesigns of real screens", "Icons, illustrations and accessible colour"],
    tools: ["Inkscape", "GIMP", "Krita", "Penpot", "Blender"],
    first: "Redesign one screen of this very website.",
    tone: "lilac",
    stickers: ["wilber", "inkscape"],
  },
  {
    id: "hardware",
    chip: "I build hardware",
    title: "Hardware tinkerers",
    pitch: "Yes, USAR: robots, boards and 3D-printed parts count. Open hardware is a whole movement.",
    can: ["Embedded and robotics builds", "PCB layouts and enclosure designs", "Write the build guide so others can reproduce it"],
    tools: ["KiCad", "Arduino", "ROS", "FreeCAD", "Raspberry Pi"],
    first: "Reproduce an open-hardware build and document where it broke.",
    tone: "butter",
    stickers: ["oshw", "kicad", "arduino-cutout"],
  },
  {
    id: "data",
    chip: "I do ML & data",
    title: "ML & data people",
    pitch: "Models and datasets are only open if someone can actually re-run them.",
    can: ["Reproduce a paper or notebook", "Clean and document datasets", "Write evals and model cards"],
    tools: ["Python", "Jupyter", "PyTorch", "scikit-learn"],
    first: "Re-run a notebook and fix whatever breaks.",
    tone: "sky",
    stickers: ["osm", "git"],
  },
  {
    id: "words",
    chip: "I write & explain",
    title: "Writers & translators",
    pitch: "Documentation is the front door. Somebody has to paint it.",
    can: ["READMEs, tutorials and guides", "Translate docs — हिन्दी very welcome", "Changelogs, blog posts, talk write-ups"],
    tools: ["Markdown", "MkDocs", "Docusaurus", "Weblate"],
    first: "Rewrite the most confusing paragraph in any README.",
    tone: "pink",
    stickers: ["gnu", "osm"],
  },
  {
    id: "people",
    chip: "I bring people together",
    title: "Organisers",
    pitch: "Communities don't run on commits alone. They run on someone saying “come, sit.”",
    can: ["Run talks and workshops", "Welcome newcomers and answer questions", "Posters, socials and outreach"],
    tools: ["Discord", "WhatsApp", "Calendars", "Good snacks"],
    first: "Volunteer for the next UFC event.",
    tone: "butter",
    stickers: ["tux", "gnu"],
  },
  {
    id: "newbie",
    chip: "I'm brand new",
    title: "Absolute beginners",
    pitch: "Everyone you admire once didn't know what a pull request was.",
    can: ["Ask the “obvious” question — others have it too", "Fix a typo (it counts)", "Try something, break it, report what happened"],
    tools: ["Curiosity", "A browser", "A GitHub account"],
    first: "Say hi in the chat. Seriously, that's it.",
    tone: "mint",
    stickers: ["git", "tux"],
  },
];

/** Sticky-note philosophy. Quotes are attributed where they are someone else's words. */
export const NOTES: { text: string; more: string; by?: string; color: "butter" | "mint" | "pink" | "lilac" | "sky" }[] = [
  {
    text: "Given enough eyeballs, all bugs are shallow.",
    more: "The more people who can read the code, the faster someone spots the mistake that everyone else walked past. That's why we review each other's pull requests — kindly, and in the open.",
    by: "“Linus's law”, via Eric S. Raymond",
    color: "butter",
  },
  {
    text: "Talk is cheap. Show me the code.",
    more: "Ideas are welcome, but the work is what moves a project. Opening a small, imperfect pull request beats planning a perfect one for a month — you'll learn more, and someone can help you finish it.",
    by: "Linus Torvalds",
    color: "mint",
  },
  {
    text: "Release early, release often.",
    more: "Don't wait until it's flawless. Ship the rough version, let real people poke at it, and fix what they find. Every great open-source project started as an embarrassing first commit.",
    by: "The Cathedral & the Bazaar",
    color: "pink",
  },
  {
    text: "Docs, design and doodles are contributions too.",
    more: "A clearer README, a cleaner logo, a translated guide, a bug report with screenshots, a welcoming reply to a newcomer: none of these need a line of code, and projects live or die on them.",
    color: "lilac",
  },
];

export type Credit = { what: string; who: string; license: string; href: string };

/** Every borrowed image on the page. Shown in the footer — a FOSS club should honour its licences. */
export const CREDITS: Credit[] = [
  {
    what: "Ada Lovelace",
    who: "Alfred Edward Chalon",
    license: "Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Ada_Lovelace_portrait.jpg",
  },
  {
    what: "Grace Hopper",
    who: "James S. Davis, U.S. Navy",
    license: "Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Commodore_Grace_M._Hopper,_USN_(covered).jpg",
  },
  {
    what: "Margaret Hamilton",
    who: "NASA / MIT, restored by Adam Cuerden",
    license: "Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Margaret_Hamilton_-_restoration.jpg",
  },
  {
    what: "Tux",
    who: "Larry Ewing, Simon Budig, Garrett LeSage",
    license: "Attribution",
    href: "https://commons.wikimedia.org/wiki/File:Tux.svg",
  },
  {
    what: "GNU head",
    who: "Aurelio A. Heckert",
    license: "CC BY-SA 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Heckert_GNU_white.svg",
  },
  {
    what: "Open Source Hardware logo",
    who: "Mateo Zlatar / OSHWA",
    license: "Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Open-source-hardware-logo.svg",
  },
  {
    what: "Arduino Uno",
    who: "SparkFun Electronics",
    license: "CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Arduino_Uno_-_R3.jpg",
  },
  {
    what: "Wilber (GIMP)",
    who: "The GIMP Development Team / Gaaarg",
    license: "GPL",
    href: "https://commons.wikimedia.org/wiki/File:Wilber-huge-alpha_cropped.png",
  },
  {
    what: "Kiki (Krita)",
    who: "Tyson Tan",
    license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Kiki_the_Cyber_Squirrel_mascot_of_Krita_cropped_square_profile.png",
  },
  { what: "Ferris (Rust)", who: "Karen Rustad Tölva", license: "CC0", href: "https://commons.wikimedia.org/wiki/File:Original_Ferris.svg" },
  { what: "Go gopher", who: "Renee French", license: "CC BY 3.0", href: "https://commons.wikimedia.org/wiki/File:Go_gopher_frontpage.png" },
  { what: "Git logo", who: "Jason Long", license: "CC BY 3.0", href: "https://commons.wikimedia.org/wiki/File:Git-logo.svg" },
  {
    what: "Inkscape logo",
    who: "Inkscape developers",
    license: "Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Inkscape_logo_(2-colour).svg",
  },
  {
    what: "KiCad logo",
    who: "KiCad Developers Team",
    license: "GPLv3",
    href: "https://commons.wikimedia.org/wiki/File:KiCad_logo_square.svg",
  },
  {
    what: "OpenStreetMap logo",
    who: "OpenStreetMap / TobWen / Gustavf",
    license: "CC BY-SA 2.0",
    href: "https://commons.wikimedia.org/wiki/File:OpenStreetMap-Logo-2006.svg",
  },
  {
    what: "Kiwix logo",
    who: "The other Kiwix guy",
    license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Kiwix_logo_v3.svg",
  },
  {
    what: "Google Summer of Code logo",
    who: "Google",
    license: "Public domain (trademark of Google)",
    href: "https://commons.wikimedia.org/wiki/File:Google_Summer_of_Code_sun_logo_2022.svg",
  },
  {
    what: "FOSS United logo",
    who: "Jeswin Jose",
    license: "Public domain",
    href: "https://commons.wikimedia.org/wiki/File:FOSS_United_Logo_(Black).svg",
  },
  {
    what: "Zomato logo",
    who: "Zomato",
    license: "Public domain (trademark of Zomato)",
    href: "https://commons.wikimedia.org/wiki/File:Zomato.svg",
  },
  {
    what: "Apple logo",
    who: "Rob Janoff",
    license: "Public domain (trademark of Apple)",
    href: "https://commons.wikimedia.org/wiki/File:Apple_logo_black.svg",
  },
  { what: "NSUT logo", who: "Unknown author", license: "Public domain", href: "https://commons.wikimedia.org/wiki/File:NSUT_logo.png" },
  { what: "OWASP logo", who: "OWASP", license: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:OWASP_black_logo.svg" },
  {
    what: "DRDO logo",
    who: "Defence Research and Development Organisation",
    license: "Government of India emblem (trademark of DRDO)",
    href: "https://www.drdo.gov.in",
  },
];
