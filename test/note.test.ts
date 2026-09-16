import { describe, expect, it } from 'vitest';
import { plainNote } from '../src/note';

describe('plainNote', () => {
  it('turns <br> into newlines and strips other tags', () => {
    expect(plainNote('Dinner with <b>Sam</b>.<br>Late night.')).toBe('Dinner with Sam.\nLate night.');
  });
  it('decodes the five basic entities', () => {
    expect(plainNote('a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;')).toBe('a & b <c> "d" \'e\'');
  });
  it('collapses trailing whitespace and CRLF', () => {
    expect(plainNote('line one\r\n<br/>  ')).toBe('line one\n');
  });
  it('leaves plain text alone', () => {
    expect(plainNote('nothing to do')).toBe('nothing to do');
  });
});
