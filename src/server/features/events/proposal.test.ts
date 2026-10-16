import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FORM, EMPTY_ROUND, buildProposal, formFromEvent } from "@/features/events/form-codec";
import { parseProposal } from "./proposal";

/**
 * Everything a member sends when they propose an event passes through here before anything is stored: the four kinds of event we run, the
 * window an event has to start in, how long it can run, and the shape and length of every detail. Each refusal is a sentence shown to the
 * person filling the form, so the message is part of the contract as much as the refusal is.
 */

const OVERVIEW = { overview: ["A first paragraph that is comfortably past the thirty character floor."] };
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const inTwoHours = () => new Date(Date.now() + 2 * HOUR);

/** A proposal with nothing wrong with it, unless a case changes one part. */
const minimal = (over: Record<string, unknown> = {}) => ({
  title: "Build Night",
  description: "An evening of building together on campus.",
  location: "Seminar Hall",
  date: inTwoHours().toISOString(),
  maxAttendees: 50,
  type: "WORKSHOP",
  details: { ...OVERVIEW },
  ...over,
});

const parse = (body: unknown) => parseProposal(body, { checkStart: false });
const rejects = (body: unknown, message: RegExp) => assert.throws(() => parse(body), { name: "ApiError", status: 400, message });

test("a body that is not an event is refused", () => {
  rejects(null, /Send the event details as JSON/);
  rejects("nope", /Send the event details as JSON/);
});

test("the start has to be a real moment", () => {
  rejects(minimal({ date: "not a date" }), /Pick a valid start date/);
});

test("a new event has to start at least an hour away and within the year", () => {
  const tooSoon = new Date(Date.now() + 59 * 60 * 1000).toISOString();
  assert.throws(() => parseProposal(minimal({ date: tooSoon })), /at least an hour from now/);

  const fine = new Date(Date.now() + 61 * 60 * 1000).toISOString();
  assert.equal(parseProposal(minimal({ date: fine })).maxAttendees, 50);

  const tooFar = new Date(Date.now() + 400 * DAY).toISOString();
  assert.throws(() => parseProposal(minimal({ date: tooFar })), /within the next year/);
});

test("an end before the start, or more than a week later, is refused", () => {
  const start = inTwoHours().toISOString();
  const before = new Date(new Date(start).getTime() - 1000).toISOString();
  rejects(minimal({ date: start, details: { ...OVERVIEW, endsAt: before } }), /end after it starts/);

  const tooLate = new Date(new Date(start).getTime() + 8 * DAY).toISOString();
  rejects(minimal({ date: start, details: { ...OVERVIEW, endsAt: tooLate } }), /at most a week/);
});

test("a valid end is stored as an exact moment", () => {
  const start = inTwoHours();
  const end = new Date(start.getTime() + 2 * HOUR);
  const parsed = parse(minimal({ date: start.toISOString(), details: { ...OVERVIEW, endsAt: end.toISOString() } }));
  assert.equal(parsed.details.endsAt, end.toISOString());
});

test("only the four kinds of event we run are accepted", () => {
  rejects(minimal({ type: "PARTY" }), /isn't one we run/);
  assert.equal(parse(minimal()).type, "WORKSHOP");
  assert.equal(parse(minimal({ type: "hackathon" })).type, "HACKATHON");
});

test("max attendees is a whole number from 1 to 1000, defaulting to fifty", () => {
  assert.equal(parse(minimal({ maxAttendees: undefined })).maxAttendees, 50);
  assert.equal(parse(minimal({ maxAttendees: "" })).maxAttendees, 50);
  assert.equal(parse(minimal({ maxAttendees: 1000 })).maxAttendees, 1000);
  rejects(minimal({ maxAttendees: 0 }), /whole number from 1 to 1000/);
  rejects(minimal({ maxAttendees: 1001 }), /whole number from 1 to 1000/);
  rejects(minimal({ maxAttendees: 2.5 }), /whole number from 1 to 1000/);
});

test("the mode, when given, is one of the three we run", () => {
  rejects(minimal({ details: { ...OVERVIEW, mode: "telepathy" } }), /in person, online or hybrid/);
  assert.equal(parse(minimal({ details: { ...OVERVIEW, mode: "online" } })).details.mode, "online");
});

test("an event has to say what it is about", () => {
  rejects(minimal({ details: {} }), /write at least one paragraph/);
  rejects(minimal({ details: { overview: ["too short"] } }), /needs at least 30 characters/);
  rejects(minimal({ details: { overview: ["x".repeat(1201)] } }), /at most 1200 characters/);
  rejects(minimal({ details: { overview: Array.from({ length: 7 }, () => "x".repeat(30)) } }), /at most 6 items/);
});

test("the title, summary and location have sensible lengths", () => {
  rejects(minimal({ title: "hi" }), /needs at least 3 characters/);
  rejects(minimal({ title: "x".repeat(121) }), /at most 120 characters/);
  rejects(minimal({ description: "short" }), /needs at least 20 characters/);
  rejects(minimal({ location: "x" }), /needs at least 2 characters/);
});

test("list fields are capped and tags are lowercased and trimmed", () => {
  rejects(minimal({ details: { ...OVERVIEW, tags: Array.from({ length: 7 }, (_, i) => "tag" + i) } }), /at most 6 items/);
  rejects(minimal({ details: { ...OVERVIEW, tags: ["x".repeat(25)] } }), /can be at most 24 characters/);
  rejects(minimal({ details: { ...OVERVIEW, highlights: Array.from({ length: 11 }, () => "highlight") } }), /at most 10 items/);
  assert.deepEqual(parse(minimal({ details: { ...OVERVIEW, tags: ["FOSS", " hardware "] } })).details.tags, ["foss", "hardware"]);
});

test("every schedule line needs both a time and what happens then", () => {
  rejects(minimal({ details: { ...OVERVIEW, schedule: [{ items: [{ time: "", activity: "Doors" }] }] } }), /both a time and what happens/);
  rejects(
    minimal({ details: { ...OVERVIEW, schedule: [{ items: [{ time: "x".repeat(31), activity: "Doors" }] }] } }),
    /schedule line is too long/,
  );
});

test("a schedule with a named day is kept and trimmed", () => {
  const schedule = [{ day: " Day 1 ", items: [{ time: " 6:30 PM ", activity: " Doors " }] }];
  assert.deepEqual(parse(minimal({ details: { ...OVERVIEW, schedule } })).details.schedule, [
    { day: "Day 1", items: [{ time: "6:30 PM", activity: "Doors" }] },
  ]);
  assert.equal(parse(minimal({ details: { ...OVERVIEW, schedule: [] } })).details.schedule, undefined);
});

test("a round with nothing filled in is dropped", () => {
  const parsed = parse(minimal({ details: { ...OVERVIEW, rounds: [{ name: "", when: "", tagline: "", body: "" }] } }));
  assert.equal(parsed.details.rounds, undefined);
});

test("a round that is filled in has to be complete", () => {
  const filled = { name: "Round 1", when: "Day 1", tagline: "Ideas", body: "short" };
  rejects(minimal({ details: { ...OVERVIEW, rounds: [filled] } }), /description needs at least 10 characters/);
});

test("a complete round is kept with its scoring as lines", () => {
  const rounds = [
    {
      name: " Round 1 ",
      when: " Day 1 ",
      tagline: " Ideas ",
      body: "A description long enough.",
      scoring: [" Creativity ", "Feasibility"],
    },
  ];
  assert.deepEqual(parse(minimal({ details: { ...OVERVIEW, rounds } })).details.rounds, [
    { name: "Round 1", when: "Day 1", tagline: "Ideas", body: "A description long enough.", scoring: ["Creativity", "Feasibility"] },
  ]);
});

test("a speaker that was not filled in is left out", () => {
  const empty = { name: "", bio: "", topic: "", links: [] };
  assert.equal(parse(minimal({ details: { ...OVERVIEW, speaker: empty } })).details.speaker, undefined);
});

test("a speaker link has to be a web address", () => {
  const speaker = { name: "Ada", bio: "A bio long enough.", topic: "Hardware", links: [{ label: "Site", href: "javascript:alert(1)" }] };
  rejects(minimal({ details: { ...OVERVIEW, speaker } }), /full web address/);
});

test("a filled speaker is kept and trimmed", () => {
  const speaker = {
    name: " Ada Lovelace ",
    bio: " A bio that is long enough. ",
    topic: " Open hardware ",
    links: [{ label: " Site ", href: "https://example.com" }],
  };
  assert.deepEqual(parse(minimal({ details: { ...OVERVIEW, speaker } })).details.speaker, {
    name: "Ada Lovelace",
    bio: "A bio that is long enough.",
    topic: "Open hardware",
    links: [{ label: "Site", href: "https://example.com/" }],
  });
});

test("a registration link needs both a label and an address when either is given", () => {
  rejects(minimal({ details: { ...OVERVIEW, registration: { href: "https://example.com/rsvp" } } }), /can't be empty/);
  rejects(minimal({ details: { ...OVERVIEW, registration: { label: "Register" } } }), /full web address/);
  assert.equal(parse(minimal()).details.registration, undefined);

  const both = parse(minimal({ details: { ...OVERVIEW, registration: { label: "Register", href: "https://example.com/rsvp" } } }));
  assert.deepEqual(both.details.registration, { label: "Register", href: "https://example.com/rsvp" });
});

test("the poster address has to be a web address", () => {
  rejects(minimal({ details: { ...OVERVIEW, imageUrl: "not a url" } }), /full web address/);
  const poster = parse(minimal({ details: { ...OVERVIEW, imageUrl: "https://example.com/p.png" } }));
  assert.equal(poster.details.imageUrl, "https://example.com/p.png");
});

test("nothing that was not set is stored", () => {
  const details = parse(minimal()).details;
  const unset = [
    "subtitle",
    "mode",
    "endsAt",
    "tags",
    "imageUrl",
    "highlights",
    "whoFor",
    "bring",
    "schedule",
    "rounds",
    "speaker",
    "registration",
  ];
  for (const key of unset) assert.ok(!(key in details), key + " should be left out");
  assert.deepEqual(details.overview, OVERVIEW.overview);
});

test("fields that are not text or lists are refused, not guessed at", () => {
  rejects(minimal({ title: 42 }), /needs at least 3 characters/);
  rejects(minimal({ details: { ...OVERVIEW, tags: "foss" } }), /should be a list/);
  rejects(minimal({ details: { ...OVERVIEW, rounds: "nope" } }), /should be a list/);
});

test("entries that are not text are dropped rather than stored", () => {
  const parsed = parse(minimal({ details: { ...OVERVIEW, highlights: [7, " Bring a laptop "] } }));
  assert.deepEqual(parsed.details.highlights, ["Bring a laptop"]);
});

test("a day with nothing under it, and too many days or rounds, are handled", () => {
  assert.equal(parse(minimal({ details: { ...OVERVIEW, schedule: [{ day: "Day 1" }] } })).details.schedule, undefined);

  const days = Array.from({ length: 5 }, () => ({ items: [{ time: "1 PM", activity: "Doors" }] }));
  rejects(minimal({ details: { ...OVERVIEW, schedule: days } }), /at most 4 entries/);
  rejects(minimal({ details: { ...OVERVIEW, rounds: Array.from({ length: 7 }, () => ({})) } }), /at most 6 entries/);
});

test("an empty mode is left out, and an over-long address is refused", () => {
  assert.equal(parse(minimal({ details: { ...OVERVIEW, mode: "" } })).details.mode, undefined);
  rejects(minimal({ details: { ...OVERVIEW, imageUrl: "https://example.com/" + "x".repeat(500) } }), /full web address/);
});

test("details that were not sent at all means no overview, which is refused", () => {
  rejects(minimal({ details: undefined }), /write at least one paragraph/);
});

test("a speaker link with neither label nor address is dropped", () => {
  const speaker = {
    name: "Ada",
    bio: "A bio long enough.",
    topic: "Hardware",
    links: [{}, { label: "Site", href: "https://example.com" }],
  };
  const parsed = parse(minimal({ details: { ...OVERVIEW, speaker } })).details.speaker;
  assert.deepEqual(parsed?.links, [{ label: "Site", href: "https://example.com/" }]);
  assert.equal(parse(minimal({ details: { ...OVERVIEW, speaker: { name: "", links: "nope" } } })).details.speaker, undefined);
});

test("a form survives the trip to the server and back", () => {
  const form = {
    ...EMPTY_FORM,
    title: "Build Night",
    subtitle: "Ship something small",
    type: "WORKSHOP",
    mode: "hybrid",
    summary: "An evening of building together.",
    start: "2030-06-15T18:30",
    end: "2030-06-15T21:00",
    location: "Seminar Hall",
    maxAttendees: "80",
    overview: "A first paragraph that is long enough to pass.\n\nA second paragraph, also long enough to pass.",
    highlights: "Free pizza\nBring a laptop",
    whoFor: "Anyone curious",
    bring: "Laptop\nCharger",
    schedule: "# Day 1\n6:30 PM | Doors open",
    rounds: [
      {
        ...EMPTY_ROUND,
        name: "Round 1",
        when: "Day 1",
        tagline: "Ideas",
        body: "A description long enough to clear the floor.",
        scoring: "Creativity\nFeasibility",
      },
    ],
    speakerName: "Ada Lovelace",
    speakerTopic: "Open hardware",
    speakerBio: "A bio that is at least ten characters long.",
    speakerLinks: "Website | https://example.com/",
    registrationLabel: "Register",
    registrationUrl: "https://example.com/rsvp",
    imageUrl: "https://example.com/poster.png",
    tags: "foss, hardware",
  };

  const parsed = parseProposal(buildProposal(form), { checkStart: false });
  const back = formFromEvent({
    title: parsed.title,
    description: parsed.description,
    type: parsed.type,
    location: parsed.location,
    maxAttendees: parsed.maxAttendees,
    date: parsed.date.toISOString(),
    details: parsed.details,
  });

  assert.deepEqual(back, form);
});
