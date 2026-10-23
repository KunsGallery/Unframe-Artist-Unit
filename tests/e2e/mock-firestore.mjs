// Minimal stand-in for the Firestore REST API used by server-rendered pages.
// Synthetic data only; started by playwright.config.ts.
import http from "node:http";

const port = Number(process.env.MOCK_FIRESTORE_PORT || 8899);
const project = "projects/demo-uau/databases/(default)/documents";
const str = (value) => ({ stringValue: value });
const work = (id, title, year) => ({ mapValue: { fields: { id: str(id), title: str(title), year: str(year), medium: str("Oil on linen"), imageUrl: str(`https://example.invalid/${id}.jpg`) } } });
const artist = {
  name: `${project}/public_profiles/e2e-artist`,
  fields: {
    published: { booleanValue: true }, accountType: str("artist"), ownerUid: str("e2e-owner"), displayName: str("E2E Artist"), artistName: str("이투이 작가"),
    practice: str("Painting"), basedInCity: str("Seoul"), country: str("South Korea"), bio: str("Paints rooms that stay open after the exhibition ends."),
    siteTemplate: str("editorial"), siteWorks: { arrayValue: { values: [work("w1", "Blue Room", "2026"), work("w2", "Second Light", "2025")] } },
    updatedAt: { timestampValue: "2026-10-01T00:00:00Z" },
  },
  updateTime: "2026-10-01T00:00:00Z",
};
const docs = { "public_profiles/e2e-artist": artist };

http.createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    response.setHeader("content-type", "application/json");
    if (request.method === "POST" && request.url.endsWith(":runQuery")) {
      const collection = JSON.parse(body).structuredQuery.from[0].collectionId;
      return response.end(JSON.stringify(Object.entries(docs).filter(([key]) => key.startsWith(`${collection}/`)).map(([, document]) => ({ document }))));
    }
    const key = Object.keys(docs).find((path) => request.url.endsWith(`/documents/${path}`));
    if (request.method === "GET" && key) return response.end(JSON.stringify(docs[key]));
    response.statusCode = 404;
    response.end(JSON.stringify({ error: { code: 404 } }));
  });
}).listen(port, () => console.log(`mock firestore on ${port}`));
