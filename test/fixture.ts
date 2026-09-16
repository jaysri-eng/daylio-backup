import { strToU8, zipSync } from 'fflate';

/**
 * A raw Daylio backup as the app writes it, built from the documented
 * format (two independent reverse-engineering write-ups and the dayligo,
 * journiv and daylio-scribe type definitions agree on these keys).
 * month is ZERO-BASED, as in a real backup.
 */
export const SAMPLE_RAW = {
  version: 15,
  customMoods: [
    { id: 1, custom_name: '', predefined_name_id: 1, mood_group_id: 1, icon_id: 1, state: 0 },
    { id: 2, custom_name: '', predefined_name_id: 2, mood_group_id: 2, icon_id: 2, state: 0 },
    { id: 3, custom_name: '', predefined_name_id: 3, mood_group_id: 3, icon_id: 3, state: 0 },
    { id: 4, custom_name: '', predefined_name_id: 4, mood_group_id: 4, icon_id: 4, state: 0 },
    { id: 5, custom_name: '', predefined_name_id: 5, mood_group_id: 5, icon_id: 5, state: 0 },
    { id: 9, custom_name: 'Wired', predefined_name_id: 0, mood_group_id: 2, icon_id: 7, state: 0 },
  ],
  tags: [
    { id: 11, name: 'work', createdAt: 1700000000000, icon: 1, order: 0, state: 0, id_tag_group: 1 },
    { id: 12, name: 'friends', createdAt: 1700000000000, icon: 2, order: 1, state: 0, id_tag_group: 2 },
    { id: 13, name: 'bad sleep', createdAt: 1700000000000, icon: 3, order: 2, state: 0, id_tag_group: 3 },
  ],
  tag_groups: [
    { id: 1, name: 'Work', order: 0 },
    { id: 2, name: 'Social', order: 1 },
    { id: 3, name: 'Sleep', order: 2 },
  ],
  dayEntries: [
    // 4 March 2026, 08:30 local, month 2 = March
    { id: 100, datetime: 1772613000000, mood: 2, note: 'Slept badly, still fine.', note_title: '', tags: [11, 13], assets: [], isFavorite: false, year: 2026, month: 2, day: 4, hour: 8, minute: 30, timeZoneOffset: 19800000 },
    // 4 March 2026, 21:05 local, second entry that day
    { id: 101, datetime: 1772658300000, mood: 9, note: 'Dinner with <b>Sam</b>.<br>Late night.', note_title: 'Out', tags: [12], assets: [], isFavorite: true, year: 2026, month: 2, day: 4, hour: 21, minute: 5, timeZoneOffset: 19800000 },
    // 1 January 2026, 09:00 local: month 0 = January, and an unknown tag id 99
    { id: 102, datetime: 1767238200000, mood: 5, note: '', note_title: '', tags: [11, 99], assets: [], isFavorite: false, year: 2026, month: 0, day: 1, hour: 9, minute: 0, timeZoneOffset: 19800000 },
  ],
  goals: [],
  goalEntries: [],
  goalSuccessWeeks: [],
  assets: [],
  metadata: { number_of_entries: 3 },
};

/** Base64 of the JSON, as the inner backup.daylio file holds it. */
export function encodeBase64(raw: unknown): string {
  return Buffer.from(JSON.stringify(raw), 'utf8').toString('base64');
}

/** The bytes a .daylio file holds: a zip containing backup.daylio (base64 JSON). */
export function encodeBackup(raw: unknown, format: 'zip' | 'base64'): Uint8Array {
  const b64 = encodeBase64(raw);
  if (format === 'base64') return strToU8(b64);
  return zipSync({ 'backup.daylio': strToU8(b64), 'assets/.keep': new Uint8Array(0) }, { level: 6 });
}
