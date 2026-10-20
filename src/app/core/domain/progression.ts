import { WorldId } from '../models';

export interface QuestRef {
  id: string;
  world: WorldId;
}

export interface StarRecord {
  stars: number;
}

export type StarResults = Record<string, StarRecord | undefined>;

/**
 * Progression rules of the Archive:
 *  - wings open in order; a wing opens once the BOSS (last quest) of the previous wing has a star,
 *  - inside a wing, a quest unlocks once the previous quest has at least one star,
 *  - "free play" ignores every lock.
 */
export function wingOrder(quests: QuestRef[]): WorldId[] {
  const order: WorldId[] = [];
  for (const quest of quests) {
    if (!order.includes(quest.world)) {
      order.push(quest.world);
    }
  }
  return order;
}

function starsOf(results: StarResults, id: string): number {
  return results[id]?.stars ?? 0;
}

export function wingStars(world: WorldId, quests: QuestRef[], results: StarResults): number {
  return quests
    .filter((quest) => quest.world === world)
    .reduce((sum, quest) => sum + starsOf(results, quest.id), 0);
}

export function bossOf<T extends QuestRef>(world: WorldId, quests: T[]): T | undefined {
  const wing = quests.filter((quest) => quest.world === world);
  return wing[wing.length - 1];
}

export function isBossQuest(id: string, quests: QuestRef[]): boolean {
  const quest = quests.find((candidate) => candidate.id === id);
  return !!quest && bossOf(quest.world, quests)?.id === id;
}

export function isWingUnlocked(
  world: WorldId,
  quests: QuestRef[],
  results: StarResults,
  freePlay: boolean,
): boolean {
  if (freePlay) {
    return true;
  }
  const order = wingOrder(quests);
  const index = order.indexOf(world);
  if (index <= 0) {
    return index === 0;
  }
  const previousBoss = bossOf(order[index - 1], quests);
  return !!previousBoss && starsOf(results, previousBoss.id) >= 1;
}

export function isQuestUnlocked(
  id: string,
  quests: QuestRef[],
  results: StarResults,
  freePlay: boolean,
): boolean {
  const quest = quests.find((candidate) => candidate.id === id);
  if (!quest) {
    return false;
  }
  if (freePlay) {
    return true;
  }
  if (!isWingUnlocked(quest.world, quests, results, false)) {
    return false;
  }
  const wing = quests.filter((candidate) => candidate.world === quest.world);
  const position = wing.findIndex((candidate) => candidate.id === id);
  return position === 0 || starsOf(results, wing[position - 1].id) >= 1;
}

export function unlockedQuestIds(
  quests: QuestRef[],
  results: StarResults,
  freePlay: boolean,
): string[] {
  return quests
    .filter((quest) => isQuestUnlocked(quest.id, quests, results, freePlay))
    .map((quest) => quest.id);
}

export function unlockedWings(
  quests: QuestRef[],
  results: StarResults,
  freePlay: boolean,
): WorldId[] {
  return wingOrder(quests).filter((world) => isWingUnlocked(world, quests, results, freePlay));
}

/**
 * What to play next: the first reachable quest without a star; otherwise the reachable quest
 * with the fewest stars (to improve); undefined once everything reachable has three stars.
 */
export function nextQuest<T extends QuestRef>(
  quests: T[],
  results: StarResults,
  freePlay: boolean,
): T | undefined {
  const reachable = quests.filter((quest) => isQuestUnlocked(quest.id, quests, results, freePlay));
  const fresh = reachable.find((quest) => starsOf(results, quest.id) === 0);
  if (fresh) {
    return fresh;
  }
  const improvable = reachable.filter((quest) => starsOf(results, quest.id) < 3);
  if (improvable.length === 0) {
    return undefined;
  }
  return improvable.reduce((best, quest) =>
    starsOf(results, quest.id) < starsOf(results, best.id) ? quest : best,
  );
}
