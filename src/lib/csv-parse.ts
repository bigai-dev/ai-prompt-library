/**
 * Minimal CSV parser — handles quoted fields and embedded commas.
 * Expects a header row. Returns array of objects keyed by header names.
 *
 * Handles:
 * - Comma-separated values
 * - Double-quoted fields (for values with commas or quotes)
 * - Escaped quotes inside quoted fields ("")
 * - Skips blank lines
 * - Trims field values
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows = tokenize(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Skip completely empty rows
    if (row.every((c) => c.trim() === "")) continue;

    const obj: Record<string, string> = {};
    headers.forEach((key, i) => {
      obj[key] = (row[i] ?? "").trim();
    });
    records.push(obj);
  }

  return records;
}

/**
 * Tokenize CSV text into an array of rows, each row being an array of fields.
 * Honors double-quoted fields.
 */
function tokenize(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // Escaped quote
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\r") {
        // ignore, handled by \n
      } else if (ch === "\n") {
        current.push(field);
        rows.push(current);
        current = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }

  // Flush final field/row
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows;
}
