import {
  bossOf,
  isBossQuest,
  isQuestUnlocked,
  isWingUnlocked,
  nextQuest,
  QuestRef,
  unlockedQuestIds,
  unlockedWings,
  wingStars,
} from './progression';

const quests: QuestRef[] = [
  { id: 'd1', world: 'data' },
  { id: 'd2', world: 'data' },
  { id: 'd3', world: 'data' },
  { id: 'n1', world: 'nlp' },
  { id: 'n2', world: 'nlp' },
  { id: 'r1', world: 'rag' },
];

const stars = (map: Record<string, number>) =>
  Object.fromEntries(Object.entries(map).map(([id, value]) => [id, { stars: value }]));

describe('wingStars and bosses', () => {
  it('sums the stars of the quests of a wing', () => {
    expect(wingStars('data', quests, stars({ d1: 3, d2: 1, n1: 2 }))).toBe(4);
  });

  it('the last quest of a wing is its boss', () => {
    expect(bossOf('data', quests)?.id).toBe('d3');
    expect(isBossQuest('d3', quests)).toBe(true);
    expect(isBossQuest('d1', quests)).toBe(false);
    expect(isBossQuest('r1', quests)).toBe(true);
  });
});

describe('isWingUnlocked', () => {
  it('the first wing is always open', () => {
    expect(isWingUnlocked('data', quests, {}, false)).toBe(true);
  });

  it('a wing opens once the boss of the previous wing has a star', () => {
    expect(isWingUnlocked('nlp', quests, stars({ d1: 3, d2: 3 }), false)).toBe(false);
    expect(isWingUnlocked('nlp', quests, stars({ d3: 1 }), false)).toBe(true);
    expect(isWingUnlocked('rag', quests, stars({ d3: 1 }), false)).toBe(false);
    expect(isWingUnlocked('rag', quests, stars({ d3: 1, n2: 2 }), false)).toBe(true);
  });

  it('free play opens every wing', () => {
    expect(isWingUnlocked('rag', quests, {}, true)).toBe(true);
  });
});

describe('isQuestUnlocked', () => {
  it('the first quest of an open wing is unlocked', () => {
    expect(isQuestUnlocked('d1', quests, {}, false)).toBe(true);
  });

  it('a quest unlocks when the previous quest of its wing has at least one star', () => {
    expect(isQuestUnlocked('d2', quests, {}, false)).toBe(false);
    expect(isQuestUnlocked('d2', quests, stars({ d1: 1 }), false)).toBe(true);
    expect(isQuestUnlocked('d3', quests, stars({ d1: 3 }), false)).toBe(false);
  });

  it('the first quest of a locked wing stays locked', () => {
    expect(isQuestUnlocked('n1', quests, stars({ d1: 3, d2: 3 }), false)).toBe(false);
    expect(isQuestUnlocked('n1', quests, stars({ d3: 1 }), false)).toBe(true);
  });

  it('an unknown quest is never unlocked', () => {
    expect(isQuestUnlocked('nope', quests, {}, true)).toBe(false);
  });

  it('free play unlocks every quest', () => {
    expect(isQuestUnlocked('r1', quests, {}, true)).toBe(true);
  });
});

describe('unlockedQuestIds and unlockedWings', () => {
  it('lists what is currently reachable', () => {
    expect(unlockedQuestIds(quests, stars({ d1: 2, d2: 1 }), false)).toEqual(['d1', 'd2', 'd3']);
    expect(unlockedWings(quests, stars({ d3: 1 }), false)).toEqual(['data', 'nlp']);
  });
});

describe('nextQuest', () => {
  it('is the first quest when nothing has been played', () => {
    expect(nextQuest(quests, {}, false)?.id).toBe('d1');
  });

  it('is the first unlocked quest without a star', () => {
    expect(nextQuest(quests, stars({ d1: 3 }), false)?.id).toBe('d2');
  });

  it('moves to the next wing once its door is open', () => {
    expect(nextQuest(quests, stars({ d1: 3, d2: 3, d3: 3 }), false)?.id).toBe('n1');
  });

  it('suggests improving the weakest quest when everything reachable has a star', () => {
    expect(nextQuest(quests, stars({ d1: 2, d2: 1, d3: 3, n1: 1, n2: 2, r1: 3 }), false)?.id).toBe(
      'd2',
    );
  });

  it('is undefined when every quest has three stars', () => {
    expect(
      nextQuest(quests, stars({ d1: 3, d2: 3, d3: 3, n1: 3, n2: 3, r1: 3 }), false),
    ).toBeUndefined();
  });
});
