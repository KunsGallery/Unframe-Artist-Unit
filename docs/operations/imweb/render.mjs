// Renders the Imweb product images from cover.html and detail.html.
// Run from the project root: node docs/operations/imweb/render.mjs
//   covers  → uau-<tier>-1year.png (1200 x 1200)
//   details → detail/<tier>/NN.jpg (1500 px wide, one image per section, upload in order)
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const tiers = ["member", "founding"];

const cover = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
for (const tier of tiers) {
  await cover.goto(`${pathToFileURL(path.join(here, "cover.html"))}?tier=${tier}`);
  await cover.evaluate(() => document.fonts.ready);
  await cover.screenshot({ path: path.join(here, `uau-${tier}-1year.png`) });
}

const detail = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 1.5 });
for (const tier of tiers) {
  const out = path.join(here, "detail", tier);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await detail.goto(`${pathToFileURL(path.join(here, "detail.html"))}?tier=${tier}`);
  await detail.evaluate(() => document.fonts.ready);
  await detail.waitForLoadState("networkidle");
  const slices = await detail.locator("section.slice").all();
  for (const [index, slice] of slices.entries()) {
    await slice.screenshot({ path: path.join(out, `${String(index + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 88 });
  }
}
await browser.close();
