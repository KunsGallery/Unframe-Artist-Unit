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
const { getReviewStatus } = loadSource("app/artist-progress.ts");

const work = (n) => ({ id: `w${n}`, title: `Work ${n}`, imageUrl: `https://a/${n}.jpg` });
const ready = { uid: "u", artistName: "Pring", practice: "Painting", basedInCity: "Seoul", country: "South Korea", bio: "x".repeat(40), siteWorks: [work(1), work(2), work(3)] };

test("no application means no review card", () => {
  assert.equal(getReviewStatus(null, ready).state, "none");
});

test("a pending application with gaps is still being prepared", () => {
  const status = getReviewStatus({ id: "a", applicationStatus: "pending" }, { ...ready, siteWorks: [work(1)] });
  assert.equal(status.state, "preparing");
  assert.deepEqual(status.missing, ["works"]);
});

test("a pending application with details and three works is in review", () => {
  const status = getReviewStatus({ id: "a", applicationStatus: "pending" }, ready);
  assert.equal(status.state, "in-review");
  assert.deepEqual(status.missing, []);
});

test("approval wins from either record and carries the artist number", () => {
  assert.equal(getReviewStatus({ id: "a", applicationStatus: "approved" }, null).state, "approved");
  const status = getReviewStatus({ id: "a", applicationStatus: "pending" }, { ...ready, verificationStatus: "approved", uauArtistId: "U.A.U. 012" });
  assert.equal(status.state, "approved");
  assert.equal(status.artistId, "U.A.U. 012");
});

test("a held application asks for changes", () => {
  assert.equal(getReviewStatus({ id: "a", applicationStatus: "rejected" }, ready).state, "on-hold");
});
