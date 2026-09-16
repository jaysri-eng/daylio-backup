import { describe, expect, it } from 'vitest';
import { toCsv } from '../src/csv';
import { normaliseBackup } from '../src/normalise';
import { SAMPLE_RAW } from './fixture';

describe('toCsv', () => {
  const lines = toCsv(normaliseBackup(SAMPLE_RAW)).split('\r\n');

  it('has Daylio\'s header', () => {
    expect(lines[0]).toBe('full_date,date,weekday,time,mood,activities,note_title,note');
  });

  it('lists newest first with Daylio\'s date and time formats', () => {
    expect(lines[1]).toBe('2026-03-04,4 March,Wednesday,9:05 pm,Wired,friends,Out,"Dinner with Sam.\nLate night."');
    expect(lines[2]).toBe('2026-03-04,4 March,Wednesday,8:30 am,good,work | bad sleep,,"Slept badly, still fine."');
    expect(lines[3]).toBe('2026-01-01,1 January,Thursday,9:00 am,awful,work,,');
  });

  it('ends with a trailing newline and nothing else', () => {
    expect(lines[4]).toBe('');
    expect(lines).toHaveLength(5);
  });

  it('doubles quotes inside a quoted field', () => {
    const raw = { ...SAMPLE_RAW, dayEntries: [{ ...SAMPLE_RAW.dayEntries[0]!, note: 'He said "no"' }] };
    expect(toCsv(normaliseBackup(raw)).split('\r\n')[1]).toContain('"He said ""no"""');
  });

  it('writes an empty mood cell when the mood is unknown', () => {
    const raw = { ...SAMPLE_RAW, dayEntries: [{ ...SAMPLE_RAW.dayEntries[0]!, mood: 77 }] };
    expect(toCsv(normaliseBackup(raw)).split('\r\n')[1]).toBe('2026-03-04,4 March,Wednesday,8:30 am,,work | bad sleep,,"Slept badly, still fine."');
  });
});
