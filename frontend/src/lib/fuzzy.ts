/*
 * Small fuzzy search for short lists (services, help questions). Forgives typos and partial
 * words: "clerance" finds clearance, "basktball" finds the court, "cert res" finds Certificate of
 * Residency. Every word typed must match something; better matches rank higher.
 *
 *   exact word 4 · word starts with it 3 · word contains it 2 · one or two typos 1.5 ·
 *   letters in order (abbreviation) 0.75
 */

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // ñ → n, é → e
    .replace(/[^a-z0-9\s]/g, ' ');

export const words = (s: string) => normalize(s).split(/\s+/).filter(Boolean);

/** Edit distance with swaps counted as one edit (Damerau–Levenshtein, optimal string alignment). */
export const editDistance = (a: string, b: string, max = 3): number => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    let best = Infinity;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best > max) return max + 1; // already too far
  }
  return d[rows - 1][cols - 1];
};

/** Typos allowed for a word of this length. */
const allowed = (len: number) => (len <= 3 ? 0 : len <= 5 ? 1 : 2);

const isSubsequence = (needle: string, hay: string) => {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
};

/** How well one typed word matches one word of the item (0 = not at all). */
const scoreWord = (q: string, w: string): number => {
  if (w === q) return 4;
  if (w.startsWith(q)) return 3;
  if (q.length >= 3 && w.includes(q)) return 2;
  const typos = allowed(q.length);
  if (typos > 0) {
    // Compare with the whole word, and with its start (a half-typed long word).
    const whole = editDistance(q, w, typos);
    const start = w.length > q.length ? editDistance(q, w.slice(0, q.length), typos) : whole;
    if (Math.min(whole, start) <= typos) return 1.5;
  }
  if (q.length >= 3 && q[0] === w[0] && isSubsequence(q, w)) return 0.75;
  return 0;
};

/**
 * Score an item's text against a query. 0 means no match. `primary` (the name) counts double, so
 * a hit in the name ranks above a hit in the keywords.
 */
export const fuzzyScore = (query: string, primary: string, secondary = ''): number => {
  const qs = words(query);
  if (qs.length === 0) return 0;
  const main = words(primary);
  const rest = words(secondary);
  let total = 0;
  for (const q of qs) {
    let best = 0;
    for (const w of main) best = Math.max(best, scoreWord(q, w) * 2);
    for (const w of rest) best = Math.max(best, scoreWord(q, w));
    if (best === 0) return 0; // every typed word must match something
    total += best;
  }
  return total;
};

/** Items that match, best first. */
export const fuzzyFilter = <T,>(items: T[], query: string, text: (item: T) => { primary: string; secondary?: string }): T[] =>
  items
    .map((item, i) => {
      const { primary, secondary } = text(item);
      return { item, i, score: fuzzyScore(query, primary, secondary) };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(r => r.item);
