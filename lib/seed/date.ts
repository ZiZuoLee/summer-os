const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: string): Date {
  const match = ISO_DATE.exec(value);
  if (!match) throw new RangeError(`Invalid ISO date: ${value}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = new Date(Date.UTC(year, month - 1, day));
  if (
    result.getUTCFullYear() !== year ||
    result.getUTCMonth() !== month - 1 ||
    result.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }
  return result;
}

export function formatDateOnly(date: Date): string {
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

export function addDateDays(value: string, amount: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDateOnly(date);
}

export function differenceInCalendarDays(
  later: string,
  earlier: string,
): number {
  return Math.round(
    (parseDateOnly(later).getTime() - parseDateOnly(earlier).getTime()) /
      86_400_000,
  );
}

export function eachDateInclusive(
  startDate: string,
  endDate: string,
): string[] {
  const count = differenceInCalendarDays(endDate, startDate) + 1;
  if (count < 1) throw new RangeError("endDate must be on or after startDate");
  return Array.from({ length: count }, (_, index) =>
    addDateDays(startDate, index),
  );
}

/** JavaScript weekday: Sunday=0 ... Saturday=6. */
export function dayOfWeek(value: string): number {
  return parseDateOnly(value).getUTCDay();
}

export function localDateAt(instant: Date | string, timezone: string): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(date.getTime())) throw new RangeError("Invalid instant");

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}
