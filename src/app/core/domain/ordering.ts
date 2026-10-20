/**
 * Fraction of item pairs that appear in the right relative order.
 * 1 for the correct sequence, 0 for the reversed one — gentler than exact-position scoring.
 */
export function pairwiseOrderAccuracy(submitted: string[], correct: string[]): number {
  const sameItems =
    submitted.length === correct.length &&
    new Set(submitted).size === submitted.length &&
    correct.every((id) => submitted.includes(id));
  if (!sameItems) {
    throw new Error('submitted and correct orders must contain the same items');
  }
  const position = new Map(submitted.map((id, index) => [id, index]));
  let pairs = 0;
  let ordered = 0;
  for (let i = 0; i < correct.length; i++) {
    for (let j = i + 1; j < correct.length; j++) {
      pairs++;
      if ((position.get(correct[i]) ?? 0) < (position.get(correct[j]) ?? 0)) {
        ordered++;
      }
    }
  }
  return pairs === 0 ? 1 : ordered / pairs;
}

/** mulberry32: a tiny deterministic PRNG, plenty for shuffling game content. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle of a copy of `items`, reproducible for a given seed. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const random = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
