// ─────────────────────────────────────────────────────────────
// Formatting helpers — money, dates, numbers
// Money is stored as paisa (Int) and displayed as PKR.
// Numbers stay LTR in both EN and UR.
// ─────────────────────────────────────────────────────────────

export function paisaToRupees(paisa: number): number {
  return Math.round(paisa) / 100;
}

export function formatPkr(paisa: number, opts: { decimals?: boolean } = {}): string {
  const value = paisaToRupees(paisa);
  const formatted = value.toLocaleString("en-PK", {
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: opts.decimals ? 2 : 0,
  });
  return `Rs. ${formatted}`;
}

export function formatPkrCompact(paisa: number): string {
  const v = paisaToRupees(paisa);
  if (v >= 1_00_00_000) return `Rs. ${(v / 1_00_00_000).toFixed(1)} Cr`;
  if (v >= 1_00_000) return `Rs. ${(v / 1_00_000).toFixed(1)} L`;
  if (v >= 1_000) return `Rs. ${(v / 1_000).toFixed(1)}K`;
  return formatPkr(paisa);
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-PK", opts).format(date);
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatDateTime(d: Date | string): string {
  return `${formatDate(d)} · ${formatTime(d)}`;
}

export function relativeTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(date);
}

/**
 * Mask a PMDC license number, IBAN, or account number — keep the first 3
 * and last 2 characters, replace the middle with bullets. Used on public
 * surfaces (doctor profile) where the full number shouldn't be scrapeable.
 */
export function maskLicense(value: string | null | undefined): string {
  if (!value) return "—";
  const v = value.trim();
  if (v.length <= 5) return v;
  const head = v.slice(0, 3);
  const tail = v.slice(-2);
  const mid = "•".repeat(Math.max(3, v.length - 5));
  return `${head}${mid}${tail}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter((s) => !/^Dr\.?$/i.test(s))
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}
