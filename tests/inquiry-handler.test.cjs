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
const { handleInquiry } = loadSource("app/server/inquiry-handler.ts");
const { inquiryPurposes } = loadSource("app/inquiry-purposes.ts");
const { buildArtistMail, buildRequesterMail } = loadSource("app/server/inquiry-email.ts");

const profile = { ownerUid: "artist-uid", artistName: "프링", published: true, siteWorks: [{ id: "w1", title: "Blue Room", imageUrl: "https://a/w1.jpg", year: "2026", medium: "Oil", dimensions: "10x10" }, { id: "w2", title: "", imageUrl: "https://a/w2.jpg" }] };
const message = "Is this work still available?";

function deps(overrides = {}) {
  const calls = { saved: [], sent: [] };
  const value = {
    verifyToken: async () => ({ uid: "requester-uid", email: "req@x.com", name: "Kim", emailVerified: true }),
    readProfile: async () => profile,
    saveInquiry: async (_token, data) => { calls.saved.push(data); return { id: "inq1" }; },
    lookupEmail: async () => "artist@x.com",
    send: async (mail) => { calls.sent.push(mail); return true; },
    buildArtistMail, buildRequesterMail, purposes: inquiryPurposes,
    config: { from: "u.a.u <hello@uau.unframe.kr>", siteUrl: "https://uau.unframe.kr", mailEnabled: true },
    ...overrides,
  };
  return { value, calls };
}

test("missing token is rejected before saving", async () => {
  const { value, calls } = deps();
  assert.equal((await handleInquiry(undefined, { artistSlug: "pring", workId: "w1", message }, value)).status, 401);
  assert.equal(calls.saved.length, 0);
});

test("invalid token is rejected", async () => {
  const { value, calls } = deps({ verifyToken: async () => { throw new Error("bad"); } });
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value)).status, 401);
  assert.equal(calls.saved.length, 0);
});

test("token without email is rejected", async () => {
  const { value, calls } = deps({ verifyToken: async () => ({ uid: "u" }) });
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value)).status, 400);
  assert.equal(calls.saved.length, 0);
});

test("message length is bounded to 10-2000 characters", async () => {
  const { value } = deps();
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "w1", message: "123456789" }, value)).status, 400);
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "w1", message: "x".repeat(2001) }, value)).status, 400);
  assert.equal((await handleInquiry("t", null, value)).status, 400);
});

test("unpublished artist returns 404", async () => {
  const { value, calls } = deps({ readProfile: async () => null });
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value)).status, 404);
  assert.equal(calls.saved.length, 0);
});

test("missing or incomplete work returns 404", async () => {
  const { value, calls } = deps();
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "gone", message }, value)).status, 404);
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "w2", message }, value)).status, 404);
  assert.equal(calls.saved.length, 0);
});

test("work inquiry stores only server-derived allow-listed fields", async () => {
  const { value, calls } = deps();
  const result = await handleInquiry("t", { artistSlug: "pring", workId: "w1", message: `  ${message}  `, workTitle: "forged", requesterEmail: "forged@x.com", recipientUid: "forged" }, value);
  assert.equal(result.status, 200);
  assert.deepEqual(calls.saved[0], { requesterUid: "requester-uid", requesterName: "Kim", requesterEmail: "req@x.com", recipientUid: "artist-uid", artistSlug: "pring", workId: "w1", workTitle: "Blue Room", artworkImageUrl: "https://a/w1.jpg", artworkYear: "2026", artworkMedium: "Oil", artworkDimensions: "10x10", message, status: "new" });
});

test("contact inquiry uses the purpose label in the request locale", async () => {
  const { value, calls } = deps();
  assert.equal((await handleInquiry("t", { artistSlug: "pring", purpose: "curation", locale: "ko", message }, value)).status, 200);
  assert.equal(calls.saved[0].workId, "artist-profile");
  assert.equal(calls.saved[0].workTitle, "전시·기획 제안");
  assert.equal((await handleInquiry("t", { artistSlug: "pring", purpose: "nope", message }, value)).status, 400);
});

test("requester name falls back to email", async () => {
  const { value, calls } = deps({ verifyToken: async () => ({ uid: "u", email: "req@x.com" }) });
  await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value);
  assert.equal(calls.saved[0].requesterName, "req@x.com");
});

test("rules rejection returns 403 and sends nothing", async () => {
  const { value, calls } = deps({ saveInquiry: async () => ({ status: 403 }) });
  assert.equal((await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value)).status, 403);
  assert.equal(calls.sent.length, 0);
});

test("happy path emails artist then requester", async () => {
  const { value, calls } = deps();
  const result = await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value);
  assert.deepEqual(result, { status: 200, body: { ok: true, id: "inq1", emailed: true } });
  assert.equal(calls.sent.length, 2);
  assert.deepEqual(calls.sent[0].to, ["artist@x.com"]);
  assert.equal(calls.sent[0].reply_to, "req@x.com");
  assert.deepEqual(calls.sent[1].to, ["req@x.com"]);
});

test("unknown artist email skips only the artist mail", async () => {
  const { value, calls } = deps({ lookupEmail: async () => null });
  const result = await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value);
  assert.equal(result.status, 200);
  assert.equal(result.body.emailed, false);
  assert.equal(calls.sent.length, 1);
  assert.deepEqual(calls.sent[0].to, ["req@x.com"]);
});

test("mail failure still saves the inquiry", async () => {
  const { value } = deps({ send: async () => { throw new Error("resend down"); }, lookupEmail: async () => { throw new Error("admin down"); } });
  const result = await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value);
  assert.deepEqual(result, { status: 200, body: { ok: true, id: "inq1", emailed: false } });
});

test("disabled mail sends nothing", async () => {
  const { value, calls } = deps({ config: { siteUrl: "https://uau.unframe.kr", mailEnabled: false } });
  const result = await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value);
  assert.equal(result.body.emailed, false);
  assert.equal(calls.sent.length, 0);
});

test("unverified requester email gets no receipt but the artist is still told", async () => {
  const { value, calls } = deps({ verifyToken: async () => ({ uid: "u", email: "someone@else.com", name: "Kim", emailVerified: false }) });
  const result = await handleInquiry("t", { artistSlug: "pring", workId: "w1", message }, value);
  assert.equal(result.status, 200);
  assert.equal(result.body.emailed, true);
  assert.equal(calls.sent.length, 1);
  assert.deepEqual(calls.sent[0].to, ["artist@x.com"]);
});
