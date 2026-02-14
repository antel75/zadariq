/**
 * Simple fuzzy matching: checks if all characters of the query
 * appear in order within the target string (case-insensitive).
 * Returns a score (lower = better match). -1 means no match.
 */
export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact substring match gets best score
  if (t.includes(q)) return 0;

  // Character-by-character fuzzy match
  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus for consecutive matches
      const gap = lastMatchIndex >= 0 ? ti - lastMatchIndex - 1 : 0;
      score += gap;
      lastMatchIndex = ti;
      qi++;
    }
  }

  // All query chars found?
  if (qi === q.length) return score + 1; // +1 so exact substring (0) always wins

  return -1; // no match
}

/**
 * Score a business against a query. Checks name, address, and category.
 * Returns -1 for no match, otherwise a score (lower = better).
 */
export function scoreMatch(
  query: string,
  fields: string[]
): number {
  if (!query.trim()) return 0;

  let bestScore = -1;

  for (const field of fields) {
    const score = fuzzyMatch(query, field);
    if (score >= 0 && (bestScore < 0 || score < bestScore)) {
      bestScore = score;
    }
  }

  return bestScore;
}
