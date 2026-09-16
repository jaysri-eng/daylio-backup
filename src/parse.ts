import { decodeBackup } from './decode';
import { normaliseBackup } from './normalise';
import type { DaylioBackup } from './types';

/** Bytes of a .daylio file (or its inner file) to a typed backup. */
export function parseDaylioBackup(bytes: Uint8Array): DaylioBackup {
  return normaliseBackup(decodeBackup(bytes));
}
