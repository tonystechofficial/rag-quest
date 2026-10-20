import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { PrfMetrics, setF1 } from '../../../core/domain/scoring';
import { TokenSelectChallenge } from '../../../core/models';
import { RoundEngine } from './round-engine';

type TokenStatus = 'correct' | 'wrong' | 'missed' | 'none';

@Component({
  selector: 'app-token-select-engine',
  imports: [DecimalPipe, PercentPipe],
  template: `
    <div class="stack">
      <div class="engine-header">
        <span class="pill">Round {{ index() + 1 }} / {{ total() }}</span>
        <span class="progress"><span [style.width.%]="progressPct()"></span></span>
        @if (scores().length) {
          <span class="small muted">Average F1: {{ averageScore() | number: '1.0-0' }}%</span>
        }
      </div>

      @let r = round();
      @let multi = challenge().labels.length > 1;
      <p class="prompt">{{ r.prompt }}</p>

      @if (multi) {
        <div class="row">
          <span class="small muted">Active label:</span>
          @for (label of challenge().labels; track label.id) {
            <button
              type="button"
              class="chip"
              [class.selected]="activeLabel() === label.id"
              [disabled]="phase() === 'feedback'"
              (click)="activeLabel.set(label.id)"
            >
              <span class="chip-label">{{ label.id }}</span> {{ label.name }}
            </button>
          }
        </div>
      }

      <div class="row" style="gap: 8px" role="group" aria-label="Tokens">
        @for (token of r.tokens; track $index) {
          @let status = statusOf($index);
          @let mine = selection()[$index];
          <button
            type="button"
            class="chip"
            [attr.aria-pressed]="!!mine"
            [class.selected]="phase() === 'answer' && !!mine"
            [class.correct]="status === 'correct'"
            [class.wrong]="status === 'wrong'"
            [class.missed]="status === 'missed'"
            [disabled]="phase() === 'feedback'"
            (click)="toggle($index)"
          >
            {{ token }}
            @if (mine && multi) {
              <span class="chip-label">{{ mine }}</span>
            }
            @if (multi && (status === 'missed' || status === 'wrong')) {
              <span class="chip-label">→ {{ r.answers[$index] ?? 'none' }}</span>
            }
          </button>
        }
      </div>

      @if (challenge().hint; as hint) {
        <details class="card-soft small">
          <summary class="muted" style="cursor: pointer">
            Reference list used in this game ({{ hint.length }} words)
          </summary>
          <p class="mono" style="margin-top: 8px">{{ hint.join(', ') }}</p>
        </details>
      }

      @if (phase() === 'answer') {
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="clear()">Clear</button>
          <button type="button" class="btn btn-primary" (click)="check()">Check</button>
        </div>
      } @else {
        <div
          class="feedback"
          [class.good]="roundScore() >= 90"
          [class.info]="roundScore() >= 60 && roundScore() < 90"
          [class.bad]="roundScore() < 60"
        >
          <div class="feedback-title">
            F1 score {{ roundScore() }}% — precision {{ metrics()?.precision ?? 0 | percent }} ·
            recall {{ metrics()?.recall ?? 0 | percent }}
          </div>
          <p>{{ r.explanation }}</p>
          <p class="small muted">
            Green = right, red = selected but wrong, dashed amber = missed. Precision: how many of
            your picks were right. Recall: how many of the expected tokens you found.
          </p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="next()">
            {{ isLast() ? 'See results' : 'Next round' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class TokenSelectEngine extends RoundEngine {
  readonly challenge = input.required<TokenSelectChallenge>();
  override readonly total = computed(() => this.challenge().rounds.length);
  readonly round = computed(() => this.challenge().rounds[this.index()]);
  readonly activeLabel = signal<string>('');
  readonly selection = signal<Record<number, string>>({});
  readonly metrics = signal<PrfMetrics | null>(null);

  toggle(index: number): void {
    const label = this.activeLabel() || this.challenge().labels[0].id;
    this.selection.update((current) => {
      const next = { ...current };
      if (next[index] === label) {
        delete next[index];
      } else {
        next[index] = label;
      }
      return next;
    });
  }

  clear(): void {
    this.selection.set({});
  }

  check(): void {
    const predicted = Object.entries(this.selection()).map(([i, label]) => `${i}:${label}`);
    const expected = Object.entries(this.round().answers).map(([i, label]) => `${i}:${label}`);
    const metrics = setF1(predicted, expected);
    this.metrics.set(metrics);
    this.reveal(Math.round(metrics.f1 * 100));
  }

  statusOf(index: number): TokenStatus {
    if (this.phase() !== 'feedback') {
      return 'none';
    }
    const expected = this.round().answers[index];
    const mine = this.selection()[index];
    if (mine && mine === expected) return 'correct';
    if (mine) return 'wrong';
    if (expected) return 'missed';
    return 'none';
  }

  protected override onRoundStart(): void {
    this.selection.set({});
    this.metrics.set(null);
  }

  protected override summary(): string {
    return `Average F1 of ${Math.round(this.averageScore())}% over ${this.total()} rounds`;
  }
}
