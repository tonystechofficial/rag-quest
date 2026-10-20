import { buildIndex, reciprocalRank, recallAtK, search } from './retrieval';

const chunks = [
  { id: 'cat', text: 'Cats are small felines that purr and chase mice.' },
  { id: 'dog', text: 'Dogs are loyal animals that bark and fetch sticks.' },
  { id: 'stocks', text: 'The stock market fell as investors sold shares.' },
];

describe('search', () => {
  const index = buildIndex(chunks);

  it('ranks the chunk sharing rare terms with the query first', () => {
    expect(search(index, 'feline cats purr', 3)[0].id).toBe('cat');
  });

  it('returns exactly k results even when some do not match', () => {
    expect(search(index, 'animals', 2)).toHaveLength(2);
    expect(search(index, 'animals', 2)[0].id).toBe('dog');
  });

  it('gives a zero score to every chunk when nothing matches', () => {
    const results = search(index, 'quantum physics', 3);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.score === 0)).toBe(true);
  });

  it('is case-insensitive and ignores punctuation', () => {
    expect(search(index, 'STOCK, market!', 1)[0].id).toBe('stocks');
  });

  it('returns scores in descending order with 1-based ranks', () => {
    const results = search(index, 'cats and dogs', 3);
    const scores = results.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(results.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('exposes the vocabulary of the index without stopwords', () => {
    expect(index.vocabulary.length).toBeGreaterThan(5);
    expect(index.vocabulary).not.toContain('the');
  });
});

describe('retrieval metrics', () => {
  it('recall@k is the share of relevant items found in the first k results', () => {
    expect(recallAtK(['a', 'b', 'c'], ['b', 'z'], 3)).toBeCloseTo(0.5);
    expect(recallAtK(['a', 'b', 'c'], ['c'], 2)).toBe(0);
    expect(recallAtK(['a', 'b'], [], 2)).toBe(1);
  });

  it('reciprocal rank is 1 over the position of the first relevant result', () => {
    expect(reciprocalRank(['a', 'b', 'c'], ['c'])).toBeCloseTo(1 / 3);
    expect(reciprocalRank(['a', 'b', 'c'], ['a', 'c'])).toBe(1);
    expect(reciprocalRank(['a', 'b'], ['z'])).toBe(0);
  });
});
