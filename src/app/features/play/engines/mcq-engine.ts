import { Component, computed, input, signal } from '@angular/core';
import { McqChallenge } from '../../../core/models';
import { TfidfTable } from '../../../shared/tfidf-table';
import { RoundEngine } from './round-engine';

@Component({
  selector: 'app-mcq-engine',
  imports: [TfidfTable],
  template: `
    <div class="stack">
      <div class="engine-header">
        <span class="pill">Question {{ index() + 1 }} / {{ total() }}</span>
        <span class="progress"><span [style.width.%]="progressPct()"></span></span>
        <span class="small muted">{{ correctCount() }} correct so far</span>
      </div>

      @let q = question();
      @if (q.context) {
        <div class="passage mono small">{{ q.context }}</div>
      }
      @if (q.tfidfDocs; as docs) {
        <div class="stack-sm">
          @for (doc of docs; track doc.label) {
            <div class="passage small">
              <strong>Doc {{ doc.label }}:</strong> {{ doc.text }}
            </div>
          }
        </div>
      }
      <p class="prompt">{{ q.prompt }}</p>

      <div class="stack-sm" role="radiogroup" [attr.aria-label]="q.prompt">
        @for (option of q.options; track $index) {
          <button
            type="button"
            class="option"
            role="radio"
            [attr.aria-checked]="selected() === $index"
            [class.selected]="phase() === 'answer' && selected() === $index"
            [class.correct]="phase() === 'feedback' && $index === q.answer"
            [class.wrong]="phase() === 'feedback' && selected() === $index && $index !== q.answer"
            [disabled]="phase() === 'feedback'"
            (click)="selected.set($index)"
          >
            <span class="key">{{ letters[$index] }}</span>
            <span>{{ option }}</span>
          </button>
        }
      </div>

      @if (phase() === 'answer') {
        <div class="actions">
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="selected() === null"
            (click)="check()"
          >
            Check answer
          </button>
        </div>
      } @else {
        <div class="feedback" [class.good]="correct()" [class.bad]="!correct()">
          <div class="feedback-title">{{ correct() ? 'Correct!' : 'Not quite.' }}</div>
          <p>{{ q.explanation }}</p>
        </div>
        @if (q.tfidfDocs; as docs) {
          <app-tfidf-table [docs]="docs" />
        }
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="next()">
            {{ isLast() ? 'See results' : 'Next question' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class McqEngine extends RoundEngine {
  readonly challenge = input.required<McqChallenge>();
  override readonly total = computed(() => this.challenge().questions.length);
  readonly question = computed(() => this.challenge().questions[this.index()]);
  readonly selected = signal<number | null>(null);
  readonly correct = computed(() => this.selected() === this.question().answer);
  readonly correctCount = computed(() => this.scores().filter((score) => score === 100).length);
  readonly letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  check(): void {
    if (this.selected() === null) {
      return;
    }
    this.reveal(this.correct() ? 100 : 0);
  }

  protected override onRoundStart(): void {
    this.selected.set(null);
  }

  protected override summary(): string {
    return `${this.correctCount()} of ${this.total()} questions answered correctly`;
  }
}
