/**
 * Base64 text to bytes, in the browser and in Node, without Buffer.
 * `atob` is global in every browser and in Node 16+.
 */
export function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/[^A-Za-z0-9+/=]/g, '');
  const binary = atob(clean);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** True when the text is plausibly base64 (only the alphabet, padding at the end). */
export function looksLikeBase64(text: string): boolean {
  const clean = text.replace(/\s+/g, '');
  return clean.length > 0 && clean.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(clean);
}
