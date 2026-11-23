/** Kleine Zeitzonen-Helfer ohne Zusatzbibliothek. */

function parts(d: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(d)) {
    if (p.type !== "literal") o[p.type] = Number(p.value);
  }
  return o as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Offset der Zeitzone zu UTC in Minuten (z. B. +60 für CET). */
export function offsetMinutes(d: Date, tz: string): number {
  const p = parts(d, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(d.getTime() / 1000) * 1000) / 60000);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO-8601 mit Offset in der Zielzeitzone, z. B. 2026-11-24T09:00:00+01:00 */
export function formatInZone(d: Date, tz: string): string {
  const p = parts(d, tz);
  const off = offsetMinutes(d, tz);
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${sign}${pad(
    Math.floor(abs / 60),
  )}:${pad(abs % 60)}`;
}

/** Lokale Uhrzeit (Tag + dayOffset, hour:minute) in der Zeitzone als Date. */
export function localTime(now: Date, dayOffset: number, hour: number, minute: number, tz: string): Date {
  const p = parts(now, tz);
  const guess = Date.UTC(p.year, p.month - 1, p.day + dayOffset, hour, minute, 0);
  const off = offsetMinutes(new Date(guess), tz);
  return new Date(guess - off * 60000);
}

export function weekdayDe(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("de-DE", { timeZone: tz, weekday: "long" }).format(d);
}
