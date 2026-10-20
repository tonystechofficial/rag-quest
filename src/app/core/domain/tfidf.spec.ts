import {
  inverseDocumentFrequency,
  normalizeText,
  sparseCosine,
  termFrequency,
  tfidfVectors,
  topTerms,
} from './tfidf';

describe('normalizeText', () => {
  it('lowercases, strips punctuation and splits on whitespace', () => {
    expect(normalizeText('The Cat, sat!')).toEqual(['the', 'cat', 'sat']);
  });

  it('can drop stopwords', () => {
    expect(normalizeText('The cat sat on the mat', { removeStopwords: true })).toEqual([
      'cat',
      'sat',
      'mat',
    ]);
  });

  it('keeps accented letters and digits', () => {
    expect(normalizeText('Réseaux 2025')).toEqual(['réseaux', '2025']);
  });

  it('returns an empty list for blank text', () => {
    expect(normalizeText('  ...  ')).toEqual([]);
  });
});

describe('term frequency and inverse document frequency', () => {
  const docs = [
    ['the', 'cat', 'sat'],
    ['the', 'dog', 'sat'],
    ['the', 'bird', 'flew'],
  ];

  it('term frequency is the count divided by the document length', () => {
    const tf = termFrequency(['a', 'b', 'a', 'c']);
    expect(tf.get('a')).toBeCloseTo(0.5);
    expect(tf.get('b')).toBeCloseTo(0.25);
  });

  it('idf is zero for a term present in every document', () => {
    expect(inverseDocumentFrequency(docs).get('the')).toBeCloseTo(0);
  });

  it('idf is ln(N / df)', () => {
    const idf = inverseDocumentFrequency(docs);
    expect(idf.get('cat')).toBeCloseTo(Math.log(3));
    expect(idf.get('sat')).toBeCloseTo(Math.log(1.5));
  });

  it('tf-idf weights combine both factors', () => {
    const vectors = tfidfVectors(docs);
    expect(vectors[0].get('cat')).toBeCloseTo((1 / 3) * Math.log(3));
    expect(vectors[0].get('the')).toBeCloseTo(0);
    expect(vectors[0].has('dog')).toBe(false);
  });

  it('topTerms returns the heaviest terms first, ties broken alphabetically', () => {
    const vectors = tfidfVectors(docs);
    expect(topTerms(vectors[0], 2).map((t) => t.term)).toEqual(['cat', 'sat']);
    expect(topTerms(vectors[2], 2).map((t) => t.term)).toEqual(['bird', 'flew']);
  });
});

describe('sparseCosine', () => {
  it('is 1 for identical sparse vectors', () => {
    const v = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    expect(sparseCosine(v, v)).toBeCloseTo(1, 6);
  });

  it('is 0 for disjoint vectors', () => {
    expect(sparseCosine(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(0);
  });

  it('is 0 when one vector is empty', () => {
    expect(sparseCosine(new Map(), new Map([['b', 1]]))).toBe(0);
  });
});
