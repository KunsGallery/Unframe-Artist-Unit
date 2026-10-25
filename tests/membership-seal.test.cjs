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
const { activeSealTier, sealVariant, sealTiers, normalizeMembership } = loadSource("app/membership-seal.ts");

const now = new Date("2026-10-24T03:00:00Z"); // 12:00 KST

test("no membership or an unknown tier shows no seal", () => {
  assert.equal(activeSealTier(undefined, now), null);
  assert.equal(activeSealTier(null, now), null);
  assert.equal(activeSealTier({ tier: "gold" }, now), null);
});

test("a paid tier without an end date stays active", () => {
  assert.equal(activeSealTier({ tier: "member" }, now), "member");
  assert.equal(activeSealTier({ tier: "founding" }, now), "founding");
});

test("a membership lasts through its last day in Korea time", () => {
  assert.equal(activeSealTier({ tier: "member", expiresAt: "2026-10-24" }, now), "member");
  assert.equal(activeSealTier({ tier: "member", expiresAt: "2026-10-24" }, new Date("2026-10-24T14:59:00Z")), "member");
  assert.equal(activeSealTier({ tier: "member", expiresAt: "2026-10-24" }, new Date("2026-10-24T15:00:00Z")), null);
  assert.equal(activeSealTier({ tier: "member", expiresAt: "2026-10-23" }, now), null);
});

test("a membership that has not started yet shows no seal", () => {
  assert.equal(activeSealTier({ tier: "member", startedAt: "2026-11-01" }, now), null);
  assert.equal(activeSealTier({ tier: "member", startedAt: "2026-10-24" }, now), "member");
});

test("seal detail follows the size rules", () => {
  assert.equal(sealVariant(40), "full");
  assert.equal(sealVariant(132), "full");
  assert.equal(sealVariant(39), "letter");
  assert.equal(sealVariant(13), "letter");
  assert.equal(sealVariant(12), "mini");
});

test("member is blue with one ring, founding is ink with two", () => {
  assert.deepEqual([sealTiers.member.color, sealTiers.member.rings], ["#1438ee", 1]);
  assert.deepEqual([sealTiers.founding.color, sealTiers.founding.rings], ["#171817", 2]);
});

test("admin input is normalized before saving", () => {
  assert.equal(normalizeMembership({ tier: "" }), null);
  assert.deepEqual(normalizeMembership({ tier: "member", startedAt: "2026-10-24", expiresAt: "" }), { tier: "member", startedAt: "2026-10-24" });
  assert.throws(() => normalizeMembership({ tier: "member", expiresAt: "24/10/2026" }));
  assert.throws(() => normalizeMembership({ tier: "member", startedAt: "2026-10-24", expiresAt: "2026-10-01" }));
});
