import { plainNote } from './note';
import { DaylioParseError } from './types';
import type { DaylioBackup, DaylioEntry, DaylioMood, DaylioTag, DaylioTagGroup } from './types';

/** Daylio's five default mood names, by predefined_name_id. */
export const PREDEFINED_MOOD_NAMES: Record<number, string> = {
  1: 'rad', 2: 'good', 3: 'meh', 4: 'bad', 5: 'awful',
};

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const pad2 = (n: number): string => String(n).padStart(2, '0');

function toGroup(v: unknown): 1 | 2 | 3 | 4 | 5 {
  const n = num(v) ?? 3;
  return Math.min(5, Math.max(1, Math.round(n))) as 1 | 2 | 3 | 4 | 5;
}

function mood(raw: unknown): DaylioMood | null {
  if (!isObject(raw)) return null;
  const id = num(raw.id);
  if (id === null) return null;
  const group = toGroup(raw.mood_group_id);
  const custom = str(raw.custom_name).trim();
  if (custom) return { id, name: custom, group, custom: true };
  const predefined = PREDEFINED_MOOD_NAMES[num(raw.predefined_name_id) ?? -1];
  return { id, name: predefined ?? `mood ${group}`, group, custom: false };
}

function tag(raw: unknown): DaylioTag | null {
  if (!isObject(raw)) return null;
  const id = num(raw.id);
  if (id === null) return null;
  return { id, name: str(raw.name).trim() || `tag ${id}`, groupId: num(raw.id_tag_group) };
}

function tagGroup(raw: unknown): DaylioTagGroup | null {
  if (!isObject(raw)) return null;
  const id = num(raw.id);
  if (id === null) return null;
  return { id, name: str(raw.name).trim() || `group ${id}` };
}

function entry(raw: unknown, moods: Map<number, DaylioMood>, tags: Map<number, DaylioTag>): DaylioEntry | null {
  if (!isObject(raw)) return null;
  const id = num(raw.id);
  const datetime = num(raw.datetime);
  const year = num(raw.year);
  const month0 = num(raw.month);
  const day = num(raw.day);
  const hour = num(raw.hour) ?? 0;
  const minute = num(raw.minute) ?? 0;
  if (id === null || datetime === null || year === null || month0 === null || day === null) return null;
  const month = month0 + 1;
  // A real calendar check, not a range check: 31 February must not become a
  // date string a Date parser rejects downstream (Safari refuses it outright).
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    month < 1 || month > 12 ||
    probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) return null;
  const tagIds = Array.isArray(raw.tags) ? raw.tags : [];
  return {
    id,
    datetime,
    year, month, day, hour, minute,
    date: `${year}-${pad2(month)}-${pad2(day)}`,
    time: `${pad2(hour)}:${pad2(minute)}`,
    mood: moods.get(num(raw.mood) ?? -1) ?? null,
    tags: tagIds.map((t) => tags.get(num(t) ?? -1)).filter((t): t is DaylioTag => t !== undefined),
    noteTitle: plainNote(str(raw.note_title)).trim(),
    note: plainNote(str(raw.note)),
    isFavorite: raw.isFavorite === true,
  };
}

/** Raw decoded JSON to a typed backup. Throws bad-shape when dayEntries is missing. */
export function normaliseBackup(raw: unknown): DaylioBackup {
  if (!isObject(raw) || !Array.isArray(raw.dayEntries)) {
    throw new DaylioParseError('bad-shape', 'This JSON has no dayEntries, so it is not a Daylio backup.');
  }
  const moods = (Array.isArray(raw.customMoods) ? raw.customMoods : []).map(mood).filter((m): m is DaylioMood => m !== null);
  const tags = (Array.isArray(raw.tags) ? raw.tags : []).map(tag).filter((t): t is DaylioTag => t !== null);
  const tagGroups = (Array.isArray(raw.tag_groups) ? raw.tag_groups : []).map(tagGroup).filter((g): g is DaylioTagGroup => g !== null);
  const moodById = new Map(moods.map((m) => [m.id, m]));
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const entries = raw.dayEntries
    .map((e) => entry(e, moodById, tagById))
    .filter((e): e is DaylioEntry => e !== null)
    .sort((a, b) => a.datetime - b.datetime || a.id - b.id);
  return { version: num(raw.version), entries, moods, tags, tagGroups };
}
