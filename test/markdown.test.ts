import { describe, expect, it } from 'vitest';
import { toMarkdown } from '../src/markdown';
import { normaliseBackup } from '../src/normalise';
import { SAMPLE_RAW } from './fixture';

describe('toMarkdown', () => {
  const files = toMarkdown(normaliseBackup(SAMPLE_RAW));

  it('writes one file per day, oldest first, named by date', () => {
    expect(files.map((f) => f.path)).toEqual(['2026-01-01.md', '2026-03-04.md']);
  });

  it('puts every mood and tag of the day in the front matter, in order of first use', () => {
    expect(files[1]!.content.startsWith(
      '---\ndate: 2026-03-04\nmoods: [good, Wired]\ntags: [work, bad sleep, friends]\nsource: daylio\n---\n',
    )).toBe(true);
  });

  it('writes each entry as a section with time, mood, title, note and tags', () => {
    expect(files[1]!.content).toContain('\n## 08:30 · good\n\nSlept badly, still fine.\n\nTags: #work #bad-sleep\n');
    expect(files[1]!.content).toContain('\n## 21:05 · Wired\n\n**Out**\n\nDinner with Sam.\nLate night.\n\nTags: #friends\n');
  });

  it('leaves a blank line between two entries on the same day', () => {
    expect(files[1]!.content).toContain('Tags: #work #bad-sleep\n\n## 21:05 · Wired\n');
  });

  it('omits the title, note and tag lines when they are empty', () => {
    expect(files[0]!.content).toBe(
      '---\ndate: 2026-01-01\nmoods: [awful]\ntags: [work]\nsource: daylio\n---\n\n## 09:00 · awful\n\nTags: #work\n',
    );
  });

  it('prefixes a folder when asked', () => {
    expect(toMarkdown(normaliseBackup(SAMPLE_RAW), { folder: 'Daylio' })[0]!.path).toBe('Daylio/2026-01-01.md');
  });

  it('quotes a front matter value that YAML would misread', () => {
    const raw = { ...SAMPLE_RAW, tags: [{ id: 11, name: 'work: late' }] };
    expect(toMarkdown(normaliseBackup(raw))[0]!.content).toContain('tags: ["work: late"]');
  });

  it('quotes values YAML would read as a boolean, null or number', () => {
    const raw = {
      ...SAMPLE_RAW,
      tags: [{ id: 11, name: 'no' }, { id: 12, name: '2024' }, { id: 13, name: 'On' }],
      dayEntries: [{ ...SAMPLE_RAW.dayEntries[0]!, tags: [11, 12, 13] }],
    };
    expect(toMarkdown(normaliseBackup(raw))[0]!.content).toContain('tags: ["no", "2024", "On"]');
  });
});
