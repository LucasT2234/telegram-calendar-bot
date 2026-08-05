function getOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = offset.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + (hours < 0 ? -minutes : minutes);
}

/** UTC start/end ISO bounds for "today" as experienced in the given IANA timezone. */
export function todayRangeUtc(timeZone: string): { startISO: string; endISO: string } {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const offsetMin = getOffsetMinutes(timeZone, new Date());
  const startUtc = new Date(
    new Date(`${dateStr}T00:00:00Z`).getTime() - offsetMin * 60_000,
  );
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60_000 - 1000);

  return { startISO: startUtc.toISOString(), endISO: endUtc.toISOString() };
}

/** UTC start/end ISO bounds for "tomorrow" as experienced in the given IANA timezone. */
export function tomorrowRangeUtc(timeZone: string): { startISO: string; endISO: string } {
  const { startISO } = todayRangeUtc(timeZone);
  const tomorrowStart = new Date(new Date(startISO).getTime() + 24 * 60 * 60_000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60_000 - 1000);
  return { startISO: tomorrowStart.toISOString(), endISO: tomorrowEnd.toISOString() };
}

export function formatTimeInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
