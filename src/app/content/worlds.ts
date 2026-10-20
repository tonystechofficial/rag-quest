import { Level, World, WorldId } from '../core/models';
import { DATA_LEVELS } from './data-world';
import { NLP_LEVELS } from './nlp-world';
import { RAG_LEVELS } from './rag-world';

export const WORLDS: World[] = [
  {
    id: 'data',
    name: 'Data Foundations',
    tagline: 'Garbage in, garbage out.',
    description: 'Clean, measure, split and shape data before any model touches it.',
    icon: '🧹',
  },
  {
    id: 'nlp',
    name: 'NLP Basics',
    tagline: 'Teach the machine to read.',
    description: 'Tokens, stopwords, lemmas, TF-IDF, embeddings, entities and sentiment.',
    icon: '🔤',
  },
  {
    id: 'rag',
    name: 'RAG Lab',
    tagline: 'Give the model a library, not a memory.',
    description: 'Chunk, retrieve, budget the context and check every claim of the answer.',
    icon: '📚',
  },
];

export const LEVELS: Level[] = [...DATA_LEVELS, ...NLP_LEVELS, ...RAG_LEVELS];

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

export const TOTAL_XP = LEVELS.reduce((sum, level) => sum + level.xp, 0);
