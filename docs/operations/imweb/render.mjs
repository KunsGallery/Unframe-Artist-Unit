// Renders the Imweb product covers (1200 x 1200 PNG) from cover.html.
// Run from the project root: node docs/operations/imweb/render.mjs
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const page = await (await chromium.launch()).newPage({ viewport: { width: 1200, height: 1200 } });
for (const tier of ["member", "founding"]) {
  await page.goto(`${pathToFileURL(path.join(here, "cover.html"))}?tier=${tier}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, `uau-${tier}-1year.png`) });
}
await page.context().browser().close();
