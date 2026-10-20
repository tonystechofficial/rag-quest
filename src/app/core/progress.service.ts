import { computed, Injectable, signal } from '@angular/core';
import { LEVELS, WORLDS } from '../content/worlds';
import { Badge, badgeById, PlayerSnapshot, unlockedBadgeIds } from './domain/achievements';
import {
  isQuestUnlocked,
  isWingUnlocked,
  nextQuest,
  unlockedQuestIds,
  unlockedWings,
} from './domain/progression';
import { Bonus, bonusXp, playerRank, starsForScore, xpForResult } from './domain/scoring';
import { advanceStreak, dayKey, displayedStreak, Streak } from './domain/streak';
import { ChallengeResult, Level, World, WorldId } from './models';

export interface LevelResult {
  bestScore: number;
  stars: number;
  xp: number;
  bonusXp: number;
  attempts: number;
  lastPlayed: string;
  feats: string[];
}

interface ProgressState {
  version: 2;
  results: Record<string, LevelResult>;
  streak: Streak;
  freePlay: boolean;
  glossaryOpened: boolean;
  playerName: string;
  badgesEarned: string[];
}

interface LegacyState {
  version: 1;
  results: Record<string, Omit<LevelResult, 'bonusXp' | 'feats'>>;
}

export interface Toast {
  id: number;
  icon: string;
  title: string;
  text: string;
}

export interface RecordOutcome {
  stars: number;
  xpGained: number;
  improved: boolean;
  previousBest: number | null;
  bonus: Bonus;
  hinted: boolean;
  newBadges: Badge[];
  unlockedQuests: Level[];
  unlockedWings: World[];
}

const STORAGE_KEY = 'rag-quest.progress.v2';
const LEGACY_KEY = 'rag-quest.progress.v1';
const TOAST_MS = 6000;

function emptyState(): ProgressState {
  return {
    version: 2,
    results: {},
    streak: { lastDay: null, days: 0 },
    freePlay: false,
    glossaryOpened: false,
    playerName: '',
    badgesEarned: [],
  };
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly state = signal<ProgressState>(load());
  private toastSeq = 0;

  readonly results = computed(() => this.state().results);
  readonly totalXp = computed(() =>
    Object.values(this.state().results).reduce(
      (sum, result) => sum + result.xp + result.bonusXp,
      0,
    ),
  );
  readonly rank = computed(() => playerRank(this.totalXp()));
  readonly completedLevels = computed(
    () => Object.values(this.state().results).filter((result) => result.stars > 0).length,
  );
  readonly totalStars = computed(() =>
    Object.values(this.state().results).reduce((sum, result) => sum + result.stars, 0),
  );
  readonly freePlay = computed(() => this.state().freePlay);
  readonly playerName = computed(() => this.state().playerName);
  readonly glossaryOpened = computed(() => this.state().glossaryOpened);
  /** Current streak as shown to the player (0 once a day was missed). */
  readonly streak = computed(() => displayedStreak(this.state().streak, dayKey(new Date())));
  readonly badges = computed(() => this.state().badgesEarned);
  readonly nextQuest = computed(() =>
    nextQuest(LEVELS, this.state().results, this.state().freePlay),
  );
  readonly toasts = signal<Toast[]>([]);

  resultFor(levelId: string): LevelResult | undefined {
    return this.state().results[levelId];
  }

  /** A quest is playable when the progression rules allow it, or when it has already been played. */
  isUnlocked(levelId: string): boolean {
    const state = this.state();
    return (
      isQuestUnlocked(levelId, LEVELS, state.results, state.freePlay) ||
      (state.results[levelId]?.attempts ?? 0) > 0
    );
  }

  isWingOpen(world: WorldId): boolean {
    const state = this.state();
    return isWingUnlocked(world, LEVELS, state.results, state.freePlay);
  }

  hasBadge(id: string): boolean {
    return this.state().badgesEarned.includes(id);
  }

  record(level: Level, result: ChallengeResult, hinted: boolean): RecordOutcome {
    const before = this.state();
    const previous = before.results[level.id];
    const attempts = (previous?.attempts ?? 0) + 1;
    const stars = starsForScore(result.scorePct);
    const bonus = bonusXp({
      scorePct: result.scorePct,
      attempts,
      flawless: !!result.flawless,
      hinted,
    });
    const improved = !previous || result.scorePct > previous.bestScore;
    const feats = new Set([...(previous?.feats ?? []), ...(result.feats ?? [])]);
    if (result.flawless && !hinted) {
      feats.add('flawless');
    }
    if (previous && result.scorePct - previous.bestScore >= 30) {
      feats.add('comeback');
    }
    const next: LevelResult = {
      bestScore: improved ? result.scorePct : previous.bestScore,
      stars: Math.max(stars, previous?.stars ?? 0),
      xp: Math.max(xpForResult(level.xp, result.scorePct), previous?.xp ?? 0),
      bonusXp: Math.max(bonus.total, previous?.bonusXp ?? 0),
      attempts,
      lastPlayed: new Date().toISOString(),
      feats: [...feats],
    };

    const questsBefore = unlockedQuestIds(LEVELS, before.results, before.freePlay);
    const wingsBefore = unlockedWings(LEVELS, before.results, before.freePlay);

    const newBadges = this.commit((state) => ({
      ...state,
      results: { ...state.results, [level.id]: next },
      streak: advanceStreak(state.streak, dayKey(new Date())),
    }));

    const after = this.state();
    const questsAfter = unlockedQuestIds(LEVELS, after.results, after.freePlay);
    const wingsAfter = unlockedWings(LEVELS, after.results, after.freePlay);
    const previousTotal = (previous?.xp ?? 0) + (previous?.bonusXp ?? 0);

    return {
      stars,
      xpGained: Math.max(0, next.xp + next.bonusXp - previousTotal),
      improved,
      previousBest: previous?.bestScore ?? null,
      bonus,
      hinted,
      newBadges,
      unlockedQuests: LEVELS.filter(
        (candidate) =>
          candidate.id !== level.id &&
          questsAfter.includes(candidate.id) &&
          !questsBefore.includes(candidate.id),
      ),
      unlockedWings: WORLDS.filter(
        (world) => wingsAfter.includes(world.id) && !wingsBefore.includes(world.id),
      ),
    };
  }

  setFreePlay(enabled: boolean): void {
    this.commit((state) => ({ ...state, freePlay: enabled }));
  }

  setPlayerName(name: string): void {
    this.commit((state) => ({ ...state, playerName: name.trim().slice(0, 40) }));
  }

  markGlossaryOpened(): void {
    if (!this.state().glossaryOpened) {
      this.commit((state) => ({ ...state, glossaryOpened: true }));
    }
  }

  dismissToast(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  reset(): void {
    const empty = emptyState();
    save(empty);
    this.state.set(empty);
    this.toasts.set([]);
  }

  /** Apply a state change, award any newly earned badge (with a toast) and persist. */
  private commit(mutate: (state: ProgressState) => ProgressState): Badge[] {
    const mutated = mutate(this.state());
    const earned = unlockedBadgeIds(snapshotOf(mutated), LEVELS);
    const fresh = earned.filter((id) => !mutated.badgesEarned.includes(id));
    const updated: ProgressState = {
      ...mutated,
      badgesEarned: [...mutated.badgesEarned, ...fresh],
    };
    save(updated);
    this.state.set(updated);
    const badges = fresh.map(badgeById).filter((badge): badge is Badge => !!badge);
    for (const badge of badges) {
      this.toast(badge.icon, `Badge unlocked: ${badge.title}`, badge.description);
    }
    return badges;
  }

  private toast(icon: string, title: string, text: string): void {
    const id = ++this.toastSeq;
    this.toasts.update((toasts) => [...toasts, { id, icon, title, text }]);
    setTimeout(() => this.dismissToast(id), TOAST_MS);
  }
}

function snapshotOf(state: ProgressState): PlayerSnapshot {
  return {
    results: Object.fromEntries(
      Object.entries(state.results).map(([id, result]) => [
        id,
        { stars: result.stars, feats: result.feats },
      ]),
    ),
    streakDays: state.streak.days,
    glossaryOpened: state.glossaryOpened,
  };
}

function load(): ProgressState {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      if (parsed.version === 2 && parsed.results && typeof parsed.results === 'object') {
        return { ...emptyState(), ...parsed, version: 2 };
      }
    }
    const legacy = globalThis.localStorage?.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<LegacyState>;
      if (parsed.version === 1 && parsed.results) {
        const migrated: ProgressState = {
          ...emptyState(),
          results: Object.fromEntries(
            Object.entries(parsed.results).map(([id, result]) => [
              id,
              { ...result, bonusXp: 0, feats: [] },
            ]),
          ),
        };
        migrated.badgesEarned = unlockedBadgeIds(snapshotOf(migrated), LEVELS);
        save(migrated);
        return migrated;
      }
    }
  } catch {
    // Private mode, blocked storage or corrupted JSON: start fresh.
  }
  return emptyState();
}

function save(state: ProgressState): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: progress simply lives for the session.
  }
}
