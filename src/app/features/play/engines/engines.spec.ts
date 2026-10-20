import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { findLevel } from '../../../content/worlds';
import { countTokens } from '../../../core/domain/tokenizer';
import {
  BucketSortChallenge,
  Challenge,
  ChallengeResult,
  ChunkLabChallenge,
  ClaimCheckChallenge,
  DirtyDataChallenge,
  EmbeddingChallenge,
  EstimateChallenge,
  McqChallenge,
  OrderStepsChallenge,
  PickKChallenge,
  TokenSelectChallenge,
} from '../../../core/models';
import { BucketSortEngine } from './bucket-sort-engine';
import { ChunkLabEngine } from './chunk-lab-engine';
import { ClaimCheckEngine } from './claim-check-engine';
import { DirtyDataEngine } from './dirty-data-engine';
import { EmbeddingEngine } from './embedding-engine';
import { EstimateEngine } from './estimate-engine';
import { McqEngine } from './mcq-engine';
import { OrderStepsEngine } from './order-steps-engine';
import { PickKEngine } from './pick-k-engine';
import { TokenSelectEngine } from './token-select-engine';

function challengeOf<T extends Challenge>(levelId: string, kind: T['kind']): T {
  const level = findLevel(levelId);
  if (!level || level.challenge.kind !== kind) {
    throw new Error(`level ${levelId} with a ${kind} challenge not found`);
  }
  return level.challenge as T;
}

interface Mounted<T> {
  fixture: ComponentFixture<T>;
  el: HTMLElement;
  results: ChallengeResult[];
  stable: () => Promise<void>;
}

async function mount<
  T extends { completed: { subscribe: (cb: (r: ChallengeResult) => void) => unknown } },
>(component: Type<T>, challenge: Challenge): Promise<Mounted<T>> {
  const fixture = TestBed.createComponent(component);
  fixture.componentRef.setInput('challenge', challenge);
  const results: ChallengeResult[] = [];
  fixture.componentInstance.completed.subscribe((result) => results.push(result));
  await fixture.whenStable();
  return {
    fixture,
    el: fixture.nativeElement as HTMLElement,
    results,
    stable: () => fixture.whenStable(),
  };
}

function buttons(el: HTMLElement, selector = 'button'): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll<HTMLButtonElement>(selector));
}

function buttonByText(el: HTMLElement, text: string): HTMLButtonElement {
  const button = buttons(el).find((candidate) => candidate.textContent?.includes(text));
  if (!button) {
    throw new Error(`no button containing "${text}"`);
  }
  return button;
}

describe('McqEngine', () => {
  it('walks through every question and scores 100% for all-correct answers', async () => {
    const challenge = challengeOf<McqChallenge>('split-smart', 'mcq');
    const { el, results, stable } = await mount(McqEngine, challenge);
    expect(el.textContent).toContain(challenge.questions[0].prompt);
    expect(buttons(el, '.option')).toHaveLength(challenge.questions[0].options.length);

    for (const question of challenge.questions) {
      buttons(el, '.option')[question.answer].click();
      await stable();
      buttonByText(el, 'Check answer').click();
      await stable();
      expect(el.querySelector('.feedback.good')?.textContent).toContain('Correct!');
      expect(el.textContent).toContain(question.explanation.slice(0, 30));
      const next = buttons(el).find((b) => /Next question|See results/.test(b.textContent ?? ''))!;
      next.click();
      await stable();
    }
    expect(results).toHaveLength(1);
    expect(results[0].scorePct).toBe(100);
  });

  it('shows the live TF-IDF table after answering a question with documents', async () => {
    const challenge = challengeOf<McqChallenge>('tfidf-showdown', 'mcq');
    const { el, stable } = await mount(McqEngine, challenge);
    expect(el.querySelector('app-tfidf-table')).toBeNull();
    buttons(el, '.option')[0].click();
    await stable();
    buttonByText(el, 'Check answer').click();
    await stable();
    expect(el.querySelector('app-tfidf-table table')).not.toBeNull();
    expect(el.querySelector('.feedback.bad')).not.toBeNull();
  });
});

describe('TokenSelectEngine', () => {
  it('scores F1 100% when exactly the expected tokens are selected', async () => {
    const challenge = challengeOf<TokenSelectChallenge>('stopword-sweeper', 'token-select');
    const { el, stable } = await mount(TokenSelectEngine, challenge);
    const tokens = () => buttons(el).filter((b) => b.classList.contains('chip'));
    for (const index of Object.keys(challenge.rounds[0].answers).map(Number)) {
      tokens()[index].click();
      await stable();
    }
    buttonByText(el, 'Check').click();
    await stable();
    expect(el.querySelector('.feedback')?.textContent).toContain('F1 score 100%');
    buttonByText(el, 'Next round').click();
    await stable();
    expect(el.textContent).toContain('Round 2 /');
  });

  it('supports several labels and reports a partial score', async () => {
    const challenge = challengeOf<TokenSelectChallenge>('entity-hunter', 'token-select');
    const { fixture, el, stable } = await mount(TokenSelectEngine, challenge);
    buttonByText(el, 'Person').click();
    await stable();
    const tokenChips = () =>
      buttons(el).filter(
        (b) =>
          b.classList.contains('chip') &&
          !/Person|Organization|Location|Date/.test(b.textContent ?? ''),
      );
    tokenChips()[0].click();
    tokenChips()[1].click();
    await stable();
    buttonByText(el, 'Check').click();
    await stable();
    const score = fixture.componentInstance.roundScore();
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });
});

describe('OrderStepsEngine', () => {
  it('starts shuffled, scores the order and emits a result', async () => {
    const challenge = challengeOf<OrderStepsChallenge>('pipeline-builder', 'order-steps');
    const { fixture, el, results, stable } = await mount(OrderStepsEngine, challenge);
    expect(el.querySelectorAll('.step')).toHaveLength(challenge.steps.length);
    expect(fixture.componentInstance.exactCount()).toBeLessThan(challenge.steps.length);

    fixture.componentInstance.order.set(challenge.steps.map((step) => step.id));
    await stable();
    buttonByText(el, 'Check order').click();
    await stable();
    expect(el.querySelector('.feedback')?.textContent).toContain('100% of step pairs');
    buttonByText(el, 'See results').click();
    expect(results[0]?.scorePct).toBe(100);
  });

  it('moves a step with the arrows', async () => {
    const challenge = challengeOf<OrderStepsChallenge>('pipeline-builder', 'order-steps');
    const { fixture, el, stable } = await mount(OrderStepsEngine, challenge);
    const before = [...fixture.componentInstance.order()];
    buttons(el, '[aria-label="Move down"]')[0].click();
    await stable();
    const after = fixture.componentInstance.order();
    expect(after[1]).toBe(before[0]);
    expect(after[0]).toBe(before[1]);
  });
});

describe('BucketSortEngine', () => {
  it('sorts every card into its bucket and scores 100%', async () => {
    const challenge = challengeOf<BucketSortChallenge>('data-shapes', 'bucket-sort');
    const { el, results, stable } = await mount(BucketSortEngine, challenge);
    for (let i = 0; i < challenge.cards.length; i++) {
      const chip = el.querySelector<HTMLButtonElement>('.card-soft .chip')!;
      const card = challenge.cards.find(
        (candidate) => candidate.text === chip.textContent?.trim(),
      )!;
      chip.click();
      await stable();
      const bucketIndex = challenge.buckets.findIndex((bucket) => bucket.id === card.bucket);
      el.querySelectorAll<HTMLElement>('.bucket')[bucketIndex].click();
      await stable();
    }
    buttonByText(el, 'Check').click();
    await stable();
    expect(el.querySelector('.feedback')?.textContent).toContain(
      `${challenge.cards.length} / ${challenge.cards.length}`,
    );
    buttonByText(el, 'See results').click();
    expect(results[0]?.scorePct).toBe(100);
  });
});

describe('EstimateEngine', () => {
  it('awards 100 points for an exact token count', async () => {
    const challenge = challengeOf<EstimateChallenge>('token-counter', 'estimate');
    const { fixture, el, stable } = await mount(EstimateEngine, challenge);
    const actual = countTokens(challenge.rounds[0].text);
    fixture.componentInstance.guess.set(actual);
    await stable();
    buttonByText(el, 'Lock in').click();
    await stable();
    expect(el.querySelector('.feedback.good')?.textContent).toContain(
      `counts ${actual} — 100 points`,
    );
    expect(el.querySelectorAll('.token').length).toBeGreaterThan(0);
  });
});

describe('PickKEngine', () => {
  it('scores 100% for the best top-k picks', async () => {
    const challenge = challengeOf<PickKChallenge>('retrieval-ranker', 'pick-k');
    const { el, stable } = await mount(PickKEngine, challenge);
    const round = challenge.rounds[0];
    const best = [...round.items].sort((a, b) => b.relevance - a.relevance).slice(0, round.k ?? 3);
    for (const item of best) {
      buttons(el, '.option')[round.items.indexOf(item)].click();
      await stable();
    }
    expect(
      buttons(el, '.option').filter((b) => !b.disabled && !b.classList.contains('selected')),
    ).toHaveLength(0);
    buttonByText(el, 'Check selection').click();
    await stable();
    expect(el.querySelector('.feedback.good')?.textContent).toContain(
      '100% of the best achievable',
    );
  });

  it('blocks picks that would exceed the token budget', async () => {
    const challenge = challengeOf<PickKChallenge>('context-budget', 'pick-k');
    const { el, stable } = await mount(PickKEngine, challenge);
    buttons(el, '.option')[0].click(); // a: 180 tokens
    await stable();
    expect(buttons(el, '.option')[1].disabled).toBe(true); // b: 520 tokens would exceed 600
    expect(el.textContent).toContain('180');
  });
});

describe('ClaimCheckEngine', () => {
  it('scores 100% when exactly the unsupported claims are flagged', async () => {
    const challenge = challengeOf<ClaimCheckChallenge>('hallucination-hunter', 'claim-check');
    const { el, stable } = await mount(ClaimCheckEngine, challenge);
    const boxes = Array.from(el.querySelectorAll<HTMLInputElement>('input[type=checkbox]'));
    challenge.rounds[0].claims.forEach((claim, i) => {
      if (!claim.supported) boxes[i].click();
    });
    await stable();
    buttonByText(el, 'Check claims').click();
    await stable();
    expect(el.querySelector('.feedback.info')?.textContent).toContain('— 100%');
  });
});

describe('DirtyDataEngine', () => {
  it('finds every planted issue and lists what automated checks catch', async () => {
    const challenge = challengeOf<DirtyDataChallenge>('dirty-data', 'dirty-data');
    const { el, results, stable } = await mount(DirtyDataEngine, challenge);
    const cell = (row: number, col: number) =>
      el.querySelectorAll('tbody tr')[row].querySelectorAll<HTMLElement>('td.cell')[col];
    for (const issue of challenge.issues) {
      cell(issue.row, issue.col ?? 0).click();
    }
    await stable();
    buttonByText(el, 'Submit').click();
    await stable();
    expect(el.querySelector('.feedback.good')?.textContent).toContain('F1 100%');
    expect(el.textContent).toContain('250 (row 4)');
    expect(el.textContent).toContain('Duplicate rows: row 6');
    buttonByText(el, 'See results').click();
    expect(results[0]?.scorePct).toBe(100);
  });
});

describe('EmbeddingEngine', () => {
  it('draws the vocabulary and scores a perfect placement', async () => {
    const challenge = challengeOf<EmbeddingChallenge>('embedding-explorer', 'embedding');
    const { fixture, el, stable } = await mount(EmbeddingEngine, challenge);
    expect(el.querySelectorAll('svg circle')).toHaveLength(challenge.words.length);
    const mystery = challenge.mystery[0];
    fixture.componentInstance.guess.set({ x: mystery.x, y: mystery.y });
    await stable();
    buttonByText(el, 'Lock in').click();
    await stable();
    expect(el.querySelector('.feedback.good')?.textContent).toContain('100 points');
    expect(el.querySelectorAll('.feedback .pill')).toHaveLength(3);
  });
});

describe('ChunkLabEngine', () => {
  it('evaluates the configuration live and submits its score', async () => {
    const challenge = challengeOf<ChunkLabChallenge>('chunk-master', 'chunk-lab');
    const { fixture, el, results, stable } = await mount(ChunkLabEngine, challenge);
    expect(el.querySelectorAll('.chunk').length).toBe(
      fixture.componentInstance.report().chunks.length,
    );
    expect(el.querySelectorAll('.option')).toHaveLength(challenge.questions.length);

    fixture.componentInstance.size.set(60);
    fixture.componentInstance.overlapPct.set(15);
    await stable();
    const report = fixture.componentInstance.report();
    expect(report.hits).toBe(challenge.questions.length);
    buttonByText(el, 'Submit this configuration').click();
    expect(results[0]?.scorePct).toBe(report.score);
  });
});
