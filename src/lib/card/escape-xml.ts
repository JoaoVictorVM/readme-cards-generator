// C0 controls other than tab, newline and carriage return, plus the two
// non-characters, are illegal in XML 1.0 and cannot be represented by entities.
const ILLEGAL_XML_CHARACTERS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g;

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeXml(value: string): string {
  return value
    .replace(ILLEGAL_XML_CHARACTERS, "")
    .replace(/[&<>"']/g, (character) => ENTITIES[character] ?? character);
}
