# daylio-backup

Read a Daylio `.daylio` backup in the browser or in Node, and turn it into CSV or Markdown. Nothing is uploaded anywhere. The only dependency is `fflate`, for the zip.

## Why the backup and not the CSV

Daylio exports a CSV on its own (More, then Export Entries), free. Two things it cannot do for you. The CSV writes each mood as a name only; the backup keeps the mood's place on Daylio's five-step scale, plus tag groups and favourites, which is what you need to run any statistics on the log. And the backup is the file you actually have once the app is gone: the one Daylio put on Google Drive or iCloud, or the one you moved between phones.

Every user can make one, free, from inside the app (More, then Backup & Restore, then Advanced options, then Export). That file is a zip. Inside it sits `backup.daylio`, which is the whole journal as base64-encoded JSON. This package opens that file and gives you typed entries, each with its mood and its tags resolved to names. Photos are not read; the zip's assets folder is ignored.

## Install

```sh
npm i daylio-backup
```

## Use it in a browser

```ts
import { parseDaylioBackup, toCsv } from 'daylio-backup';

const file = input.files[0];                      // an <input type="file">
const bytes = new Uint8Array(await file.arrayBuffer());
const backup = parseDaylioBackup(bytes);

console.log(backup.entries.length, 'entries');
const csv = toCsv(backup);                        // same columns as Daylio's own export
```

## Use it in Node

```ts
import { readFileSync } from 'node:fs';
import { parseDaylioBackup, toMarkdown } from 'daylio-backup';

const backup = parseDaylioBackup(readFileSync('backup.daylio'));
for (const note of toMarkdown(backup, { folder: 'Daylio' })) {
  // note.path is "Daylio/2026-03-04.md", note.content is the file
}
```

Node 16 or newer, any current browser.

## The three functions

`parseDaylioBackup(bytes: Uint8Array): DaylioBackup`
Accepts the `.daylio` zip, the bare `backup.daylio` file from inside it, or already-decoded JSON. Throws `DaylioParseError` on anything else.

`toCsv(backup: DaylioBackup): string`
One row per entry, newest first, with Daylio's own header: `full_date, date, weekday, time, mood, activities, note_title, note`. Activities are joined with ` | `, the way Daylio writes them, so tools built for Daylio CSVs accept the output.

`toMarkdown(backup: DaylioBackup, options?: { folder?: string }): { path, content }[]`
One file per calendar day, named `YYYY-MM-DD.md`, with YAML front matter (`date`, `moods`, `tags`, `source: daylio`) and one section per entry. Point Obsidian's Daily notes plugin at that folder and the file names match its default date format.

## What you get back

```ts
interface DaylioBackup {
  version: number | null;
  entries: DaylioEntry[];     // oldest first
  moods: DaylioMood[];        // { id, name, group: 1..5, custom }
  tags: DaylioTag[];          // { id, name, groupId }
  tagGroups: DaylioTagGroup[];
}

interface DaylioEntry {
  id: number;
  datetime: number;           // epoch milliseconds, as Daylio stored it
  year: number; month: number; day: number; hour: number; minute: number;
  date: string;               // "2026-03-04", from the local fields above
  time: string;               // "08:30"
  mood: DaylioMood | null;
  tags: DaylioTag[];
  noteTitle: string;
  note: string;               // plain text; Daylio's <br> and <b> are gone
  isFavorite: boolean;
}
```

## Two facts about the format

Daylio stores the month zero-based. January is 0 in the raw file. Here `month` is 1 to 12, and `date` is built from the entry's own local fields, never from the epoch timestamp, so a day stays the day the person logged it whatever timezone your code runs in.

Mood group 1 is the best mood and 5 is the worst. A mood with no custom name gets Daylio's default for its slot: rad, good, meh, bad, awful.

## Errors

Every failure is a `DaylioParseError` with a `code`:

| code | meaning |
|---|---|
| `empty` | the file has no bytes |
| `no-backup-entry` | a zip with no `backup.daylio` inside |
| `bad-base64` | the file is not base64 and not JSON |
| `bad-json` | the base64 decoded to something that is not JSON |
| `bad-shape` | JSON without a `dayEntries` array |

## License

MIT.
