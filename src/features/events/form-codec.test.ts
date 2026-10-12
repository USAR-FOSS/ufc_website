import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FORM, EMPTY_ROUND, buildProposal, formFromEvent, linesOf, linksOf, paragraphsOf, scheduleOf } from "./form-codec";

/**
 * The proposal form types its lists as plain text because that is quicker than a row of boxes, and this is the only place that text becomes
 * the shape the server stores. It runs the other way too, so a saved event can be opened and edited again. A change here is a change to what
 * members can submit, and to what they see when they come back to fix it.
 */

test("lines are trimmed and blank ones dropped", () => {
  assert.deepEqual(linesOf("one\n\n  two  \n\t\nthree"), ["one", "two", "three"]);
  assert.deepEqual(linesOf("   \n\n"), []);
});

test("paragraphs are split on a blank line and wrapped lines are joined", () => {
  assert.deepEqual(paragraphsOf("one line\nstill one\n\ntwo"), ["one line still one", "two"]);
  assert.deepEqual(paragraphsOf("   \n\n   "), []);
});

test("a schedule line with a pipe becomes an item with a time", () => {
  assert.deepEqual(scheduleOf("3:00 PM | Welcome"), [{ items: [{ time: "3:00 PM", activity: "Welcome" }] }]);
});

test("a schedule line without a pipe keeps its text and no time, so the server can ask for one", () => {
  assert.deepEqual(scheduleOf("Welcome"), [{ items: [{ time: "", activity: "Welcome" }] }]);
});

test("a hash line names the day under it", () => {
  assert.deepEqual(scheduleOf("# Day 1\n6:30 PM | Doors\n## Day 2\n10:00 AM | Kickoff"), [
    { day: "Day 1", items: [{ time: "6:30 PM", activity: "Doors" }] },
    { day: "Day 2", items: [{ time: "10:00 AM", activity: "Kickoff" }] },
  ]);
});

test("a day with nothing under it is left out", () => {
  assert.deepEqual(scheduleOf("# Day 1\n# Day 2\n10:00 AM | Kickoff"), [
    { day: "Day 2", items: [{ time: "10:00 AM", activity: "Kickoff" }] },
  ]);
});

test("a pipe inside the activity is kept", () => {
  assert.deepEqual(scheduleOf("3:00 PM | Talk | questions"), [{ items: [{ time: "3:00 PM", activity: "Talk | questions" }] }]);
});

test("links split on the first pipe, and a bare address becomes a link with no label", () => {
  assert.deepEqual(linksOf("Website | https://example.com"), [{ label: "Website", href: "https://example.com" }]);
  assert.deepEqual(linksOf("https://example.com"), [{ label: "", href: "https://example.com" }]);
});

test("the request body carries what the server expects", () => {
  const body = buildProposal({
    ...EMPTY_FORM,
    title: "Build Night",
    summary: "An evening of building together.",
    start: "2030-06-15T18:30",
    location: "Seminar Hall",
    maxAttendees: "80",
    overview: "A first paragraph.\n\nA second paragraph.",
    highlights: "Free pizza\nBring a laptop",
    tags: " foss , , hardware ",
    imageUrl: "   ",
  });

  assert.equal(body.title, "Build Night");
  assert.equal(body.description, "An evening of building together.");
  assert.equal(body.location, "Seminar Hall");
  assert.equal(body.maxAttendees, 80);
  assert.equal(body.date, new Date("2030-06-15T18:30").toISOString());
  assert.deepEqual(body.details.overview, ["A first paragraph.", "A second paragraph."]);
  assert.deepEqual(body.details.highlights, ["Free pizza", "Bring a laptop"]);
  assert.deepEqual(body.details.tags, ["foss", "hardware"]);
  assert.equal(body.details.imageUrl, undefined);
});

test("a blank attendee count is left out rather than sent as nothing", () => {
  assert.equal(buildProposal({ ...EMPTY_FORM, maxAttendees: "" }).maxAttendees, undefined);
});

test("round scoring goes as one line per mark", () => {
  const body = buildProposal({
    ...EMPTY_FORM,
    rounds: [{ ...EMPTY_ROUND, name: "Round 1", scoring: "Creativity\nFeasibility" }],
  });
  assert.deepEqual(body.details.rounds, [{ name: "Round 1", when: "", tagline: "", body: "", scoring: ["Creativity", "Feasibility"] }]);
});

test("an event with no details comes back as a form with only its basics filled in", () => {
  const form = formFromEvent({
    title: "Build Night",
    description: "An evening of building together.",
    type: "workshop",
    location: "Seminar Hall",
    maxAttendees: 50,
    date: "2030-06-15T13:00:00.000Z",
  });

  assert.equal(form.title, "Build Night");
  assert.equal(form.type, "WORKSHOP");
  assert.equal(form.mode, "in-person");
  assert.equal(form.maxAttendees, "50");
  assert.equal(form.overview, "");
  assert.deepEqual(form.rounds, []);
  assert.equal(form.schedule, "");
  assert.equal(new Date(form.start).toISOString(), "2030-06-15T13:00:00.000Z");
});

test("a stored schedule, speaker and tags come back as editable text", () => {
  const form = formFromEvent({
    title: "Build Night",
    description: "An evening of building together.",
    type: "WORKSHOP",
    location: "Seminar Hall",
    maxAttendees: 50,
    date: "2030-06-15T13:00:00.000Z",
    details: {
      schedule: [{ day: "Day 1", items: [{ time: "6:30 PM", activity: "Doors" }] }],
      speaker: { name: "Ada", bio: "A bio long enough.", topic: "Hardware", links: [{ label: "Site", href: "https://example.com/" }] },
      tags: ["foss", "hardware"],
      rounds: [{ name: "Round 1", when: "Day 1", tagline: "Ideas", body: "A description.", scoring: ["Creativity"] }],
    },
  });

  assert.equal(form.schedule, "# Day 1\n6:30 PM | Doors");
  assert.equal(form.speakerLinks, "Site | https://example.com/");
  assert.equal(form.tags, "foss, hardware");
  assert.equal(form.rounds[0].scoring, "Creativity");
  assert.equal(form.rounds[0].name, "Round 1");
});
