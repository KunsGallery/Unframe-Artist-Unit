const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");
function loadSource(path, deps = {}) {
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", compiled)(module, module.exports, (name) => deps[name] ?? require(name));
  return module.exports;
}
const order = loadSource("app/artist-order.ts");
const seal = loadSource("app/membership-seal.ts");
const { pickSpotlight } = loadSource("app/member-spotlight.ts", { "./artist-order": order, "./membership-seal": seal });

const now = new Date("2026-10-24T03:00:00Z");
const work = (id, imageUrl = `https://a/${id}.jpg`) => ({ id, title: `Work ${id}`, imageUrl });
const member = (slug, extra = {}) => ({ slug, displayName: slug, published: true, membership: { tier: "member" }, siteWorks: [work(`${slug}-1`)], ...extra });

test("only active paid members with a work image are featured", () => {
  const picked = pickSpotlight([
    member("a"),
    member("expired", { membership: { tier: "member", expiresAt: "2026-01-01" } }),
    member("free", { membership: undefined }),
    member("no-image", { siteWorks: [work("x", "")] }),
    member("demo", { isDemonstration: true }),
    member("founder", { membership: { tier: "founding" } }),
  ], "d1a", now);
  assert.deepEqual(picked.map((item) => item.profile.slug).sort(), ["a", "founder"]);
});

test("the lead work is the first one with an image", () => {
  const [item] = pickSpotlight([member("a", { siteWorks: [work("blank", ""), work("second")] })], "d1a", now);
  assert.equal(item.work.id, "second");
});

test("at most four are shown and the window seed sets the order", () => {
  const all = ["a", "b", "c", "d", "e", "f"].map((slug) => member(slug));
  const morning = pickSpotlight(all, "d1a", now).map((item) => item.profile.slug);
  assert.equal(morning.length, 4);
  assert.deepEqual(morning, order.orderSlugs(all.map((item) => item.slug), "d1a").slice(0, 4));
  assert.deepEqual(pickSpotlight(all, "d1a", now).map((item) => item.profile.slug), morning);
  assert.equal(pickSpotlight(all, "d1a", now, 3).length, 3);
});
