// Pure helpers shared by public views and regression tests.
export async function collectArchivePages<T, C>(readPage: (cursor?: C) => Promise<{ items: T[]; cursor?: C; hasMore: boolean }>, cancelled: () => boolean): Promise<T[] | null> {
  const items: T[] = [];
  let cursor: C | undefined;
  do {
    const page = await readPage(cursor);
    if (cancelled()) return null;
    items.push(...page.items);
    if (!page.hasMore) return items;
    if (page.cursor === undefined) throw new Error("Missing archive cursor");
    cursor = page.cursor;
  } while (true);
}
export function normalizeWorkRefs(value: unknown): { artistSlug: string; workId: string }[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, { artistSlug: string; workId: string }>();
  for (const item of value) {
    if (!item || typeof item.artistSlug !== "string" || typeof item.workId !== "string" || !item.artistSlug.trim() || !item.workId.trim()) continue;
    unique.set(JSON.stringify([item.artistSlug, item.workId]), { artistSlug: item.artistSlug, workId: item.workId });
  }
  return Array.from(unique.values());
}
