import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { decodeBackup } from '../src/decode';
import { DaylioParseError } from '../src/types';
import { SAMPLE_RAW, encodeBackup } from './fixture';

describe('decodeBackup', () => {
  it('reads the .daylio zip', () => {
    const raw = decodeBackup(encodeBackup(SAMPLE_RAW, 'zip')) as { version: number };
    expect(raw.version).toBe(15);
  });

  it('reads the bare base64 file', () => {
    const raw = decodeBackup(encodeBackup(SAMPLE_RAW, 'base64')) as { dayEntries: unknown[] };
    expect(raw.dayEntries).toHaveLength(3);
  });

  it('reads already-decoded JSON text', () => {
    const raw = decodeBackup(strToU8(JSON.stringify(SAMPLE_RAW))) as { version: number };
    expect(raw.version).toBe(15);
  });

  it('tolerates whitespace and newlines around the base64', () => {
    const b64 = Buffer.from(JSON.stringify(SAMPLE_RAW)).toString('base64');
    const wrapped = b64.replace(/(.{76})/g, '$1\n') + '\n';
    const raw = decodeBackup(strToU8(wrapped)) as { version: number };
    expect(raw.version).toBe(15);
  });

  it('does not inflate the photos in the assets folder', () => {
    const big = new Uint8Array(4 * 1024 * 1024); // a 4 MB "photo"
    for (let i = 0; i < big.length; i++) big[i] = i % 251;
    const b64 = Buffer.from(JSON.stringify(SAMPLE_RAW)).toString('base64');
    const zip = zipSync({ 'backup.daylio': strToU8(b64), 'assets/photos/one.jpg': big }, { level: 1 });
    const before = process.memoryUsage().heapUsed;
    const raw = decodeBackup(zip) as { version: number };
    expect(raw.version).toBe(15);
    // Coarse but real: inflating the 4 MB entry would show up here.
    expect(process.memoryUsage().heapUsed - before).toBeLessThan(3 * 1024 * 1024);
  });

  it('rejects an empty file', () => {
    expect(() => decodeBackup(new Uint8Array(0))).toThrow(DaylioParseError);
    try { decodeBackup(new Uint8Array(0)); } catch (e) { expect((e as DaylioParseError).code).toBe('empty'); }
  });

  it('rejects a zip with no backup.daylio inside', () => {
    const zip = zipSync({ 'readme.txt': strToU8('hello') });
    try { decodeBackup(zip); throw new Error('did not throw'); }
    catch (e) { expect((e as DaylioParseError).code).toBe('no-backup-entry'); }
  });

  it('rejects text that is neither JSON nor base64', () => {
    try { decodeBackup(strToU8('this is not a backup!!')); throw new Error('did not throw'); }
    catch (e) { expect((e as DaylioParseError).code).toBe('bad-base64'); }
  });

  it('rejects base64 that does not hold JSON', () => {
    const b64 = Buffer.from('not json at all').toString('base64');
    try { decodeBackup(strToU8(b64)); throw new Error('did not throw'); }
    catch (e) { expect((e as DaylioParseError).code).toBe('bad-json'); }
  });
});
