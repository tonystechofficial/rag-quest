import { bossOf, wingOrder } from '../core/domain/progression';
import { MENTOR, mentorLine } from './mentor';
import { LEVELS, QUEST_ORDER, WORLDS, levelsForWorld } from './worlds';

describe('game layer content', () => {
  it('every quest has a story and a hint', () => {
    for (const level of LEVELS) {
      expect(level.story.length).toBeGreaterThan(30);
      expect(level.hint.length).toBeGreaterThan(40);
    }
  });

  it('every wing has a narrative name, a story and a mentor intro', () => {
    for (const world of WORLDS) {
      expect(world.wing.startsWith('The ')).toBe(true);
      expect(world.story.length).toBeGreaterThan(80);
      expect(world.mentorIntro.length).toBeGreaterThan(20);
    }
  });

  it('the quest order covers every level exactly once and groups wings contiguously', () => {
    expect([...QUEST_ORDER].sort()).toEqual(LEVELS.map((level) => level.id).sort());
    expect(LEVELS.map((level) => level.id)).toEqual(QUEST_ORDER);
    expect(wingOrder(LEVELS)).toEqual(['data', 'nlp', 'rag']);
  });

  it('each wing ends with its intended boss', () => {
    expect(bossOf('data', LEVELS)?.id).toBe('split-smart');
    expect(bossOf('nlp', LEVELS)?.id).toBe('embedding-explorer');
    expect(bossOf('rag', LEVELS)?.id).toBe('rag-boss');
    for (const world of WORLDS) {
      expect(levelsForWorld(world.id).at(-1)?.id).toBe(bossOf(world.id, LEVELS)?.id);
    }
  });

  it('the mentor has at least one line for every star count and a wing-opened line for every wing but the first', () => {
    for (let stars = 0; stars <= 3; stars++) {
      expect(mentorLine(stars, 0).length).toBeGreaterThan(10);
      expect(mentorLine(stars, 1).length).toBeGreaterThan(10);
    }
    expect(MENTOR.wingOpened.nlp).toBeTruthy();
    expect(MENTOR.wingOpened.rag).toBeTruthy();
    expect(mentorLine(99, 5)).toBe(mentorLine(3, 5));
  });
});
