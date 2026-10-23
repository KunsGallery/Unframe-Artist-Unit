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

test("windows change at 00:00, 08:00 and 16:00 Korea time", () => {
  // 2026-10-24 07:59 KST = 2026-10-23 22:59 UTC
  const before = orderWindow(new Date("2026-10-23T22:59:00Z"));
  const after = orderWindow(new Date("2026-10-23T23:00:00Z"));
  assert.notEqual(before.seed, after.seed);
  assert.equal(after.nextChange.toISOString(), "2026-10-24T07:00:00.000Z");
  assert.equal(orderWindow(new Date("2026-10-24T06:59:59Z")).seed, after.seed);
  assert.equal(orderWindow(new Date("2026-10-24T15:00:00Z")).nextChange.toISOString(), "2026-10-24T23:00:00.000Z");
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
