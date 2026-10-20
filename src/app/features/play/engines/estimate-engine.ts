import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { closenessScore } from '../../../core/domain/scoring';
import { countTokens } from '../../../core/domain/tokenizer';
import { EstimateChallenge } from '../../../core/models';
import { TokenChips } from '../../../shared/token-chips';
import { RoundEngine } from './round-engine';

@Component({
  selector: 'app-estimate-engine',
  imports: [DecimalPipe, TokenChips],
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
      <div class="passage mono" style="font-size: 1.1rem; white-space: pre-wrap">{{ r.text }}</div>
      <p class="small muted">{{ words() }} words · hint: {{ r.hint }}</p>

      @if (phase() === 'answer') {
        <div class="card-soft stack-sm">
          <label class="row row-between" for="guess">
            <span class="prompt">How many tokens?</span>
            <span class="mono" style="font-size: 1.6rem; font-weight: 800">{{ guess() }}</span>
          </label>
          <input
            id="guess"
            type="range"
            min="1"
            max="40"
            [value]="guess()"
            (input)="setGuess($event)"
          />
          <div class="row">
            <button
              type="button"
              class="btn btn-ghost btn-icon"
              (click)="nudge(-1)"
              aria-label="One less"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max="200"
              [value]="guess()"
              (input)="setGuess($event)"
              style="width: 90px"
              aria-label="Your guess"
            />
            <button
              type="button"
              class="btn btn-ghost btn-icon"
              (click)="nudge(1)"
              aria-label="One more"
            >
              +
            </button>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="check()">
            Lock in {{ guess() }}
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
            You guessed {{ locked() }}, the tokenizer counts {{ actual() }} —
            {{ roundScore() }} points.
          </div>
          <p class="small">
            {{ words() }} words became {{ actual() }} tokens ({{
              actual() / words() | number: '1.1-1'
            }}
            tokens per word). Points fall by 1 for every 1% of error.
          </p>
        </div>
        <div class="card-soft">
          <div class="eyebrow" style="margin-bottom: 8px">How it was split</div>
          <app-token-chips [text]="r.text" />
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="next()">
            {{ isLast() ? 'See results' : 'Next text' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class EstimateEngine extends RoundEngine {
  readonly challenge = input.required<EstimateChallenge>();
  override readonly total = computed(() => this.challenge().rounds.length);
  readonly round = computed(() => this.challenge().rounds[this.index()]);
  readonly guess = signal(8);
  readonly locked = signal(0);
  readonly actual = computed(() => countTokens(this.round().text));
  readonly words = computed(() => this.round().text.trim().split(/\s+/).filter(Boolean).length);

  setGuess(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) {
      this.guess.set(Math.max(1, Math.min(200, Math.round(value))));
    }
  }

  nudge(delta: number): void {
    this.guess.update((guess) => Math.max(1, Math.min(200, guess + delta)));
  }

  check(): void {
    this.locked.set(this.guess());
    this.reveal(closenessScore(this.guess(), this.actual()));
  }

  protected override onRoundStart(): void {
    this.guess.set(8);
  }

  protected override feats(): string[] {
    return this.scores().some((score) => score === 100) ? ['exact-token-count'] : [];
  }

  protected override summary(): string {
    return `Average closeness of ${Math.round(this.averageScore())}% over ${this.total()} texts`;
  }
}
