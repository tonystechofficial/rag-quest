import { computed, Directive, output, Signal, signal } from '@angular/core';
import { ChallengeResult } from '../../../core/models';

/** Shared state machine for challenges made of successive rounds (answer → feedback → next). */
@Directive()
export abstract class RoundEngine {
  readonly completed = output<ChallengeResult>();

  readonly index = signal(0);
  readonly phase = signal<'answer' | 'feedback'>('answer');
  readonly scores = signal<number[]>([]);

  abstract readonly total: Signal<number>;

  readonly isLast = computed(() => this.index() >= this.total() - 1);
  readonly roundScore = computed(() => this.scores()[this.index()] ?? 0);
  readonly averageScore = computed(() => {
    const scores = this.scores();
    return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  });
  readonly progressPct = computed(
    () =>
      ((this.index() + (this.phase() === 'feedback' ? 1 : 0)) / Math.max(1, this.total())) * 100,
  );

  protected reveal(score: number): void {
    const index = this.index();
    this.scores.update((scores) => {
      const copy = [...scores];
      copy[index] = score;
      return copy;
    });
    this.phase.set('feedback');
  }

  next(): void {
    if (this.isLast()) {
      this.finish();
      return;
    }
    this.index.update((i) => i + 1);
    this.phase.set('answer');
    this.onRoundStart();
  }

  protected finish(): void {
    this.completed.emit({ scorePct: Math.round(this.averageScore()), summary: this.summary() });
  }

  protected abstract summary(): string;

  protected onRoundStart(): void {
    // Subclasses reset their per-round state here.
  }
}
