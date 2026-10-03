const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");
const { Timestamp, serverTimestamp } = require("firebase/firestore");
function loadSource(path) {
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", compiled)(module, module.exports, require);
  return module.exports;
}
const { firestoreValues } = loadSource("app/firestore-values.ts");
const { getArtistSiteSections, normalizeArtistSiteSections } = loadSource("app/artist/site-config.ts");
test("undefined values are omitted recursively, without destroying Firestore values", () => {
  const timestamp = Timestamp.now();
  const sentinel = serverTimestamp();
  const value = firestoreValues({ missing: undefined, zero: 0, flag: false, empty: "", nested: { missing: undefined, title: "Work" }, entries: [{ missing: undefined, title: "CV" }], timestamp, sentinel });
  assert.equal(Object.hasOwn(value, "missing"), false);
  assert.deepEqual(value.nested, { title: "Work" });
  assert.deepEqual(value.entries, [{ title: "CV" }]);
  assert.equal(value.zero, 0); assert.equal(value.flag, false);
  assert.equal(value.timestamp, timestamp); assert.equal(value.sentinel, sentinel);
});
test("empty sections are omitted consistently from public navigation and content", () => {
  const profile = { siteSections: ["works", "cv", "exhibitions", "about", "studioArchive", "inspiration"] };
  assert.deepEqual(getArtistSiteSections(profile), ["works"]);
  assert.deepEqual(getArtistSiteSections({ ...profile, artistStatement: "First paragraph\n\nSecond paragraph", siteExhibitions: [{ title: "Solo show", category: "solo", eventDate: "2099-01-01" }] }), ["works", "cv", "exhibitions", "about"]);
  assert.deepEqual(normalizeArtistSiteSections(["cv", "cv", "not-a-section", "works"]), ["cv", "works", "about"]);
  assert.deepEqual(normalizeArtistSiteSections([]), ["works", "about", "cv"]);
  assert.deepEqual(getArtistSiteSections({ siteSections: ["works"], bio: "Artist note", artistCv: "Earlier record" }), ["works", "about", "cv"]);
  assert.deepEqual(getArtistSiteSections({ ...profile, siteExhibitions: [{ title: "Past exhibition", eventDate: "2001-01-01" }] }), ["works", "cv"]);
});
