/**
 * Parse CSV text with quoted fields (handles commas and newlines inside quotes).
 * Returns array of objects: first row = headers, each row = object with header keys.
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      let field = "";
      if (csvText[i] === '"') {
        i++;
        while (i < len) {
          if (csvText[i] === '"') {
            i++;
            if (csvText[i] === '"') {
              field += '"';
              i++;
            } else break;
          } else {
            field += csvText[i];
            i++;
          }
        }
        row.push(field);
        if (csvText[i] === ",") i++;
        else if (csvText[i] === "\r") { i++; if (csvText[i] === "\n") i++; break; }
        else if (csvText[i] === "\n" || i >= len) { i++; break; }
        else i++;
      } else {
        while (i < len && csvText[i] !== "," && csvText[i] !== "\n" && csvText[i] !== "\r") {
          field += csvText[i];
          i++;
        }
        row.push(field.trim());
        if (csvText[i] === ",") i++;
        else if (csvText[i] === "\r") { i++; if (csvText[i] === "\n") i++; break; }
        else if (csvText[i] === "\n" || i >= len) { i++; break; }
      }
    }
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  const result: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (rows[r][c] ?? "").trim();
    }
    result.push(obj);
  }
  return result;
}
