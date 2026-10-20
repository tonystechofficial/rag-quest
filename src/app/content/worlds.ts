import { Level, World, WorldId } from '../core/models';
import { DATA_LEVELS } from './data-world';
import { NLP_LEVELS } from './nlp-world';
import { RAG_LEVELS } from './rag-world';

export const WORLDS: World[] = [
  {
    id: 'data',
    name: 'Data Foundations',
    wing: 'The Data Vault',
    tagline: 'Garbage in, garbage out.',
    description: 'Clean, measure, split and shape data before any model touches it.',
    icon: 'archive',
    story:
      "Every answer the Oracle gives starts as a row in a ledger or a line in a file. The Vault's ledgers " +
      'are full of holes, duplicates and impossible numbers, and the Oracle repeats them with total ' +
      'confidence. Clean the Vault first: nothing downstream can fix what is broken here.',
    mentorIntro:
      'Welcome to the Vault. Rule one of the Archive: before you trust a number, look at where it came from.',
  },
  {
    id: 'nlp',
    name: 'NLP Basics',
    wing: 'The Language Hall',
    tagline: 'Teach the machine to read.',
    description: 'Tokens, stopwords, lemmas, TF-IDF, embeddings, entities and sentiment.',
    icon: 'type',
    story:
      'Before the Archive can retrieve anything, it has to read: cut text into tokens, drop the noise, weigh ' +
      'the words, place meaning in space. In this hall you teach it, one mechanism at a time, and you learn ' +
      'why the Oracle sometimes misreads a perfectly clear sentence.',
    mentorIntro:
      'The Hall is where words become numbers. Keep asking: what does the machine actually see here?',
  },
  {
    id: 'rag',
    name: 'RAG Lab',
    wing: 'The Retrieval Engine',
    tagline: 'Give the model a library, not a memory.',
    description: 'Chunk, retrieve, budget the context and check every claim of the answer.',
    icon: 'book',
    story:
      'Here the Oracle looks things up before it speaks. Chunk the shelves, retrieve the right passages, fit ' +
      "them into the Oracle's limited memory, and check every claim it makes against the sources. Rebuild " +
      'the Engine and the hallucinations stop.',
    mentorIntro:
      'Last wing. Everything you fixed upstream pays off here — and every shortcut you took comes back.',
  },
];

/**
 * The order of the quests inside the Archive. The last quest of each wing is its boss:
 * beating it (one star) opens the next wing.
 */
export const QUEST_ORDER: string[] = [
  // The Data Vault
  'dirty-data',
  'data-shapes',
  'mean-median-monsters',
  'split-smart',
  // The Language Hall
  'token-counter',
  'stopword-sweeper',
  'lemma-lab',
  'tfidf-showdown',
  'entity-hunter',
  'sentiment-sorter',
  'embedding-explorer',
  // The Retrieval Engine
  'pipeline-builder',
  'chunk-master',
  'retrieval-ranker',
  'context-budget',
  'hallucination-hunter',
  'rag-boss',
];

const ALL_LEVELS: Level[] = [...DATA_LEVELS, ...NLP_LEVELS, ...RAG_LEVELS];

export const LEVELS: Level[] = [...ALL_LEVELS].sort(
  (a, b) => QUEST_ORDER.indexOf(a.id) - QUEST_ORDER.indexOf(b.id),
);

export function findWorld(id: string): World | undefined {
  return WORLDS.find((world) => world.id === id);
}

export function levelsForWorld(id: WorldId): Level[] {
  return LEVELS.filter((level) => level.world === id);
}

export function findLevel(id: string): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}

/** The level that follows `id` in the global order, or undefined after the last one. */
export function nextLevel(id: string): Level | undefined {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index === -1 ? undefined : LEVELS[index + 1];
}

/** The level that precedes `id` inside its own wing, or undefined for the first quest of a wing. */
export function previousInWing(id: string): Level | undefined {
  const level = findLevel(id);
  if (!level) return undefined;
  const wing = levelsForWorld(level.world);
  const index = wing.findIndex((candidate) => candidate.id === id);
  return index > 0 ? wing[index - 1] : undefined;
}

export const TOTAL_XP = LEVELS.reduce((sum, level) => sum + level.xp, 0);
