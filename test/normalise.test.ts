import { describe, expect, it } from 'vitest';
import { normaliseBackup } from '../src/normalise';
import { parseDaylioBackup } from '../src/parse';
import { DaylioParseError } from '../src/types';
import { SAMPLE_RAW, encodeBackup } from './fixture';

describe('normaliseBackup', () => {
  const backup = normaliseBackup(SAMPLE_RAW);

  it('keeps the version', () => {
    expect(backup.version).toBe(15);
  });

  it('sorts entries oldest first', () => {
    expect(backup.entries.map((e) => e.id)).toEqual([102, 100, 101]);
  });

  it('converts the zero-based month and builds date and time from local fields', () => {
    const jan = backup.entries[0]!;
    expect(jan.month).toBe(1);
    expect(jan.date).toBe('2026-01-01');
    expect(jan.time).toBe('09:00');
    const mar = backup.entries[1]!;
    expect(mar.date).toBe('2026-03-04');
    expect(mar.time).toBe('08:30');
  });

  it('resolves predefined mood names and custom names', () => {
    expect(backup.moods.find((m) => m.id === 1)).toEqual({ id: 1, name: 'rad', group: 1, custom: false });
    expect(backup.moods.find((m) => m.id === 9)).toEqual({ id: 9, name: 'Wired', group: 2, custom: true });
    expect(backup.entries[2]!.mood?.name).toBe('Wired');
  });

  it('resolves tags by id and drops unknown ids', () => {
    expect(backup.entries[0]!.tags.map((t) => t.name)).toEqual(['work']);
    expect(backup.entries[1]!.tags.map((t) => t.name)).toEqual(['work', 'bad sleep']);
  });

  it('carries tag groups and the tag to group link', () => {
    expect(backup.tagGroups.map((g) => g.name)).toEqual(['Work', 'Social', 'Sleep']);
    expect(backup.tags.find((t) => t.name === 'friends')?.groupId).toBe(2);
  });

  it('cleans the note and keeps the title and favourite flag', () => {
    const out = backup.entries[2]!;
    expect(out.note).toBe('Dinner with Sam.\nLate night.');
    expect(out.noteTitle).toBe('Out');
    expect(out.isFavorite).toBe(true);
  });

  it('gives an entry with an unknown mood id a null mood', () => {
    const raw = { ...SAMPLE_RAW, dayEntries: [{ ...SAMPLE_RAW.dayEntries[0]!, mood: 77 }] };
    expect(normaliseBackup(raw).entries[0]!.mood).toBeNull();
  });

  it('clamps a strange mood group into 1..5 and names a nameless mood by group', () => {
    const raw = { ...SAMPLE_RAW, customMoods: [{ id: 1, custom_name: '', predefined_name_id: 0, mood_group_id: 9 }] };
    expect(normaliseBackup(raw).moods[0]).toEqual({ id: 1, name: 'mood 5', group: 5, custom: false });
  });

  it('rejects JSON without dayEntries', () => {
    try { normaliseBackup({ hello: 1 }); throw new Error('did not throw'); }
    catch (e) { expect((e as DaylioParseError).code).toBe('bad-shape'); }
  });

  it('skips an entry whose date is not on the calendar', () => {
    const raw = { ...SAMPLE_RAW, dayEntries: [{ ...SAMPLE_RAW.dayEntries[0]!, month: 1, day: 31 }, { ...SAMPLE_RAW.dayEntries[1]!, hour: 24 }] };
    expect(normaliseBackup(raw).entries).toHaveLength(0);
  });

  it('skips a malformed entry rather than failing the whole file', () => {
    const raw = { ...SAMPLE_RAW, dayEntries: [...SAMPLE_RAW.dayEntries, { id: 'x' }] };
    expect(normaliseBackup(raw).entries).toHaveLength(3);
  });
});

describe('parseDaylioBackup', () => {
  it('goes from zip bytes to a typed backup', () => {
    expect(parseDaylioBackup(encodeBackup(SAMPLE_RAW, 'zip')).entries).toHaveLength(3);
  });
});
