import { countTokens, tokenize } from './tokenizer';

describe('tokenize', () => {
  it('attaches a leading space to word tokens like GPT-style tokenizers', () => {
    expect(tokenize('Hello world').map((t) => t.text)).toEqual(['Hello', ' world']);
  });

  it('keeps short words whole and splits long words into sub-word pieces', () => {
    expect(tokenize('cat').map((t) => t.text)).toEqual(['cat']);
    expect(tokenize('tokenization').map((t) => t.text)).toEqual(['token', 'ization']);
    expect(tokenize(' tokenization').map((t) => t.text)).toEqual([' token', 'ization']);
  });

  it('chops long roots without a known suffix into four-letter pieces', () => {
    expect(tokenize('unbelievably').map((t) => t.text)).toEqual(['unbe', 'liev', 'ably']);
  });

  it('splits digit runs into groups of three', () => {
    expect(tokenize('1234567').map((t) => t.text)).toEqual(['123', '456', '7']);
    expect(tokenize('in 2025').map((t) => t.text)).toEqual(['in', ' 202', '5']);
  });

  it('separates punctuation from words and keeps a punctuation run as one token', () => {
    expect(tokenize('Hi!').map((t) => t.text)).toEqual(['Hi', '!']);
    expect(tokenize('wait...').map((t) => t.text)).toEqual(['wait', '...']);
  });

  it('charges two tokens for an emoji but shows it as one chip', () => {
    const tokens = tokenize('😀');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].cost).toBe(2);
    expect(tokens[0].kind).toBe('symbol');
  });

  it('keeps standalone whitespace runs as tokens', () => {
    expect(tokenize('a  b').map((t) => t.text)).toEqual(['a', ' ', ' b']);
    expect(tokenize('a\nb').map((t) => t.text)).toEqual(['a', '\n', 'b']);
  });

  it('labels token kinds', () => {
    expect(tokenize('Hi 42!').map((t) => t.kind)).toEqual(['word', 'number', 'punct']);
    expect(tokenize('tokenization').map((t) => t.kind)).toEqual(['subword', 'subword']);
  });

  it('treats accented letters as letters', () => {
    expect(tokenize('déjà vu').map((t) => t.text)).toEqual(['déjà', ' vu']);
  });
});

describe('countTokens', () => {
  it('returns 0 for empty text', () => {
    expect(countTokens('')).toBe(0);
  });

  it('sums token costs', () => {
    expect(countTokens('The cat sat on the mat.')).toBe(7);
    expect(countTokens('I ❤️ NLP')).toBe(1 + 2 + 1);
  });
});
