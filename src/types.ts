/** A mood as Daylio stores it, with its display name already resolved. */
export interface DaylioMood {
  id: number;
  /** custom_name when set, else Daylio's default for predefined_name_id, else "mood N". */
  name: string;
  /** Daylio's 1..5 scale. 1 is the best group ("rad"), 5 the worst ("awful"). */
  group: 1 | 2 | 3 | 4 | 5;
  /** True when the name came from custom_name. */
  custom: boolean;
}

export interface DaylioTag {
  id: number;
  name: string;
  groupId: number | null;
}

export interface DaylioTagGroup {
  id: number;
  name: string;
}

export interface DaylioEntry {
  id: number;
  /** Milliseconds since the epoch, as Daylio stored it. */
  datetime: number;
  /** Local calendar fields from the backup. month is 1..12 here (Daylio stores 0..11). */
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** YYYY-MM-DD, from the local fields. */
  date: string;
  /** HH:MM, 24-hour, from the local fields. */
  time: string;
  /** null when the entry's mood id has no record in the backup. */
  mood: DaylioMood | null;
  /** Only tags with a record; unknown ids are dropped. */
  tags: DaylioTag[];
  noteTitle: string;
  /** Plain text: Daylio's <br> and tags removed, entities decoded. */
  note: string;
  isFavorite: boolean;
}

export interface DaylioBackup {
  version: number | null;
  /** Oldest first. */
  entries: DaylioEntry[];
  moods: DaylioMood[];
  tags: DaylioTag[];
  tagGroups: DaylioTagGroup[];
}

export interface MarkdownFile {
  /** Relative path, e.g. "2026-03-04.md" or "Daylio/2026-03-04.md". */
  path: string;
  content: string;
}

export type ParseErrorCode =
  | 'empty'
  | 'no-backup-entry'
  | 'bad-base64'
  | 'bad-json'
  | 'bad-shape';

export class DaylioParseError extends Error {
  readonly code: ParseErrorCode;
  constructor(code: ParseErrorCode, message: string) {
    super(message);
    this.name = 'DaylioParseError';
    this.code = code;
  }
}
