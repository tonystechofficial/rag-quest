/**
 * A deterministic, dependency-free approximation of a BPE tokenizer (GPT style).
 *
 * It is NOT a real tokenizer: real vocabularies are learned from data. It reproduces
 * the behaviours that matter for intuition:
 *  - a leading space is glued to the following word (" world" is one token),
 *  - short common words are a single token, long words are split into sub-words,
 *  - digits are grouped by three, punctuation runs are separate tokens,
 *  - emoji and other symbols cost more than one token.
 */
export type TokenKind = 'word' | 'subword' | 'number' | 'punct' | 'space' | 'symbol';

export interface Token {
  text: string;
  kind: TokenKind;
  /** Number of "real" tokens this chip stands for (emoji usually cost 2+). */
  cost: number;
}

const MAX_WHOLE_WORD = 6;
const PIECE_LENGTH = 4;

/** Common English suffixes, longest first so the greediest match wins. */
const SUFFIXES = [
  'ization',
  'ation',
  'ition',
  'ously',
  'ingly',
  'ments',
  'tion',
  'sion',
  'ment',
  'ness',
  'able',
  'ible',
  'ably',
  'ibly',
  'ance',
  'ence',
  'ship',
  'hood',
  'less',
  'ful',
  'ing',
  'ous',
  'ive',
  'ism',
  'ist',
  'ant',
  'ent',
  'est',
  'ly',
  'ed',
  'er',
  'al',
].sort((a, b) => b.length - a.length);

// Mirrors the GPT-2 pre-tokenization idea: optional leading space + letters | digits | other,
// whitespace runs keep their last space for the next word.
const PATTERN = / ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
const ASCII_PUNCT = /^[\x21-\x7e]+$/;

const segmenter: Intl.Segmenter | null =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(PATTERN)) {
    const piece = match[0];
    if (/^\s+$/.test(piece)) {
      tokens.push({ text: piece, kind: 'space', cost: 1 });
      continue;
    }
    const lead = piece.startsWith(' ') ? ' ' : '';
    const body = lead ? piece.slice(1) : piece;

    if (/^\p{L}+$/u.test(body)) {
      const parts = splitWord(body);
      const kind: TokenKind = parts.length === 1 ? 'word' : 'subword';
      parts.forEach((part, i) =>
        tokens.push({ text: (i === 0 ? lead : '') + part, kind, cost: 1 }),
      );
    } else if (/^\p{N}+$/u.test(body)) {
      const groups = body.match(/.{1,3}/g) ?? [];
      groups.forEach((group, i) =>
        tokens.push({ text: (i === 0 ? lead : '') + group, kind: 'number', cost: 1 }),
      );
    } else if (ASCII_PUNCT.test(body)) {
      tokens.push({ text: piece, kind: 'punct', cost: 1 });
    } else {
      segmentGraphemes(body).forEach((grapheme, i) =>
        tokens.push({
          text: (i === 0 ? lead : '') + grapheme,
          kind: ASCII_PUNCT.test(grapheme) ? 'punct' : 'symbol',
          cost: graphemeCost(grapheme),
        }),
      );
    }
  }
  return tokens;
}

export function countTokens(text: string): number {
  return tokenize(text).reduce((sum, token) => sum + token.cost, 0);
}

function splitWord(word: string): string[] {
  if (word.length <= MAX_WHOLE_WORD) {
    return [word];
  }
  const lower = word.toLowerCase();
  for (const suffix of SUFFIXES) {
    if (word.length - suffix.length >= 3 && lower.endsWith(suffix)) {
      const cut = word.length - suffix.length;
      return [...splitWord(word.slice(0, cut)), word.slice(cut)];
    }
  }
  const pieces: string[] = [];
  for (let i = 0; i < word.length; i += PIECE_LENGTH) {
    pieces.push(word.slice(i, i + PIECE_LENGTH));
  }
  return pieces;
}

function segmentGraphemes(text: string): string[] {
  if (segmenter) {
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

function graphemeCost(grapheme: string): number {
  let cost = 0;
  for (const char of grapheme) {
    const codePoint = char.codePointAt(0) ?? 0;
    cost += codePoint > 0xffff ? 2 : 1;
  }
  return cost;
}
