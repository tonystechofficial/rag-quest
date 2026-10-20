import { stem } from './stemmer';

export type SparseVector = Map<string, number>;

export interface NormalizeOptions {
  removeStopwords?: boolean;
  /** Reduce plural / -y forms to a common stem so "batteries" matches "battery". */
  stem?: boolean;
}

/** A compact English stopword list, close to the classic NLTK one. */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'if',
  'then',
  'else',
  'when',
  'while',
  'of',
  'at',
  'by',
  'for',
  'with',
  'about',
  'against',
  'between',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'to',
  'from',
  'up',
  'down',
  'in',
  'out',
  'on',
  'off',
  'over',
  'under',
  'again',
  'further',
  'once',
  'here',
  'there',
  'where',
  'why',
  'how',
  'all',
  'any',
  'both',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'can',
  'will',
  'just',
  'should',
  'now',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'having',
  'do',
  'does',
  'did',
  'doing',
  'i',
  'me',
  'my',
  'we',
  'our',
  'you',
  'your',
  'he',
  'him',
  'his',
  'she',
  'her',
  'it',
  'its',
  'they',
  'them',
  'their',
  'what',
  'which',
  'who',
  'whom',
  'this',
  'that',
  'these',
  'those',
  'am',
  'as',
  'until',
  's',
  't',
]);

/** Lowercase, drop punctuation, split on whitespace (optionally remove stopwords). */
export function normalizeText(text: string, options: NormalizeOptions = {}): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const kept = options.removeStopwords ? tokens.filter((token) => !STOPWORDS.has(token)) : tokens;
  return options.stem ? kept.map(stem) : kept;
}

/** Term frequency: count of the term divided by the number of tokens in the document. */
export function termFrequency(tokens: string[]): SparseVector {
  const tf: SparseVector = new Map();
  if (tokens.length === 0) {
    return tf;
  }
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  for (const [term, count] of tf) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

/** Classic idf = ln(N / df): a term present in every document weighs zero. */
export function inverseDocumentFrequency(docs: string[][]): SparseVector {
  const df: SparseVector = new Map();
  for (const doc of docs) {
    for (const term of new Set(doc)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const idf: SparseVector = new Map();
  for (const [term, count] of df) {
    idf.set(term, Math.log(docs.length / count));
  }
  return idf;
}

export function weigh(tf: SparseVector, idf: SparseVector): SparseVector {
  const weighted: SparseVector = new Map();
  for (const [term, frequency] of tf) {
    const inverse = idf.get(term);
    if (inverse !== undefined) {
      weighted.set(term, frequency * inverse);
    }
  }
  return weighted;
}

export function tfidfVectors(docs: string[][]): SparseVector[] {
  const idf = inverseDocumentFrequency(docs);
  return docs.map((doc) => weigh(termFrequency(doc), idf));
}

export function topTerms(vector: SparseVector, n: number): { term: string; weight: number }[] {
  return [...vector.entries()]
    .map(([term, weight]) => ({ term, weight }))
    .sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term))
    .slice(0, Math.max(0, n));
}

export function sparseCosine(a: SparseVector, b: SparseVector): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other !== undefined) {
      dot += weight * other;
    }
  }
  const denominator = sparseNorm(a) * sparseNorm(b);
  return denominator === 0 ? 0 : Math.min(1, dot / denominator);
}

function sparseNorm(vector: SparseVector): number {
  let sum = 0;
  for (const weight of vector.values()) {
    sum += weight * weight;
  }
  return Math.sqrt(sum);
}
