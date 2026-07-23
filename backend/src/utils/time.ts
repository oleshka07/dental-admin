export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

/** ISO weekday: Monday=1 .. Sunday=7 */
export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function eachDate(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  let cursor = toDateOnly(from);
  const end = toDateOnly(to);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor);
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}
