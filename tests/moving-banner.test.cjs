const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");
const compiled = ts.transpileModule(readFileSync("app/moving-banner.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const source = { exports: {} };
new Function("module", "exports", compiled)(source, source.exports);
const { normalizeMovingBanner, bannerHref } = source.exports;
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const uiSource = ts.transpileModule(readFileSync("app/components/moving-banner.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const ui = { exports: {} };
new Function("module", "exports", "require", uiSource)(ui, ui.exports, (id) => id === "../moving-banner" ? source.exports : id === "../i18n-shared" ? { tx: (locale, en, ko) => locale === "ko" ? ko : en } : id.endsWith(".css") ? {} : require(id));
test("public banner hides disabled, blank-language and mismatched locations", () => {
  const value = { enabled: true, placement: "works", textKo: "내 작업", textEn: "" };
  const render = (props) => renderToStaticMarkup(React.createElement(ui.exports.MovingBanner, props));
  assert.equal(render({ value: { ...value, enabled: false }, locale: "ko" }), "");
  assert.equal(render({ value, locale: "en" }), "");
  assert.equal(render({ value, locale: "ko", placement: "hero" }), "");
  assert.match(render({ value, locale: "ko", placement: "works" }), /내 작업/);
  const html = render({ value: { ...value, textKo: "<script>alert(1)</script>", href: "javascript:alert(1)" }, locale: "ko" });
  assert.doesNotMatch(html, /<script>|href="javascript:/); assert.match(html, /aria-hidden="true"/);
});
test("editor exposes all four named positions and keeps partial link input", () => {
  const html = renderToStaticMarkup(React.createElement(ui.exports.MovingBannerEditor, { value: { href: "https://ex" }, locale: "ko", onChange: () => {}, listLabel: { ko: "전시 목록 아래", en: "After exhibitions" } }));
  for (const position of ["히어로 아래", "소개 아래", "전시 목록 아래", "문의 위 / 페이지 하단"]) assert.ok(html.includes(position));
  assert.ok(html.includes('value="https://ex"'));
});
test("old pages stay disabled and malformed banner settings have safe defaults", () => {
  assert.equal(normalizeMovingBanner(undefined).enabled, false);
  const config = normalizeMovingBanner({ enabled: "true", placement: "anything", speed: "zero", direction: "other", textKo: "x".repeat(1000) });
  assert.equal(config.enabled, false); assert.equal(config.placement, "hero"); assert.equal(config.speed, "normal"); assert.equal(config.direction, "left"); assert.equal(config.textKo.length, 640);
});
test("localized text and selected placement survive normalization independently", () => {
  for (const placement of ["hero", "about", "works", "contact"]) {
    const config = normalizeMovingBanner({ enabled: true, placement, textKo: "작가의 문장", textEn: "", speed: "fast", direction: "right" });
    assert.equal(config.placement, placement); assert.equal(config.textEn, ""); assert.equal(config.textKo, "작가의 문장"); assert.equal(config.enabled, true);
  }
});
test("links reject executable schemes, credentials and protocol-relative routes", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,x", "//evil.example", "/\\evil.example", "https://user:password@example.com"]) assert.equal(bannerHref(url), "");
  assert.equal(bannerHref("/projects?type=opencall"), "/projects?type=opencall");
  assert.equal(bannerHref("https://example.com/apply"), "https://example.com/apply");
});
