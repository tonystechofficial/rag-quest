import { pairwiseOrderAccuracy, seededShuffle } from './ordering';

describe('pairwiseOrderAccuracy', () => {
  it('is 1 for the correct order', () => {
    expect(pairwiseOrderAccuracy(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
  });

  it('is 0 for the reversed order', () => {
    expect(pairwiseOrderAccuracy(['c', 'b', 'a'], ['a', 'b', 'c'])).toBe(0);
  });

  it('counts the fraction of correctly ordered pairs', () => {
    expect(pairwiseOrderAccuracy(['b', 'a', 'c'], ['a', 'b', 'c'])).toBeCloseTo(2 / 3);
  });

  it('throws when the two lists do not hold the same items', () => {
    expect(() => pairwiseOrderAccuracy(['a'], ['a', 'b'])).toThrow();
    expect(() => pairwiseOrderAccuracy(['a', 'x'], ['a', 'b'])).toThrow();
  });
});

describe('seededShuffle', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];

  it('returns a permutation of the input', () => {
    expect([...seededShuffle(input, 42)].sort((a, b) => a - b)).toEqual(input);
  });

  it('is deterministic for a given seed', () => {
    expect(seededShuffle(input, 7)).toEqual(seededShuffle(input, 7));
  });

  it('does not mutate the input', () => {
    const copy = [...input];
    seededShuffle(input, 3);
    expect(input).toEqual(copy);
  });

  it('actually reorders a non-trivial list', () => {
    expect(seededShuffle(input, 1)).not.toEqual(input);
  });
});
