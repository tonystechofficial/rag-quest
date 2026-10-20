import {
  inverseDocumentFrequency,
  normalizeText,
  sparseCosine,
  SparseVector,
  termFrequency,
  weigh,
} from './tfidf';

export interface IndexedChunk {
  id: string;
  text: string;
}

export interface SearchIndex {
  chunks: IndexedChunk[];
  vectors: SparseVector[];
  idf: SparseVector;
  vocabulary: string[];
  removeStopwords: boolean;
  stem: boolean;
}

export interface SearchResult {
  id: string;
  score: number;
  /** 1-based position in the result list. */
  rank: number;
}

export interface IndexOptions {
  removeStopwords?: boolean;
  stem?: boolean;
}

/** A tiny sparse (TF-IDF) retriever: the "BM25-like" half of a hybrid RAG search. */
export function buildIndex(chunks: IndexedChunk[], options: IndexOptions = {}): SearchIndex {
  const removeStopwords = options.removeStopwords ?? true;
  const stem = options.stem ?? true;
  const docs = chunks.map((chunk) => normalizeText(chunk.text, { removeStopwords, stem }));
  const idf = inverseDocumentFrequency(docs);
  const vectors = docs.map((doc) => weigh(termFrequency(doc), idf));
  return { chunks, vectors, idf, vocabulary: [...idf.keys()].sort(), removeStopwords, stem };
}

/** The normalized query terms, exactly as the index sees them. */
export function queryTerms(index: SearchIndex, query: string): string[] {
  return normalizeText(query, { removeStopwords: index.removeStopwords, stem: index.stem });
}

export function queryVector(index: SearchIndex, query: string): SparseVector {
  return weigh(termFrequency(queryTerms(index, query)), index.idf);
}

/** Always returns k results (like a vector database would), ordered by descending score. */
export function search(index: SearchIndex, query: string, k: number): SearchResult[] {
  const vector = queryVector(index, query);
  const scored = index.chunks.map((chunk, i) => ({
    id: chunk.id,
    score: sparseCosine(vector, index.vectors[i]),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(0, k)).map((result, i) => ({ ...result, rank: i + 1 }));
}

/** Share of the relevant ids that appear within the first k retrieved ids. */
export function recallAtK(retrieved: string[], relevant: string[], k: number): number {
  if (relevant.length === 0) {
    return 1;
  }
  const top = new Set(retrieved.slice(0, k));
  const found = relevant.filter((id) => top.has(id)).length;
  return found / relevant.length;
}

/** 1 / rank of the first relevant result, 0 when none is retrieved. */
export function reciprocalRank(retrieved: string[], relevant: string[]): number {
  const wanted = new Set(relevant);
  const position = retrieved.findIndex((id) => wanted.has(id));
  return position === -1 ? 0 : 1 / (position + 1);
}
