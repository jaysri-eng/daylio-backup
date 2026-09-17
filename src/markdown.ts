import type { DaylioBackup, DaylioEntry, MarkdownFile } from './types';

export interface MarkdownOptions {
  /** Folder prefix for every path, e.g. "Daylio". No trailing slash. */
  folder?: string;
}

/**
 * A YAML flow-sequence item: bare when safe, double-quoted otherwise.
 * "Safe" means letters, digits, spaces, _ and -, AND not something a YAML
 * reader would type as a boolean, null or number: a tag called "no" or
 * "2024" must come back as the string it is.
 */
const YAML_RESERVED = /^(?:y|yes|n|no|true|false|on|off|null|~)$/i;
const YAML_NUMERIC = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

function yamlItem(value: string): string {
  const bareSafe =
    /^[A-Za-z0-9 _\-]+$/.test(value) &&
    !/^\s|\s$/.test(value) &&
    !YAML_RESERVED.test(value) &&
    !YAML_NUMERIC.test(value);
  return bareSafe ? value : `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Obsidian-style inline tag: spaces to hyphens, nothing outside letters, digits, - and _. */
function inlineTag(name: string): string {
  return '#' + name.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_\-]/gu, '');
}

function unique(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) === i);
}

function section(e: DaylioEntry): string {
  const lines: string[] = [`## ${e.time} · ${e.mood?.name ?? 'no mood'}`, ''];
  if (e.noteTitle) lines.push(`**${e.noteTitle}**`, '');
  if (e.note.trim()) lines.push(e.note.trim(), '');
  if (e.tags.length) lines.push(`Tags: ${e.tags.map((t) => inlineTag(t.name)).join(' ')}`, '');
  return lines.join('\n');
}

/** One Markdown file per calendar day, with YAML front matter, oldest first. */
export function toMarkdown(backup: DaylioBackup, options: MarkdownOptions = {}): MarkdownFile[] {
  const byDay = new Map<string, DaylioEntry[]>();
  for (const e of backup.entries) {
    const list = byDay.get(e.date) ?? [];
    list.push(e);
    byDay.set(e.date, list);
  }
  const prefix = options.folder ? `${options.folder.replace(/\/+$/, '')}/` : '';
  return [...byDay.entries()].map(([date, entries]) => {
    const moods = unique(entries.map((e) => e.mood?.name).filter((n): n is string => !!n));
    const tags = unique(entries.flatMap((e) => e.tags.map((t) => t.name)));
    const front = [
      '---',
      `date: ${date}`,
      `moods: [${moods.map(yamlItem).join(', ')}]`,
      `tags: [${tags.map(yamlItem).join(', ')}]`,
      'source: daylio',
      '---',
      '',
      '',
    ].join('\n');
    // Sections are joined with one extra newline so a blank line separates them.
    return { path: `${prefix}${date}.md`, content: front + entries.map(section).join('\n') };
  });
}
