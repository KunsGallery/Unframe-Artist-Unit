// Anonymous REST reads respect published-only Firestore rules. Never use admin
// credentials here: server-rendered pages and metadata must not expose drafts.

type Value = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: { fields?: Record<string, Value> };
  arrayValue?: { values?: Value[] };
};
type RestDocument = { name?: string; fields?: Record<string, Value>; updateTime?: string };
export type PublicCollection = "public_profiles" | "galleries" | "exhibitions";
export type PublicRecord = Record<string, unknown> & { id: string; updateTime?: string };

function decode(value: Value): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decode(item)]));
  return null;
}

function toRecord(document: RestDocument): PublicRecord {
  const data = Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, decode(value)]));
  return { ...data, id: decodeURIComponent(document.name?.split("/").pop() || ""), updateTime: document.updateTime };
}

function isPublic(record: Record<string, unknown>) {
  return record.published === true && record.isDemonstration !== true;
}

// FIRESTORE_EMULATOR_HOST lets local checks render against the emulator.
export function documentsUrl() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!project) return null;
  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  const origin = emulator ? `http://${emulator}` : "https://firestore.googleapis.com";
  return `${origin}/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents`;
}

export async function readPublicDocument(collection: PublicCollection, id: string): Promise<PublicRecord | null> {
  const base = documentsUrl();
  if (!base || !id) return null;
  try {
    const response = await fetch(`${base}/${collection}/${encodeURIComponent(id)}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const record = toRecord(await response.json() as RestDocument);
    return isPublic(record) ? record : null;
  } catch { return null; }
}

// Lists published records for the sitemap. Only `fields` are transferred.
export async function listPublicDocuments(collection: PublicCollection, fields: string[], max = 5000): Promise<PublicRecord[]> {
  const base = documentsUrl();
  if (!base) return [];
  const structuredQuery = {
    from: [{ collectionId: collection }],
    where: { fieldFilter: { field: { fieldPath: "published" }, op: "EQUAL", value: { booleanValue: true } } },
    select: { fields: Array.from(new Set([...fields, "published", "isDemonstration"])).map((fieldPath) => ({ fieldPath })) },
    limit: max,
  };
  try {
    const response = await fetch(`${base}:runQuery`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ structuredQuery }), next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];
    const rows = await response.json() as Array<{ document?: RestDocument }>;
    return rows.flatMap((row) => row.document ? [toRecord(row.document)] : []).filter(isPublic);
  } catch { return []; }
}
