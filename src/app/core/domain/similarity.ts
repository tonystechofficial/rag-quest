export type Metric = 'cosine' | 'euclidean';

export interface Neighbor {
  id: string;
  /** Cosine similarity (higher is closer) or euclidean distance (lower is closer). */
  score: number;
}

function assertSameLength(a: number[], b: number[]): void {
  if (a.length !== b.length) {
    throw new RangeError(`vectors must have the same length (${a.length} vs ${b.length})`);
  }
}

export function dot(a: number[], b: number[]): number {
  assertSameLength(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

/** Cosine similarity in [-1, 1]; 0 when either vector has no direction. */
export function cosine(a: number[], b: number[]): number {
  assertSameLength(a, b);
  const denominator = norm(a) * norm(b);
  if (denominator === 0) {
    return 0;
  }
  return Math.min(1, Math.max(-1, dot(a, b) / denominator));
}

export function euclidean(a: number[], b: number[]): number {
  assertSameLength(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function nearestNeighbors(
  query: number[],
  items: { id: string; vector: number[] }[],
  k: number,
  metric: Metric = 'cosine',
): Neighbor[] {
  const scored = items.map((item) => ({
    id: item.id,
    score: metric === 'cosine' ? cosine(query, item.vector) : euclidean(query, item.vector),
  }));
  scored.sort((x, y) => (metric === 'cosine' ? y.score - x.score : x.score - y.score));
  return scored.slice(0, Math.max(0, k));
}
