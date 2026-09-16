import { strFromU8, unzipSync } from 'fflate';
import { fromBase64, looksLikeBase64 } from './base64';
import { DaylioParseError } from './types';

const ZIP_MAGIC = [0x50, 0x4b]; // "PK"

/**
 * Bytes of a .daylio file (a zip holding backup.daylio), or of the inner
 * backup.daylio file on its own (base64 JSON), or of already-decoded JSON.
 * Returns the parsed JSON, untyped. normaliseBackup gives it a shape.
 */
export function decodeBackup(bytes: Uint8Array): unknown {
  if (bytes.length === 0) throw new DaylioParseError('empty', 'The file is empty.');

  let text: string;
  if (bytes[0] === ZIP_MAGIC[0] && bytes[1] === ZIP_MAGIC[1]) {
    text = innerFileText(bytes);
  } else {
    text = strFromU8(bytes);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return parseJson(trimmed);

  if (!looksLikeBase64(trimmed)) {
    throw new DaylioParseError('bad-base64', 'This does not look like a Daylio backup.');
  }
  let decoded: string;
  try {
    decoded = strFromU8(fromBase64(trimmed));
  } catch {
    throw new DaylioParseError('bad-base64', 'The backup could not be decoded.');
  }
  return parseJson(decoded);
}

function innerFileText(zipBytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(zipBytes);
  } catch {
    throw new DaylioParseError('no-backup-entry', 'The zip could not be opened.');
  }
  const name =
    Object.keys(files).find((n) => n === 'backup.daylio') ??
    Object.keys(files).find((n) => n.endsWith('backup.daylio')) ??
    Object.keys(files).find((n) => n.endsWith('.daylio'));
  if (!name) {
    throw new DaylioParseError('no-backup-entry', 'No backup.daylio file inside the zip.');
  }
  return strFromU8(files[name]!);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new DaylioParseError('bad-json', 'The backup contents are not valid JSON.');
  }
}
