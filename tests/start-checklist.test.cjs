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
const { getStartChecklist } = loadSource("app/artist-progress.ts");

const work = (n) => ({ id: `w${n}`, title: `Work ${n}`, imageUrl: `https://a/${n}.jpg` });
const complete = { uid: "u", artistName: "Pring", practice: "Painting", basedInCity: "Seoul", country: "South Korea", bio: "x".repeat(40), siteWorks: [work(1), work(2), work(3)], collaborationOpen: true, sitePublished: true };
const done = (list) => Object.fromEntries(list.items.map((item) => [item.id, item.done]));

test("an empty profile has four open steps", () => {
  const list = getStartChecklist(null);
  assert.deepEqual(list.items.map((item) => item.id), ["basics", "works", "inquiries", "publish"]);
  assert.equal(list.doneCount, 0);
  assert.equal(list.total, 4);
  assert.equal(list.complete, false);
});

test("a complete profile is ready", () => {
  const list = getStartChecklist(complete);
  assert.equal(list.doneCount, 4);
  assert.equal(list.complete, true);
});

test("basics need name, practice, city, country and a 40-character bio", () => {
  assert.equal(done(getStartChecklist({ ...complete, bio: "x".repeat(39) })).basics, false);
  assert.equal(done(getStartChecklist({ ...complete, bio: `  ${"x".repeat(40)}  ` })).basics, true);
  assert.equal(done(getStartChecklist({ ...complete, country: "" })).basics, false);
  assert.equal(done(getStartChecklist({ ...complete, artistName: "", displayName: "Pring" })).basics, true);
});

test("works need three with both title and image", () => {
  assert.equal(done(getStartChecklist({ ...complete, siteWorks: [work(1), work(2), { id: "w3", title: "Untitled", imageUrl: "" }] })).works, false);
  assert.equal(done(getStartChecklist({ ...complete, siteWorks: [work(1), work(2), work(3), work(4)] })).works, true);
});

test("partial progress counts each step", () => {
  const list = getStartChecklist({ ...complete, collaborationOpen: false, sitePublished: false });
  assert.deepEqual(done(list), { basics: true, works: true, inquiries: false, publish: false });
  assert.equal(list.doneCount, 2);
});
