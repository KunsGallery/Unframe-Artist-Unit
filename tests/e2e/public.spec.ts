import { expect, test } from "@playwright/test";

test("artist page is rendered on the server", async ({ request, page }) => {
  const response = await request.get("/artist/e2e-artist");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("이투이 작가");
  expect(html).toContain("Blue Room");
  expect(html).toContain('"@type":"Person"');
  expect(html).not.toContain("Opening the artist");
  await page.goto("/artist/e2e-artist");
  await expect(page.getByRole("heading", { level: 1, name: "이투이 작가" })).toBeVisible();
});

test("work page is rendered on the server and missing works are 404", async ({ request }) => {
  const work = await request.get("/works/e2e-artist~w1");
  expect(work.status()).toBe(200);
  expect(await work.text()).toContain("Blue Room");
  expect((await request.get("/works/e2e-artist~missing")).status()).toBe(404);
});

test("missing public records show the 404 page", async ({ page }) => {
  for (const path of ["/galleries/missing", "/exhibitions/missing", "/no-such-page"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /Explore artists|아티스트 둘러보기/ })).toBeVisible();
  }
});

test("robots and sitemap describe the public site", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /dashboard");
  expect(robots).toContain("Sitemap: https://uau.unframe.kr/sitemap.xml");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("https://uau.unframe.kr/artist/e2e-artist");
  expect(sitemap).toContain("https://uau.unframe.kr/works/e2e-artist~w1");
});

test("share cards are generated", async ({ request }) => {
  for (const path of ["/artist/e2e-artist/opengraph-image", "/works/e2e-artist~w1/opengraph-image"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});

test("artist order lists published artists", async ({ request }) => {
  const body = await (await request.get("/api/artist-order")).json();
  expect(body.order).toEqual(["e2e-artist"]);
  expect(Date.parse(body.nextChange)).toBeGreaterThan(Date.now());
});

test("inquiries API requires sign-in", async ({ request }) => {
  expect((await request.get("/api/inquiries")).status()).toBe(405);
  expect((await request.post("/api/inquiries", { data: { artistSlug: "e2e-artist", message: "Hello there, is this available?" } })).status()).toBe(401);
});
