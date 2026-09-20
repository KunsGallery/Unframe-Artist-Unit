const allowedTags = /<\/?(strong|b|em|i|u|br)(?:\s*\/)?\s*>/gi;

function decodeCommonEntities(value: string) {
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (_, entity: string) => {
    const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };
    return entities[entity] || _;
  });
}

function escapeText(value: string) {
  return decodeCommonEntities(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Keep inline editing intentionally small: text, line breaks, and three safe marks. */
export function sanitizeRichText(value: string) {
  // Firefox and Chromium may represent an Enter press as a block element.
  // Convert those blocks before escaping so saved line breaks survive render.
  const normalizedBlocks = value
    .replace(/<div\b[^>]*>/gi, "<br>")
    .replace(/<\/div\s*>/gi, "")
    .replace(/<p\b[^>]*>/gi, "<br>")
    .replace(/<\/p\s*>/gi, "")
    .replace(/^(?:<br>)+/i, "");
  let output = "";
  let cursor = 0;
  normalizedBlocks.replace(allowedTags, (match, tag: string, offset: number) => {
    output += escapeText(normalizedBlocks.slice(cursor, offset));
    const normalizedTag = tag.toLowerCase() === "b" ? "strong" : tag.toLowerCase() === "i" ? "em" : tag.toLowerCase();
    output += normalizedTag === "br" ? "<br>" : match.trim().startsWith("</") ? "</" + normalizedTag + ">" : "<" + normalizedTag + ">";
    cursor = offset + match.length;
    return match;
  });
  output += escapeText(normalizedBlocks.slice(cursor));
  return output;
}
