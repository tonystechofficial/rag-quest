import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { bestSubsetUnderBudget, budgetScore } from '../../../core/domain/knapsack';
import { buildIndex, search } from '../../../core/domain/retrieval';
import { pickScore } from '../../../core/domain/scoring';
import { PickItem, PickKChallenge } from '../../../core/models';
import { RoundEngine } from './round-engine';

const RELEVANCE_LABELS = ['Irrelevant', 'Marginal', 'Useful', 'Essential'];

@Component({
  selector: 'app-pick-k-engine',
  imports: [DecimalPipe],
  template: `
    <div class="stack">
      <div class="engine-header">
        <span class="pill">Round {{ index() + 1 }} / {{ total() }}</span>
        <span class="progress"><span [style.width.%]="progressPct()"></span></span>
        @if (scores().length) {
          <span class="small muted">Average: {{ averageScore() | number: '1.0-0' }}%</span>
        }
      </div>

      @let r = round();
      <div class="passage">
        <span class="eyebrow">User question</span>
        <div class="prompt">{{ r.query }}</div>
      </div>

      @if (isBudget()) {
        <div class="card-soft stack-sm">
          <div class="row row-between small">
            <span
              ><strong class="mono">{{ usedCost() }}</strong> / {{ budget() }} tokens used</span
            >
            <span class="muted">{{ picked().length }} chunks selected</span>
          </div>
          <div class="progress" [class.progress-bad]="usedCost() > budget()">
            <span [style.width.%]="(usedCost() / budget()) * 100"></span>
          </div>
        </div>
      } @else {
        <p class="small muted">
          Pick exactly <strong>{{ k() }}</strong> chunks · {{ picked().length }} /
          {{ k() }} selected
        </p>
      }

      <div class="stack-sm">
        @for (item of r.items; track item.id) {
          @let isPicked = picked().includes(item.id);
          @if (phase() === 'answer') {
            <button
              type="button"
              class="option"
              [class.selected]="isPicked"
              [attr.aria-pressed]="isPicked"
              [disabled]="!isPicked && !canPick(item)"
              (click)="toggle(item)"
            >
              <span class="key">{{ item.id.toUpperCase() }}</span>
              <span style="flex: 1">{{ item.text }}</span>
              @if (isBudget()) {
                <span class="pill mono">{{ item.cost }} tok</span>
              }
            </button>
          } @else {
            <div
              class="option result"
              [class.correct]="isPicked && item.relevance >= 2"
              [class.wrong]="isPicked && item.relevance < 2"
              [class.selected]="!isPicked && bestIds().includes(item.id)"
            >
              <span class="key">{{ item.id.toUpperCase() }}</span>
              <div style="flex: 1" class="stack-sm">
                <span>{{ item.text }}</span>
                <div class="row small" style="gap: 8px">
                  <span
                    class="pill"
                    [class.pill-good]="item.relevance === 3"
                    [class.pill-warn]="item.relevance === 2"
                    [class.pill-bad]="item.relevance === 0"
                  >
                    {{ relevanceLabel(item.relevance) }} · {{ '★'.repeat(item.relevance)
                    }}{{ '☆'.repeat(3 - item.relevance) }}
                  </span>
                  @if (isBudget()) {
                    <span class="pill mono">{{ item.cost }} tok</span>
                  } @else {
                    <span
                      class="row small muted"
                      style="gap: 6px"
                      title="What a keyword-only (TF-IDF) retriever scores this chunk"
                    >
                      keyword score
                      <span class="progress" style="width: 90px; display: inline-block">
                        <span [style.width.%]="(keywordScores().get(item.id) ?? 0) * 100"></span>
                      </span>
                    </span>
                  }
                  @if (isPicked) {
                    <span class="pill">your pick</span>
                  }
                  @if (bestIds().includes(item.id)) {
                    <span class="pill pill-good">in the best set</span>
                  }
                </div>
                <span class="small muted">{{ item.note }}</span>
              </div>
            </div>
          }
        }
      </div>

      @if (phase() === 'answer') {
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="picked.set([])">Clear</button>
          <button type="button" class="btn btn-primary" [disabled]="!canCheck()" (click)="check()">
            Check selection
          </button>
        </div>
      } @else {
        <div
          class="feedback"
          [class.good]="roundScore() >= 90"
          [class.info]="roundScore() >= 60 && roundScore() < 90"
          [class.bad]="roundScore() < 60"
        >
          <div class="feedback-title">
            {{ roundScore() }}% of the best achievable relevance
            @if (isBudget()) {
              · best set: {{ bestLabel() }} ({{ bestCost() }} tokens)
            } @else {
              · best set: {{ bestLabel() }}
            }
          </div>
          <p>{{ r.explanation }}</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="next()">
            {{ isLast() ? 'See results' : 'Next question' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .option.result {
      cursor: default;
    }
  `,
})
export class PickKEngine extends RoundEngine {
  readonly challenge = input.required<PickKChallenge>();
  override readonly total = computed(() => this.challenge().rounds.length);
  readonly round = computed(() => this.challenge().rounds[this.index()]);
  readonly isBudget = computed(() => this.challenge().mode === 'budget');
  readonly k = computed(() => this.round().k ?? 3);
  readonly budget = computed(() => this.round().budget ?? 0);
  readonly picked = signal<string[]>([]);

  readonly usedCost = computed(() =>
    this.round()
      .items.filter((item) => this.picked().includes(item.id))
      .reduce((sum, item) => sum + (item.cost ?? 0), 0),
  );

  readonly budgetItems = computed(() =>
    this.round().items.map((item) => ({
      id: item.id,
      cost: item.cost ?? 0,
      value: item.relevance,
    })),
  );

  readonly bestIds = computed<string[]>(() => {
    if (this.isBudget()) {
      return bestSubsetUnderBudget(this.budgetItems(), this.budget()).ids;
    }
    return [...this.round().items]
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, this.k())
      .map((item) => item.id);
  });
  readonly bestCost = computed(() =>
    this.budgetItems()
      .filter((item) => this.bestIds().includes(item.id))
      .reduce((sum, item) => sum + item.cost, 0),
  );
  readonly bestLabel = computed(() =>
    [...this.bestIds()]
      .sort()
      .map((id) => id.toUpperCase())
      .join(' + '),
  );

  /** What a keyword-only retriever thinks of each chunk, normalized to the best score of the round. */
  readonly keywordScores = computed(() => {
    const items = this.round().items;
    const index = buildIndex(items.map((item) => ({ id: item.id, text: item.text })));
    const results = search(index, this.round().query, items.length);
    const max = Math.max(...results.map((result) => result.score)) || 1;
    return new Map(results.map((result) => [result.id, result.score / max]));
  });

  readonly canCheck = computed(() =>
    this.isBudget()
      ? this.picked().length > 0 && this.usedCost() <= this.budget()
      : this.picked().length === this.k(),
  );

  canPick(item: PickItem): boolean {
    if (this.isBudget()) {
      return this.usedCost() + (item.cost ?? 0) <= this.budget();
    }
    return this.picked().length < this.k();
  }

  toggle(item: PickItem): void {
    this.picked.update((picked) =>
      picked.includes(item.id) ? picked.filter((id) => id !== item.id) : [...picked, item.id],
    );
  }

  relevanceLabel(relevance: number): string {
    return RELEVANCE_LABELS[relevance] ?? '';
  }

  check(): void {
    const score = this.isBudget()
      ? budgetScore(this.picked(), this.budgetItems(), this.budget())
      : pickScore(this.picked(), this.round().items, this.k());
    this.reveal(Math.round(score));
  }

  protected override onRoundStart(): void {
    this.picked.set([]);
  }

  protected override summary(): string {
    return `Average of ${Math.round(this.averageScore())}% of the best achievable relevance`;
  }
}
