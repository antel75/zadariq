import { useMemo } from 'react';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { useApprovedPlaces } from '@/hooks/useApprovedPlaces';
import { Business } from '@/data/types';

// ──────── MORNING ROUTINE ENGINE ────────
// Time window: 05:30–10:30
// Goal: daily-life suggestions, not database ranking

/** Morning-relevant category mapping (order = priority) */
const MORNING_CATEGORIES = ['cafes', 'shops', 'parking', 'pharmacy'] as const;
type MorningCategory = typeof MORNING_CATEGORIES[number];

const CATEGORY_LABELS: Record<MorningCategory, { hr: string; en: string }> = {
  cafes: { hr: 'Kafić za jutro ☕', en: 'Morning coffee ☕' },
  shops: { hr: 'Trgovina / pekara 🛒', en: 'Grocery / bakery 🛒' },
  parking: { hr: 'Parking info 🅿️', en: 'Parking info 🅿️' },
  pharmacy: { hr: 'Ljekarna 💊', en: 'Pharmacy 💊' },
};

// Geo-bias removed: Zadar is small (~6km diameter), all places are "nearby".
// Diversity comes from category rotation + daily seed + freshness tracking.

/** Deterministic seeded PRNG (mulberry32) */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}


/** Freshness tracking via localStorage */
const SEEN_KEY = 'zadariq_morning_seen';
const SEEN_TTL = 48 * 60 * 60 * 1000; // 48h

function getRecentlySeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const entries: [string, number][] = JSON.parse(raw);
    const now = Date.now();
    const valid = entries.filter(([, ts]) => now - ts < SEEN_TTL);
    if (valid.length !== entries.length) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(valid));
    }
    return new Set(valid.map(([id]) => id));
  } catch {
    return new Set();
  }
}

function markSeen(ids: string[]) {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const entries: [string, number][] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const map = new Map(entries);
    ids.forEach((id) => map.set(id, now));
    // Prune old
    const valid = [...map.entries()].filter(([, ts]) => now - ts < SEEN_TTL);
    localStorage.setItem(SEEN_KEY, JSON.stringify(valid));
  } catch {
    // ignore
  }
}

/** Deterministic shuffle using seeded RNG */
function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface MorningSuggestion {
  business: Business;
  categoryLabel: { hr: string; en: string };
}

export function useMorningRoutine(): MorningSuggestion[] {
  const { data: approvedPlaces } = useApprovedPlaces();

  return useMemo(() => {
    const dayOfYear = getDayOfYear();
    const rng = mulberry32(dayOfYear * 31337);
    const recentlySeen = getRecentlySeen();

    // Merge all business sources
    const allBusinesses = [...businesses, ...(approvedPlaces || [])];

    // Filter only open businesses
    const openBusinesses = allBusinesses.filter((b) => isBusinessOpen(b));

    // Group by morning-relevant categories
    const byCategory = new Map<MorningCategory, Business[]>();
    for (const cat of MORNING_CATEGORIES) {
      byCategory.set(cat, []);
    }

    for (const b of openBusinesses) {
      const cat = b.category as MorningCategory;
      if (byCategory.has(cat)) {
        byCategory.get(cat)!.push(b);
      }
    }

    // Score and sort each category's businesses
    function scoreBusiness(b: Business): number {
      let score = 0;

      // Freshness boost: unseen in last 48h
      if (!recentlySeen.has(b.id)) {
        score += 20;
      }

      // Small randomness per day for variety
      score += rng() * 10;

      return score;
    }

    // Sort each category by score
    for (const [cat, items] of byCategory) {
      const scored = items.map((b) => ({ b, s: scoreBusiness(b) }));
      scored.sort((a, b) => b.s - a.s);
      byCategory.set(
        cat,
        scored.map((x) => x.b)
      );
    }

    // Pick suggestions ensuring at least 3 DIFFERENT categories
    // Pharmacy only as fallback
    const suggestions: MorningSuggestion[] = [];
    const usedCategories = new Set<MorningCategory>();
    const usedIds = new Set<string>();

    // Priority order (pharmacy last)
    const categoryOrder: MorningCategory[] = seededShuffle(
      ['cafes', 'shops', 'parking', 'restaurants'] as MorningCategory[],
      rng
    );

    // Phase 1: one per category (diverse picks)
    for (const cat of categoryOrder) {
      if (suggestions.length >= 4) break;
      const candidates = byCategory.get(cat) || [];
      const pick = candidates.find((b) => !usedIds.has(b.id));
      if (pick) {
        suggestions.push({
          business: pick,
          categoryLabel: CATEGORY_LABELS[cat],
        });
        usedCategories.add(cat);
        usedIds.add(pick.id);
      }
    }

    // Phase 2: if < 3 results, add pharmacy as fallback
    if (suggestions.length < 3) {
      const pharmacies = byCategory.get('pharmacy') || [];
      for (const p of pharmacies) {
        if (suggestions.length >= 3) break;
        if (!usedIds.has(p.id)) {
          suggestions.push({
            business: p,
            categoryLabel: CATEGORY_LABELS.pharmacy,
          });
          usedIds.add(p.id);
        }
      }
    }

    // Cap at 4, ensure minimum 3
    const final = suggestions.slice(0, 4);



    // Mark these as seen
    markSeen(final.map((s) => s.business.id));

    return final;
  }, [approvedPlaces]);
}

export { CATEGORY_LABELS };
