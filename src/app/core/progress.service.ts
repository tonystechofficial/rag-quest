import { computed, Injectable, signal } from '@angular/core';
import { playerRank, starsForScore, xpForResult } from './domain/scoring';

export interface LevelResult {
  bestScore: number;
  stars: number;
  xp: number;
  attempts: number;
  lastPlayed: string;
}

interface ProgressState {
  version: 1;
  results: Record<string, LevelResult>;
}

export interface RecordOutcome {
  stars: number;
  xpGained: number;
  improved: boolean;
  previousBest: number | null;
}

const STORAGE_KEY = 'rag-quest.progress.v1';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly state = signal<ProgressState>(load());

  readonly results = computed(() => this.state().results);
  readonly totalXp = computed(() =>
    Object.values(this.state().results).reduce((sum, result) => sum + result.xp, 0),
  );
  readonly rank = computed(() => playerRank(this.totalXp()));
  readonly completedLevels = computed(
    () => Object.values(this.state().results).filter((result) => result.stars > 0).length,
  );
  readonly totalStars = computed(() =>
    Object.values(this.state().results).reduce((sum, result) => sum + result.stars, 0),
  );

  resultFor(levelId: string): LevelResult | undefined {
    return this.state().results[levelId];
  }

  record(levelId: string, scorePct: number, maxXp: number): RecordOutcome {
    const previous = this.resultFor(levelId);
    const stars = starsForScore(scorePct);
    const xp = xpForResult(maxXp, scorePct);
    const improved = !previous || scorePct > previous.bestScore;
    const next: LevelResult = {
      bestScore: improved ? scorePct : previous.bestScore,
      stars: Math.max(stars, previous?.stars ?? 0),
      xp: Math.max(xp, previous?.xp ?? 0),
      attempts: (previous?.attempts ?? 0) + 1,
      lastPlayed: new Date().toISOString(),
    };
    this.state.update((state) => {
      const updated = { ...state, results: { ...state.results, [levelId]: next } };
      save(updated);
      return updated;
    });
    return {
      stars,
      xpGained: Math.max(0, next.xp - (previous?.xp ?? 0)),
      improved,
      previousBest: previous?.bestScore ?? null,
    };
  }

  reset(): void {
    const empty: ProgressState = { version: 1, results: {} };
    save(empty);
    this.state.set(empty);
  }
}

function load(): ProgressState {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      if (parsed.version === 1 && parsed.results && typeof parsed.results === 'object') {
        return { version: 1, results: parsed.results };
      }
    }
  } catch {
    // Private mode, blocked storage or corrupted JSON: start fresh.
  }
  return { version: 1, results: {} };
}

function save(state: ProgressState): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: progress simply lives for the session.
  }
}
