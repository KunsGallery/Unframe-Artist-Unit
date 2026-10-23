const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");
function loadSource(path) {
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", compiled)(module, module.exports, require);
  return module.exports;
}
const { orderWindow, orderSlugs } = loadSource("app/artist-order.ts");

test("windows change at 10:00 and 18:00 Korea time", () => {
  // 2026-10-24 09:59 KST = 2026-10-24 00:59 UTC
  const night = orderWindow(new Date("2026-10-24T00:59:00Z"));
  const day = orderWindow(new Date("2026-10-24T01:00:00Z"));
  assert.notEqual(night.seed, day.seed);
  assert.equal(night.nextChange.toISOString(), "2026-10-24T01:00:00.000Z");
  assert.equal(day.nextChange.toISOString(), "2026-10-24T09:00:00.000Z");
  assert.equal(orderWindow(new Date("2026-10-24T08:59:59Z")).seed, day.seed);
  // The evening window runs overnight: 18:00 through 09:59 the next morning.
  const evening = orderWindow(new Date("2026-10-24T09:00:00Z"));
  assert.notEqual(evening.seed, day.seed);
  assert.equal(orderWindow(new Date("2026-10-24T15:30:00Z")).seed, evening.seed);
  assert.equal(orderWindow(new Date("2026-10-25T00:59:59Z")).seed, evening.seed);
  assert.equal(evening.nextChange.toISOString(), "2026-10-25T01:00:00.000Z");
  // Midnight is not a boundary.
  assert.equal(orderWindow(new Date("2026-10-24T14:59:00Z")).seed, orderWindow(new Date("2026-10-24T15:01:00Z")).seed);
  // Seeds never repeat on later days.
  assert.notEqual(orderWindow(new Date("2026-10-25T01:00:00Z")).seed, day.seed);
});

test("order is stable within a window and differs across windows", () => {
  const slugs = Array.from({ length: 40 }, (_, index) => `artist-${index}`);
  const a = orderSlugs(slugs, "w1");
  assert.deepEqual(orderSlugs([...slugs].reverse(), "w1"), a);
  assert.notDeepEqual(orderSlugs(slugs, "w2"), a);
  assert.deepEqual([...a].sort(), [...slugs].sort());
});

test("a new artist does not reshuffle the others", () => {
  const slugs = Array.from({ length: 30 }, (_, index) => `artist-${index}`);
  const before = orderSlugs(slugs, "w1");
  const after = orderSlugs([...slugs, "newcomer"], "w1").filter((slug) => slug !== "newcomer");
  assert.deepEqual(after, before);
});

test("alphabetical leaders are not always first", () => {
  const slugs = Array.from({ length: 26 }, (_, index) => String.fromCharCode(97 + index));
  const firsts = new Set(["w1", "w2", "w3", "w4", "w5", "w6"].map((seed) => orderSlugs(slugs, seed)[0]));
  assert.ok(firsts.size > 1);
});
