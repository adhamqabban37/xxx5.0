export function normalizeUrl(u?: string): string {
  if (!u) return '';
  const s = u.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
