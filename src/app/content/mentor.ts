import { WorldId } from '../core/models';

/** Ada, the senior Archivist: the voice that frames every quest and comments every result. */
export const MENTOR = {
  name: 'Ada',
  role: 'Senior Archivist',
  welcome:
    'The Oracle has started to invent answers. Not because it is stupid — because the Archive it reads ' +
    'from is a mess. Help me put it back in order, wing by wing, and it will speak true again.',
  byStars: {
    0: [
      'Rough. The Archive has seen worse. Read the explanations, then try again.',
      'The Oracle would have hallucinated exactly that. Shall we go again?',
    ],
    1: [
      'A start. The explanations are the real loot here — collect them.',
      'You found the thread. Pull on it once more.',
    ],
    2: [
      'Solid work. One more pass and this shelf is spotless.',
      'Good. The Oracle already sounds a little less confused.',
    ],
    3: [
      'Flawless shelf. The Oracle just quoted you correctly.',
      'Perfect. I am putting your name on this wing.',
    ],
  } as Record<number, string[]>,
  wingOpened: {
    nlp: 'The Language Hall is open. Here the Archive learns to read.',
    rag: 'The Retrieval Engine is open. This is where the Oracle finds what to say.',
  } as Partial<Record<WorldId, string>>,
  bossBeaten: 'That was the keeper of the wing. The door at the end of the hall just unlocked.',
  restored:
    'The Archive is in order and the Oracle speaks true. You are no longer an apprentice — go build one of these for real.',
  hintCaption: 'Ask Ada for a hint (forfeits the Flawless bonus)',
};

/** A deterministic mentor line for a result, so a given result always shows the same comment. */
export function mentorLine(stars: number, seed: number): string {
  const lines = MENTOR.byStars[Math.max(0, Math.min(3, stars))] ?? MENTOR.byStars[0];
  return lines[Math.abs(seed) % lines.length];
}
