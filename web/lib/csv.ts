// Minimal, dependency-free CSV builder. Quotes any field containing a comma,
// quote, or newline (doubling embedded quotes), and prepends a UTF-8 BOM so
// Excel renders Urdu / non-ASCII names correctly.
export type CsvCell = string | number | null | undefined;

const BOM = String.fromCharCode(0xfeff);

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const esc = (v: CsvCell) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))];
  return BOM + lines.join("\r\n");
}
