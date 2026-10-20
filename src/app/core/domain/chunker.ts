export interface Chunk {
  id: string;
  text: string;
  /** Index of the first word (inclusive). */
  start: number;
  /** Index after the last word (exclusive). */
  end: number;
}

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function countWords(text: string): number {
  return splitWords(text).length;
}

/** Fixed-size sliding window over words, with `overlap` words shared by consecutive chunks. */
export function chunkByWords(text: string, size: number, overlap: number): Chunk[] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError('chunk size must be a positive integer');
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= size) {
    throw new RangeError('overlap must be an integer between 0 and size - 1');
  }
  const words = splitWords(text);
  const chunks: Chunk[] = [];
  if (words.length === 0) {
    return chunks;
  }
  const step = size - overlap;
  for (let start = 0, index = 0; ; start += step, index++) {
    const end = Math.min(start + size, words.length);
    chunks.push({ id: `c${index}`, text: words.slice(start, end).join(' '), start, end });
    if (end >= words.length) {
      break;
    }
  }
  return chunks;
}
