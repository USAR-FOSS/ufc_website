import { test } from "node:test";
import assert from "node:assert/strict";
import { fellSharply, looksWrong } from "./sanity";

/**
 * GitHub totals are meant to only ever grow, or creep down as old days leave the one year window. A total that falls off a cliff is far more
 * likely to be GitHub having a bad moment than a member losing their work, and this module is what tells the two apart. The two thresholds
 * and their exact edges are the whole of it, so they are what these tests pin.
 */

test("a total that did not fall is never sharp", () => {
  assert.equal(fellSharply(40, 40), false);
  assert.equal(fellSharply(40, 41), false);
  assert.equal(fellSharply(0, 0), false);
});

test("below ten, only reaching zero counts as a sharp fall", () => {
  assert.equal(fellSharply(5, 0), true);
  assert.equal(fellSharply(1, 0), true);
  assert.equal(fellSharply(9, 0), true);
  assert.equal(fellSharply(5, 1), false);
  assert.equal(fellSharply(9, 8), false);
});

test("at ten or above, a fall to under seven tenths counts", () => {
  assert.equal(fellSharply(10, 7), false);
  assert.equal(fellSharply(10, 6), true);
  assert.equal(fellSharply(20, 14), false);
  assert.equal(fellSharply(20, 13), true);
  assert.equal(fellSharply(100, 70), false);
  assert.equal(fellSharply(100, 69), true);
});

test("a total that was already zero has not fallen", () => {
  assert.equal(fellSharply(0, 0), false);
});

test("a sharp fall in any one total makes the whole snapshot look wrong", () => {
  const good = { commits: 100, pullRequests: 50, issues: 20 };
  assert.equal(looksWrong(good, good), false);
  assert.equal(looksWrong(good, { ...good, issues: 2 }), true);
  assert.equal(looksWrong(good, { ...good, pullRequests: 5 }), true);
  assert.equal(looksWrong(good, { ...good, commits: 10 }), true);
});

test("a small drift, and a member still at nothing, are not wrong snapshots", () => {
  assert.equal(looksWrong({ commits: 8, pullRequests: 4, issues: 2 }, { commits: 7, pullRequests: 4, issues: 2 }), false);
  assert.equal(looksWrong({ commits: 0, pullRequests: 0, issues: 0 }, { commits: 0, pullRequests: 0, issues: 0 }), false);
});
