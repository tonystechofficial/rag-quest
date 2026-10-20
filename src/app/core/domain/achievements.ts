import { WorldId } from '../models';
import { QuestRef } from './progression';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface QuestOutcome {
  stars: number;
  /** Feats declared by the engines (exact-token-count, all-claims-right…) and by the progress service (flawless, comeback). */
  feats: string[];
}

export interface PlayerSnapshot {
  results: Record<string, QuestOutcome | undefined>;
  streakDays: number;
  glossaryOpened: boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Finish your first quest with at least one star.',
    icon: '🥾',
  },
  {
    id: 'data-janitor',
    title: 'Data Janitor',
    description: 'Flag every planted issue in Dirty Data Detective without a single false alarm.',
    icon: '🧹',
  },
  {
    id: 'token-whisperer',
    title: 'Token Whisperer',
    description: 'Guess a token count exactly right.',
    icon: '🔮',
  },
  {
    id: 'bullseye',
    title: 'Bullseye',
    description: 'Place a word inside the perfect radius on the embedding map.',
    icon: '🎯',
  },
  {
    id: 'hallucination-hunter',
    title: 'Hallucination Hunter',
    description: 'Judge every claim correctly through a whole Hallucination Hunter run.',
    icon: '🕵️',
  },
  {
    id: 'perfect-chunker',
    title: 'Perfect Chunker',
    description: 'Score 95% or more in Chunk Master.',
    icon: '🧩',
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Score 90% or more on every round of a quest without asking Ada for a hint.',
    icon: '💎',
  },
  {
    id: 'comeback',
    title: 'Comeback',
    description: 'Improve one of your best scores by 30 points or more.',
    icon: '📈',
  },
  {
    id: 'wing-keeper-data',
    title: 'Keeper of the Vault',
    description: 'Three stars on every quest of the Data Vault.',
    icon: '🗄️',
  },
  {
    id: 'wing-keeper-nlp',
    title: 'Keeper of the Hall',
    description: 'Three stars on every quest of the Language Hall.',
    icon: '📖',
  },
  {
    id: 'wing-keeper-rag',
    title: 'Keeper of the Engine',
    description: 'Three stars on every quest of the Retrieval Engine.',
    icon: '⚙️',
  },
  {
    id: 'streak-3',
    title: 'Three Days Running',
    description: 'Play on three consecutive days.',
    icon: '🔥',
  },
  {
    id: 'bookworm',
    title: 'Bookworm',
    description: 'Open the glossary at least once.',
    icon: '📚',
  },
  {
    id: 'oracle-restored',
    title: 'Oracle Restored',
    description: 'Earn at least one star on every quest of the Archive.',
    icon: '🏛️',
  },
  {
    id: 'grandmaster',
    title: 'RAG Grandmaster',
    description: 'Three stars on every quest of the Archive.',
    icon: '👑',
  },
];

const FEAT_BADGES: Record<string, string> = {
  'all-issues-found': 'data-janitor',
  'exact-token-count': 'token-whisperer',
  bullseye: 'bullseye',
  'all-claims-right': 'hallucination-hunter',
  'chunk-95': 'perfect-chunker',
  flawless: 'flawless',
  comeback: 'comeback',
};

const WINGS: WorldId[] = ['data', 'nlp', 'rag'];

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((badge) => badge.id === id);
}

/** Badge ids unlocked by a player snapshot, in catalogue order. */
export function unlockedBadgeIds(snapshot: PlayerSnapshot, quests: QuestRef[]): string[] {
  const unlocked = new Set<string>();
  const outcomes = Object.values(snapshot.results).filter(
    (outcome): outcome is QuestOutcome => !!outcome,
  );
  const starsOf = (id: string) => snapshot.results[id]?.stars ?? 0;

  if (outcomes.some((outcome) => outcome.stars >= 1)) {
    unlocked.add('first-steps');
  }
  for (const outcome of outcomes) {
    for (const feat of outcome.feats) {
      const badge = FEAT_BADGES[feat];
      if (badge) {
        unlocked.add(badge);
      }
    }
  }
  for (const world of WINGS) {
    const wing = quests.filter((quest) => quest.world === world);
    if (wing.length && wing.every((quest) => starsOf(quest.id) === 3)) {
      unlocked.add(`wing-keeper-${world}`);
    }
  }
  if (quests.length && quests.every((quest) => starsOf(quest.id) >= 1)) {
    unlocked.add('oracle-restored');
  }
  if (quests.length && quests.every((quest) => starsOf(quest.id) === 3)) {
    unlocked.add('grandmaster');
  }
  if (snapshot.streakDays >= 3) {
    unlocked.add('streak-3');
  }
  if (snapshot.glossaryOpened) {
    unlocked.add('bookworm');
  }
  return BADGES.map((badge) => badge.id).filter((id) => unlocked.has(id));
}
