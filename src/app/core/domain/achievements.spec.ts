import { BADGES, PlayerSnapshot, unlockedBadgeIds } from './achievements';
import { QuestRef } from './progression';

const quests: QuestRef[] = [
  { id: 'd1', world: 'data' },
  { id: 'd2', world: 'data' },
  { id: 'n1', world: 'nlp' },
  { id: 'r1', world: 'rag' },
];

function snapshot(partial: Partial<PlayerSnapshot> = {}): PlayerSnapshot {
  return { results: {}, streakDays: 0, glossaryOpened: false, ...partial };
}

const done = (stars: number, feats: string[] = []) => ({ stars, feats });

describe('badge catalogue', () => {
  it('has unique ids, a title, a description and an icon', () => {
    const ids = BADGES.map((badge) => badge.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const badge of BADGES) {
      expect(badge.title.length).toBeGreaterThan(2);
      expect(badge.description.length).toBeGreaterThan(10);
      expect(badge.icon.length).toBeGreaterThan(0);
    }
  });
});

describe('unlockedBadgeIds', () => {
  it('unlocks nothing for a fresh player', () => {
    expect(unlockedBadgeIds(snapshot(), quests)).toEqual([]);
  });

  it('first-steps after the first quest with a star', () => {
    expect(unlockedBadgeIds(snapshot({ results: { d1: done(1) } }), quests)).toContain(
      'first-steps',
    );
  });

  it('feat badges follow the feats recorded on any quest', () => {
    const ids = unlockedBadgeIds(
      snapshot({
        results: {
          d1: done(3, ['all-issues-found', 'flawless']),
          n1: done(2, ['exact-token-count', 'comeback']),
          r1: done(1, ['all-claims-right', 'chunk-95', 'bullseye']),
        },
      }),
      quests,
    );
    expect(ids).toEqual(
      expect.arrayContaining([
        'data-janitor',
        'flawless',
        'token-whisperer',
        'comeback',
        'hallucination-hunter',
        'perfect-chunker',
        'bullseye',
      ]),
    );
  });

  it('wing keeper needs three stars on every quest of the wing', () => {
    expect(
      unlockedBadgeIds(snapshot({ results: { d1: done(3), d2: done(2) } }), quests),
    ).not.toContain('wing-keeper-data');
    expect(unlockedBadgeIds(snapshot({ results: { d1: done(3), d2: done(3) } }), quests)).toContain(
      'wing-keeper-data',
    );
  });

  it('oracle-restored needs a star everywhere, grandmaster three stars everywhere', () => {
    const everything = { d1: done(1), d2: done(1), n1: done(1), r1: done(1) };
    const ids = unlockedBadgeIds(snapshot({ results: everything }), quests);
    expect(ids).toContain('oracle-restored');
    expect(ids).not.toContain('grandmaster');
    const perfect = { d1: done(3), d2: done(3), n1: done(3), r1: done(3) };
    expect(unlockedBadgeIds(snapshot({ results: perfect }), quests)).toContain('grandmaster');
  });

  it('streak and bookworm badges come from the player state', () => {
    expect(unlockedBadgeIds(snapshot({ streakDays: 3 }), quests)).toContain('streak-3');
    expect(unlockedBadgeIds(snapshot({ streakDays: 2 }), quests)).not.toContain('streak-3');
    expect(unlockedBadgeIds(snapshot({ glossaryOpened: true }), quests)).toContain('bookworm');
  });

  it('returns ids in catalogue order', () => {
    const ids = unlockedBadgeIds(
      snapshot({ results: { d1: done(3, ['flawless']) }, glossaryOpened: true }),
      quests,
    );
    const order = BADGES.map((badge) => badge.id);
    expect(ids).toEqual([...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  });
});
