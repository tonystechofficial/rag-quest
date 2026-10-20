import { Chunk, chunkByWords, countWords } from './chunker';
import { buildIndex, queryTerms, search, SearchResult } from './retrieval';

export interface ChunkLabQuestion {
  q: string;
  /** Every keyword must appear in a single retrieved chunk for the question to count as answered. */
  keywords: string[];
}

export interface QuestionResult {
  question: ChunkLabQuestion;
  /** The query as the retriever sees it after normalization. */
  terms: string[];
  retrieved: SearchResult[];
  hit: boolean;
  contextWords: number;
}

export interface ChunkingReport {
  chunks: Chunk[];
  documentWords: number;
  results: QuestionResult[];
  hits: number;
  /** 0..1 — share of the document that was NOT sent to the model, averaged over questions. */
  efficiency: number;
  /** 0..100 — 80% for answered questions, 20% for efficiency. */
  score: number;
}

export const HITS_WEIGHT = 80;
export const EFFICIENCY_WEIGHT = 20;

/**
 * Chunk a document, retrieve the top-k chunks for every question with the TF-IDF retriever,
 * and check whether one retrieved chunk contains the complete fact (all keywords).
 */
export function evaluateChunking(
  document: string,
  questions: ChunkLabQuestion[],
  size: number,
  overlap: number,
  topK = 2,
): ChunkingReport {
  const chunks = chunkByWords(document, size, overlap);
  const documentWords = countWords(document);
  const index = buildIndex(chunks);
  const byId = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  const results: QuestionResult[] = questions.map((question) => {
    const retrieved = search(index, question.q, topK);
    const hit = retrieved.some((result) => {
      const chunk = byId.get(result.id);
      return chunk ? containsAll(chunk.text, question.keywords) : false;
    });
    const contextWords = retrieved.reduce(
      (sum, result) => sum + (byId.get(result.id)?.text.split(' ').length ?? 0),
      0,
    );
    return { question, terms: queryTerms(index, question.q), retrieved, hit, contextWords };
  });

  const hits = results.filter((result) => result.hit).length;
  const efficiency =
    results.length === 0 || documentWords === 0
      ? 0
      : results.reduce(
          (sum, result) => sum + clamp(1 - result.contextWords / documentWords, 0, 1),
          0,
        ) / results.length;
  const score =
    questions.length === 0
      ? 0
      : Math.round((HITS_WEIGHT * hits) / questions.length + EFFICIENCY_WEIGHT * efficiency);

  return { chunks, documentWords, results, hits, efficiency, score };
}

function containsAll(text: string, keywords: string[]): boolean {
  const haystack = text.toLowerCase();
  return keywords.every((keyword) => haystack.includes(keyword.toLowerCase()));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
