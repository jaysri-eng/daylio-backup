import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { SAMPLE_RAW, encodeBackup } from './fixture';

describe('fixture', () => {
  it('zip format contains backup.daylio holding base64 of the JSON', () => {
    const files = unzipSync(encodeBackup(SAMPLE_RAW, 'zip'));
    const inner = files['backup.daylio'];
    expect(inner).toBeDefined();
    const json = Buffer.from(strFromU8(inner!), 'base64').toString('utf8');
    expect(JSON.parse(json).version).toBe(15);
  });

  it('base64 format is the bare inner file', () => {
    const text = strFromU8(encodeBackup(SAMPLE_RAW, 'base64'));
    expect(JSON.parse(Buffer.from(text, 'base64').toString('utf8')).dayEntries).toHaveLength(3);
  });
});
