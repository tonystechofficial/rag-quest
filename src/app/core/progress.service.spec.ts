import { TestBed } from '@angular/core/testing';
import { LEVELS, levelsForWorld } from '../content/worlds';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('records a result with xp, bonuses, feats, badges and unlocks', () => {
    const service = TestBed.inject(ProgressService);
    const level = LEVELS[0];
    const outcome = service.record(
      level,
      { scorePct: 95, summary: 'x', flawless: true, feats: ['all-issues-found'] },
      false,
    );
    expect(outcome.stars).toBe(3);
    expect(outcome.bonus).toEqual({ firstTry: 10, flawless: 20, total: 30 });
    expect(outcome.xpGained).toBe(130);
    expect(outcome.newBadges.map((badge) => badge.id)).toEqual(
      expect.arrayContaining(['first-steps', 'data-janitor', 'flawless']),
    );
    expect(outcome.unlockedQuests.map((quest) => quest.id)).toEqual([LEVELS[1].id]);
    expect(outcome.unlockedWings).toEqual([]);
    expect(service.totalXp()).toBe(130);
    expect(service.streak()).toBe(1);
    expect(service.toasts().length).toBeGreaterThan(0);
    expect(service.resultFor(level.id)?.feats).toEqual(
      expect.arrayContaining(['all-issues-found', 'flawless']),
    );
  });

  it('keeps the best score, counts attempts and awards the comeback feat', () => {
    const service = TestBed.inject(ProgressService);
    const level = LEVELS[0];
    service.record(level, { scorePct: 40, summary: 'x' }, false);
    const second = service.record(level, { scorePct: 85, summary: 'x' }, false);
    expect(second.improved).toBe(true);
    expect(second.previousBest).toBe(40);
    expect(service.resultFor(level.id)).toMatchObject({ bestScore: 85, stars: 2, attempts: 2 });
    expect(service.resultFor(level.id)?.feats).toContain('comeback');
    const third = service.record(level, { scorePct: 50, summary: 'x' }, false);
    expect(third.improved).toBe(false);
    expect(service.resultFor(level.id)?.bestScore).toBe(85);
  });

  it('a hint cancels the flawless bonus', () => {
    const service = TestBed.inject(ProgressService);
    const outcome = service.record(LEVELS[0], { scorePct: 95, summary: 'x', flawless: true }, true);
    expect(outcome.bonus.flawless).toBe(0);
    expect(outcome.hinted).toBe(true);
    expect(service.resultFor(LEVELS[0].id)?.feats).not.toContain('flawless');
  });

  it('opens the next wing when the boss of the current wing falls', () => {
    const service = TestBed.inject(ProgressService);
    const wing = levelsForWorld('data');
    expect(service.isWingOpen('nlp')).toBe(false);
    for (const level of wing.slice(0, -1)) {
      service.record(level, { scorePct: 60, summary: 'x' }, false);
    }
    expect(service.isWingOpen('nlp')).toBe(false);
    const outcome = service.record(wing.at(-1)!, { scorePct: 60, summary: 'x' }, false);
    expect(outcome.unlockedWings.map((world) => world.id)).toEqual(['nlp']);
    expect(service.isWingOpen('nlp')).toBe(true);
    expect(service.nextQuest()?.id).toBe(levelsForWorld('nlp')[0].id);
  });

  it('free play unlocks everything and persists across reloads', () => {
    const service = TestBed.inject(ProgressService);
    expect(service.isUnlocked('rag-boss')).toBe(false);
    service.setFreePlay(true);
    expect(service.isUnlocked('rag-boss')).toBe(true);
    const stored = JSON.parse(localStorage.getItem('rag-quest.progress.v2') ?? '{}');
    expect(stored.freePlay).toBe(true);
  });

  it('migrates a version-1 save', () => {
    localStorage.setItem(
      'rag-quest.progress.v1',
      JSON.stringify({
        version: 1,
        results: {
          'dirty-data': { bestScore: 70, stars: 2, xp: 67, attempts: 1, lastPlayed: '2026-10-20' },
        },
      }),
    );
    const service = TestBed.inject(ProgressService);
    expect(service.resultFor('dirty-data')).toMatchObject({
      stars: 2,
      xp: 67,
      bonusXp: 0,
      feats: [],
    });
    expect(service.totalXp()).toBe(67);
    expect(service.hasBadge('first-steps')).toBe(true);
    expect(service.isUnlocked(LEVELS[1].id)).toBe(true);
  });

  it('reset wipes everything', () => {
    const service = TestBed.inject(ProgressService);
    service.record(LEVELS[0], { scorePct: 95, summary: 'x' }, false);
    service.setFreePlay(true);
    service.reset();
    expect(service.totalXp()).toBe(0);
    expect(service.freePlay()).toBe(false);
    expect(service.badges()).toEqual([]);
  });
});
