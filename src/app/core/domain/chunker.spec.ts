import { chunkByWords, countWords } from './chunker';

const words = 'w1 w2 w3 w4 w5 w6 w7 w8 w9 w10';

describe('chunkByWords', () => {
  it('splits into fixed-size chunks without overlap', () => {
    const chunks = chunkByWords(words, 4, 0);
    expect(chunks.map((c) => c.text)).toEqual(['w1 w2 w3 w4', 'w5 w6 w7 w8', 'w9 w10']);
    expect(chunks[1]).toMatchObject({ start: 4, end: 8 });
  });

  it('overlaps consecutive chunks', () => {
    expect(chunkByWords(words, 4, 1).map((c) => c.text)).toEqual([
      'w1 w2 w3 w4',
      'w4 w5 w6 w7',
      'w7 w8 w9 w10',
    ]);
  });

  it('stops once a chunk reaches the end of the text', () => {
    expect(chunkByWords(words, 4, 2).map((c) => c.text)).toEqual([
      'w1 w2 w3 w4',
      'w3 w4 w5 w6',
      'w5 w6 w7 w8',
      'w7 w8 w9 w10',
    ]);
  });

  it('returns one chunk when the text is shorter than the size', () => {
    expect(chunkByWords('a b c', 10, 2)).toHaveLength(1);
  });

  it('gives sequential ids', () => {
    expect(chunkByWords(words, 5, 0).map((c) => c.id)).toEqual(['c0', 'c1']);
  });

  it('rejects an overlap that is not smaller than the size, and a non-positive size', () => {
    expect(() => chunkByWords(words, 4, 4)).toThrow(RangeError);
    expect(() => chunkByWords(words, 0, 0)).toThrow(RangeError);
    expect(() => chunkByWords(words, 4, -1)).toThrow(RangeError);
  });

  it('returns no chunks for blank text', () => {
    expect(chunkByWords('   ', 4, 0)).toEqual([]);
  });

  it('normalizes whitespace inside chunks', () => {
    expect(chunkByWords('a   b\n c', 2, 0).map((c) => c.text)).toEqual(['a b', 'c']);
  });
});

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords(' one two\tthree\nfour ')).toBe(4);
    expect(countWords('')).toBe(0);
  });
});
