import { evaluateChunking } from '../core/domain/chunk-lab';
import { bestSubsetUnderBudget } from '../core/domain/knapsack';
import { buildIndex, search } from '../core/domain/retrieval';
import { GLOSSARY } from './glossary';
import { LEVELS, TOTAL_XP, WORLDS, findLevel, levelsForWorld, nextLevel } from './worlds';

describe('level registry', () => {
  it('has unique ids and every level belongs to a known world', () => {
    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
    const worldIds = new Set(WORLDS.map((world) => world.id));
    for (const level of LEVELS) {
      expect(worldIds.has(level.world)).toBe(true);
    }
  });

  it('gives every world at least three levels', () => {
    for (const world of WORLDS) {
      expect(levelsForWorld(world.id).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('offers enough xp to reach the top rank', () => {
    expect(TOTAL_XP).toBeGreaterThanOrEqual(1500);
  });

  it('walks the levels in order', () => {
    expect(nextLevel(LEVELS[0].id)?.id).toBe(LEVELS[1].id);
    expect(nextLevel(LEVELS[LEVELS.length - 1].id)).toBeUndefined();
    expect(findLevel('nope')).toBeUndefined();
  });

  it('has a takeaway and an intro everywhere', () => {
    for (const level of LEVELS) {
      expect(level.takeaway.length).toBeGreaterThan(40);
      expect(level.challenge.intro.length).toBeGreaterThan(20);
    }
  });
});

describe('challenge content is internally consistent', () => {
  it('mcq answers point at an existing option', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'mcq') continue;
      for (const question of level.challenge.questions) {
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        expect(new Set(question.options).size).toBe(question.options.length);
      }
    }
  });

  it('token-select answers reference existing tokens and labels', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'token-select') continue;
      const labelIds = new Set(level.challenge.labels.map((label) => label.id));
      for (const round of level.challenge.rounds) {
        for (const [index, label] of Object.entries(round.answers)) {
          expect(Number(index)).toBeLessThan(round.tokens.length);
          expect(labelIds.has(label)).toBe(true);
        }
      }
    }
  });

  it('bucket cards reference existing buckets and have unique ids', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'bucket-sort') continue;
      const bucketIds = new Set(level.challenge.buckets.map((bucket) => bucket.id));
      const cardIds = level.challenge.cards.map((card) => card.id);
      expect(new Set(cardIds).size).toBe(cardIds.length);
      for (const card of level.challenge.cards) {
        expect(bucketIds.has(card.bucket)).toBe(true);
      }
    }
  });

  it('pipeline steps are unique', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'order-steps') continue;
      const ids = level.challenge.steps.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('pick-k rounds have unique items, a k or a budget, and a reachable optimum', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'pick-k') continue;
      for (const round of level.challenge.rounds) {
        const ids = round.items.map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
        if (level.challenge.mode === 'top-k') {
          expect(round.k).toBeGreaterThan(0);
          expect(round.k).toBeLessThan(round.items.length);
        } else {
          expect(round.budget).toBeGreaterThan(0);
          const items = round.items.map((item) => ({
            id: item.id,
            cost: item.cost ?? 0,
            value: item.relevance,
          }));
          expect(bestSubsetUnderBudget(items, round.budget ?? 0).value).toBeGreaterThan(0);
        }
      }
    }
  });

  it('claim-check rounds mix supported and unsupported claims', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'claim-check') continue;
      for (const round of level.challenge.rounds) {
        expect(round.claims.some((claim) => claim.supported)).toBe(true);
        expect(round.claims.some((claim) => !claim.supported)).toBe(true);
      }
    }
  });

  it('dirty-data issues point inside the table', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'dirty-data') continue;
      const { rows, columns, issues } = level.challenge;
      for (const row of rows) {
        expect(row).toHaveLength(columns.length);
      }
      for (const issue of issues) {
        expect(issue.row).toBeLessThan(rows.length);
        if (issue.col !== null) {
          expect(issue.col).toBeLessThan(columns.length);
        }
      }
    }
  });

  it('embedding maps keep every word inside the unit square and in a known group', () => {
    for (const level of LEVELS) {
      if (level.challenge.kind !== 'embedding') continue;
      const groups = new Set(Object.keys(level.challenge.groups));
      for (const word of [...level.challenge.words, ...level.challenge.mystery]) {
        expect(Math.abs(word.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(word.y)).toBeLessThanOrEqual(1);
        expect(groups.has(word.group)).toBe(true);
      }
    }
  });

  it('glossary terms are unique', () => {
    const terms = GLOSSARY.map((entry) => entry.term);
    expect(new Set(terms).size).toBe(terms.length);
  });
});

describe('the chunk lab is winnable and teaches the trade-off', () => {
  const level = findLevel('chunk-master');
  const challenge = level?.challenge.kind === 'chunk-lab' ? level.challenge : undefined;

  it('answers every question with a medium configuration', () => {
    expect(challenge).toBeDefined();
    const report = evaluateChunking(challenge!.document, challenge!.questions, 60, 10);
    expect(report.hits).toBe(challenge!.questions.length);
    expect(report.score).toBeGreaterThanOrEqual(90);
  });

  it('loses at least one answer with tiny chunks', () => {
    const report = evaluateChunking(challenge!.document, challenge!.questions, 20, 0);
    expect(report.hits).toBeLessThan(challenge!.questions.length);
  });

  it('answers everything with one giant chunk but with poor efficiency', () => {
    const report = evaluateChunking(challenge!.document, challenge!.questions, 500, 0);
    expect(report.hits).toBe(challenge!.questions.length);
    expect(report.efficiency).toBe(0);
    expect(report.score).toBeLessThan(90);
  });
});

describe('the tf-idf showdown ranking question is true for our retriever', () => {
  it('ranks document B first for "python snake"', () => {
    const level = findLevel('tfidf-showdown');
    const challenge = level?.challenge.kind === 'mcq' ? level.challenge : undefined;
    const question = challenge?.questions.find((q) => q.prompt.includes('python snake'));
    expect(question?.tfidfDocs).toBeDefined();
    const index = buildIndex(
      question!.tfidfDocs!.map((doc) => ({ id: doc.label, text: doc.text })),
    );
    expect(search(index, 'python snake', 1)[0].id).toBe('B');
  });
});
