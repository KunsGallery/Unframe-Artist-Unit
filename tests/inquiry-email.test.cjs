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
const { buildArtistMail, buildRequesterMail } = loadSource("app/server/inquiry-email.ts");

const siteUrl = "https://uau.unframe.kr";
const input = { artistName: "프링", artistSlug: "pring", subjectLabel: "Blue Room", workTitle: "Blue Room", workMeta: "2026 · Oil", imageUrl: "https://assets.example/work.jpg", message: "Is this work available?", requesterName: "Kim", requesterEmail: "a@b.com" };

test("artist mail replies to requester and links the dashboard", () => {
  const mail = buildArtistMail(input, { from: "u.a.u <hello@uau.unframe.kr>", to: "artist@x.com", siteUrl });
  assert.equal(mail.reply_to, "a@b.com");
  assert.deepEqual(mail.to, ["artist@x.com"]);
  assert.equal(mail.subject, "[u.a.u] 새 문의 — Blue Room");
  assert.ok(mail.html.includes(`${siteUrl}/dashboard/inquiries`));
});

test("copy address becomes bcc only when configured", () => {
  assert.deepEqual(buildArtistMail(input, { from: "f@x.com", to: "artist@x.com", copyTo: "ops@x.com", siteUrl }).bcc, ["ops@x.com"]);
  assert.equal(buildArtistMail(input, { from: "f@x.com", to: "artist@x.com", siteUrl }).bcc, undefined);
});

test("user text is escaped and newlines kept", () => {
  const message = "<script>x</script>\nline & two";
  const mail = buildArtistMail({ ...input, message, requesterName: "<b>Kim</b>" }, { from: "f@x.com", to: "artist@x.com", siteUrl });
  assert.ok(mail.html.includes("&lt;script&gt;"));
  assert.ok(mail.html.includes("<br>"));
  assert.ok(mail.html.includes("&amp;"));
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(!mail.html.includes("<b>Kim</b>"));
  assert.ok(mail.text.includes(message));
});

test("requester receipt names the artist", () => {
  const mail = buildRequesterMail(input, { from: "f@x.com", siteUrl });
  assert.equal(mail.subject, "[u.a.u] 프링 작가에게 문의가 전달되었습니다");
  assert.deepEqual(mail.to, ["a@b.com"]);
  assert.ok(mail.html.includes(`${siteUrl}/artist/pring`));
  assert.equal(mail.reply_to, undefined);
});

test("non-https images are left out", () => {
  const mail = buildArtistMail({ ...input, imageUrl: "javascript:alert(1)" }, { from: "f@x.com", to: "artist@x.com", siteUrl });
  assert.ok(!mail.html.includes("javascript:"));
});
