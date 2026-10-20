export interface Rank {
  title: string;
  minXp: number;
}

export interface RankStatus {
  title: string;
  minXp: number;
  next: Rank | null;
  /** 0..1 progress from the current rank threshold to the next one. */
  progress: number;
}

export interface PrfMetrics {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

export const RANKS: readonly Rank[] = [
  { title: 'Data Novice', minXp: 0 },
  { title: 'Token Apprentice', minXp: 100 },
  { title: 'Vector Analyst', minXp: 300 },
  { title: 'Embedding Engineer', minXp: 600 },
  { title: 'RAG Architect', minXp: 1000 },
  { title: 'RAG Grandmaster', minXp: 1500 },
];

export function starsForScore(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 60) return 2;
  if (pct >= 30) return 1;
  return 0;
}

export function xpForResult(maxXp: number, pct: number): number {
  return Math.round((maxXp * starsForScore(pct)) / 3);
}

export function playerRank(xp: number): RankStatus {
  let current = RANKS[0];
  let next: Rank | null = RANKS[1] ?? null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1;
  return { title: current.title, minXp: current.minXp, next, progress: clamp(progress, 0, 1) };
}

export function precisionRecallF1(tp: number, fp: number, fn: number): PrfMetrics {
  const precision = tp + fp === 0 ? (fn === 0 ? 1 : 0) : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { tp, fp, fn, precision, recall, f1 };
}

/** Precision / recall / F1 of a predicted set of keys against the expected set. */
export function setF1(predicted: string[], expected: string[]): PrfMetrics {
  const predictedSet = new Set(predicted);
  const expectedSet = new Set(expected);
  let tp = 0;
  for (const key of predictedSet) {
    if (expectedSet.has(key)) tp++;
  }
  return precisionRecallF1(tp, predictedSet.size - tp, expectedSet.size - tp);
}

/** 100 for an exact guess, minus 100 points per 100% of relative error, floored at 0. */
export function closenessScore(guess: number, actual: number): number {
  if (actual === 0) {
    return guess === 0 ? 100 : 0;
  }
  const relativeError = Math.abs(guess - actual) / Math.abs(actual);
  return Math.max(0, Math.round(100 - 100 * relativeError));
}

/** Relevance gathered by the picked items, relative to the best k items available. */
export function pickScore(
  picked: string[],
  items: { id: string; relevance: number }[],
  k: number,
): number {
  const pickedSet = new Set(picked);
  const gathered = items
    .filter((item) => pickedSet.has(item.id))
    .reduce((sum, item) => sum + item.relevance, 0);
  const best = [...items]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, k)
    .reduce((sum, item) => sum + item.relevance, 0);
  if (best === 0) {
    return 100;
  }
  return Math.min(100, (gathered / best) * 100);
}

/** Radius (in map units) inside which a placement counts as perfect. */
export const PLACEMENT_TOLERANCE = 0.12;
/** Beyond tolerance + range the placement scores 0. */
export const PLACEMENT_RANGE = 0.7;

/** Score for placing a word on the embedding map, from its distance to the true position. */
export function placementScore(distance: number): number {
  if (distance <= PLACEMENT_TOLERANCE) {
    return 100;
  }
  return Math.max(0, Math.round(100 * (1 - (distance - PLACEMENT_TOLERANCE) / PLACEMENT_RANGE)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
