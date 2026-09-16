import type { DaylioBackup, DaylioEntry } from './types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CSV_HEADER = 'full_date,date,weekday,time,mood,activities,note_title,note';

/** Weekday from the local calendar fields, not from the epoch value. */
export function weekdayOf(e: DaylioEntry): string {
  return WEEKDAYS[new Date(Date.UTC(e.year, e.month - 1, e.day)).getUTCDay()]!;
}

/** "8:30 am", "9:05 pm", "12:00 pm", "12:15 am": Daylio's 12-hour form. */
export function twelveHour(hour: number, minute: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function cell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** The backup as Daylio's own CSV export lays it out, newest entry first. */
export function toCsv(backup: DaylioBackup): string {
  const rows = [...backup.entries].reverse().map((e) =>
    [
      e.date,
      `${e.day} ${MONTHS[e.month - 1]}`,
      weekdayOf(e),
      twelveHour(e.hour, e.minute),
      e.mood?.name ?? '',
      e.tags.map((t) => t.name).join(' | '),
      e.noteTitle,
      e.note,
    ].map(cell).join(','),
  );
  return [CSV_HEADER, ...rows].join('\r\n') + '\r\n';
}
