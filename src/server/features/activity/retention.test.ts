import { test } from "node:test";
import assert from "node:assert/strict";
import { ACTIVITY_RETENTION_MS, SERVICE_ACTIVITY_TYPES, activityCutoff, expired, notExpired } from "./retention";

/**
 * Activity the syncs re-import is worth keeping for a while and no longer, while anything about the club's own events and members is part of
 * the record and must never be hidden by age. One definition feeds the cleanup job, the imports and every list, so the window and the split
 * between the two kinds are what these tests hold.
 */

type DateFilter = { lt?: Date; gte?: Date };
type TypeFilter = { in?: readonly string[]; notIn?: readonly string[] };
type Filter = { OR?: [TypeFilter, { createdAt?: DateFilter }]; type?: TypeFilter; createdAt?: DateFilter };

test("activity from a service is kept for thirty six hours", () => {
  const earliest = Date.now() - ACTIVITY_RETENTION_MS;
  const cutoff = activityCutoff().getTime();
  const latest = Date.now() - ACTIVITY_RETENTION_MS;
  assert.ok(cutoff >= earliest && cutoff <= latest, earliest + " <= " + cutoff + " <= " + latest);
});

test("the kinds that expire are exactly the ones a sync re-imports", () => {
  assert.deepEqual(SERVICE_ACTIVITY_TYPES, ["COMMIT", "PULL_REQUEST", "ISSUE", "LEETCODE_EASY", "LEETCODE_MEDIUM", "LEETCODE_HARD"]);
  const own = ["EVENT_JOIN", "EVENT_CREATE", "MEMBER_JOIN", "EVENT_PROPOSAL", "EVENT_APPROVED", "EVENT_REJECTED"];
  for (const kind of own) {
    assert.ok(!(SERVICE_ACTIVITY_TYPES as string[]).includes(kind), kind + " is the club's own record and must never expire");
  }
});

test("the cleanup filter wants service activity older than the cutoff, and only that", () => {
  const filter = expired() as unknown as Filter;
  assert.deepEqual(filter.type, { in: SERVICE_ACTIVITY_TYPES });
  const cutoff = filter.createdAt?.lt;
  if (!(cutoff instanceof Date)) throw new Error("the cutoff should be a moment, not a comparison");
  assert.ok(Math.abs(cutoff.getTime() - (Date.now() - ACTIVITY_RETENTION_MS)) < 1000);
});

test("the list filter keeps every other kind, and recent service activity", () => {
  const filter = notExpired() as unknown as Filter;
  assert.deepEqual(filter.OR?.[0], { type: { notIn: SERVICE_ACTIVITY_TYPES } });
  const cutoff = filter.OR?.[1]?.createdAt?.gte;
  if (!(cutoff instanceof Date)) throw new Error("the cutoff should be a moment, not a comparison");
  assert.ok(Math.abs(cutoff.getTime() - (Date.now() - ACTIVITY_RETENTION_MS)) < 1000);
});

test("a row just past the window and a row well inside it land on opposite sides", () => {
  const justTooOld = Date.now() - ACTIVITY_RETENTION_MS - 60_000;
  assert.ok(justTooOld < activityCutoff().getTime());
  const comfortablyFresh = Date.now() - 60_000;
  assert.ok(comfortablyFresh >= activityCutoff().getTime());
});
