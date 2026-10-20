import { cosine, dot, euclidean, nearestNeighbors, norm } from './similarity';

describe('dot and norm', () => {
  it('computes the dot product', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('computes the euclidean norm', () => {
    expect(norm([3, 4])).toBe(5);
  });
});

describe('cosine', () => {
  it('is 1 for vectors pointing the same way', () => {
    expect(cosine([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
  });

  it('is 0 for orthogonal vectors', () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });

  it('is -1 for opposite vectors', () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1, 6);
  });

  it('returns 0 instead of NaN when a vector is all zeros', () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });

  it('throws on a length mismatch', () => {
    expect(() => cosine([1], [1, 2])).toThrow();
  });
});

describe('euclidean', () => {
  it('computes the distance between two points', () => {
    expect(euclidean([0, 0], [3, 4])).toBe(5);
  });
});

describe('nearestNeighbors', () => {
  const items = [
    { id: 'a', vector: [1, 0] },
    { id: 'b', vector: [0, 1] },
    { id: 'c', vector: [0.9, 0.1] },
  ];

  it('ranks by cosine similarity, highest first', () => {
    expect(nearestNeighbors([1, 0], items, 2).map((r) => r.id)).toEqual(['a', 'c']);
  });

  it('can rank by euclidean distance, closest first', () => {
    expect(nearestNeighbors([0, 0.9], items, 1, 'euclidean')[0].id).toBe('b');
  });

  it('exposes the score of each neighbour', () => {
    expect(nearestNeighbors([1, 0], items, 1)[0].score).toBeCloseTo(1, 6);
    expect(nearestNeighbors([0, 1], items, 1, 'euclidean')[0].score).toBe(0);
  });

  it('never returns more than k items', () => {
    expect(nearestNeighbors([1, 0], items, 10)).toHaveLength(3);
  });
});
