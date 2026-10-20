import { Component, computed, input, output, signal } from '@angular/core';
import { seededShuffle } from '../../../core/domain/ordering';
import { BucketCard, BucketSortChallenge, ChallengeResult } from '../../../core/models';

@Component({
  selector: 'app-bucket-sort-engine',
  template: `
    <div class="stack">
      @if (phase() === 'answer') {
        <p class="small muted">
          Select a card, then click a bucket. Click a sorted card to send it back.
          <strong>{{ unsorted().length }}</strong> left to sort.
        </p>
        <div class="card-soft">
          <div class="eyebrow" style="margin-bottom: 8px">Unsorted</div>
          <div class="row" style="gap: 8px">
            @for (card of unsorted(); track card.id) {
              <button
                type="button"
                class="chip"
                [class.selected]="selectedCard() === card.id"
                [attr.aria-pressed]="selectedCard() === card.id"
                (click)="selectedCard.set(selectedCard() === card.id ? null : card.id)"
              >
                {{ card.text }}
              </button>
            } @empty {
              <span class="small faint">All cards sorted — check your answer.</span>
            }
          </div>
        </div>
        <div class="grid grid-3">
          @for (bucket of challenge().buckets; track bucket.id) {
            <div
              class="bucket"
              [class.target]="selectedCard() !== null"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Put the selected card in ' + bucket.name"
              (click)="assign(bucket.id)"
              (keydown.enter)="assign(bucket.id)"
            >
              <div class="bucket-head">
                <strong>{{ bucket.name }}</strong>
                <div class="small muted">{{ bucket.hint }}</div>
              </div>
              <div class="stack-sm">
                @for (card of cardsIn(bucket.id); track card.id) {
                  <button
                    type="button"
                    class="chip"
                    (click)="unassign(card.id, $event)"
                    title="Send back"
                  >
                    {{ card.text }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
        <div class="actions">
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="unsorted().length > 0"
            (click)="check()"
          >
            Check
          </button>
        </div>
      } @else {
        <div
          class="feedback"
          [class.good]="score() >= 90"
          [class.info]="score() >= 60 && score() < 90"
          [class.bad]="score() < 60"
        >
          <div class="feedback-title">
            {{ correctCount() }} / {{ challenge().cards.length }} cards in the right bucket
          </div>
          <p class="small">
            Each card now sits in its correct bucket, with the reason. Red cards are the ones you
            misplaced.
          </p>
        </div>
        <div class="grid grid-3">
          @for (bucket of challenge().buckets; track bucket.id) {
            <div class="bucket">
              <div class="bucket-head">
                <strong>{{ bucket.name }}</strong>
              </div>
              <div class="stack-sm">
                @for (card of cardsWithBucket(bucket.id); track card.id) {
                  @let mine = assignments()[card.id];
                  <div
                    class="chip result"
                    [class.correct]="mine === card.bucket"
                    [class.wrong]="mine !== card.bucket"
                  >
                    <span>{{ card.text }}</span>
                    <span class="small muted">
                      @if (mine !== card.bucket) {
                        <strong>You said: {{ bucketName(mine) }}.</strong>
                      }
                      {{ card.why }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="finish()">See results</button>
        </div>
      }
    </div>
  `,
  styles: `
    .bucket {
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-sm);
      padding: 12px;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--surface);
    }
    .bucket.target {
      cursor: pointer;
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 6%, var(--surface));
    }
    .bucket.target:hover {
      background: color-mix(in srgb, var(--accent) 14%, var(--surface));
    }
    .bucket-head {
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .chip.result {
      cursor: default;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      text-decoration: none;
    }
  `,
})
export class BucketSortEngine {
  readonly challenge = input.required<BucketSortChallenge>();
  readonly completed = output<ChallengeResult>();

  readonly phase = signal<'answer' | 'feedback'>('answer');
  readonly assignments = signal<Record<string, string>>({});
  readonly selectedCard = signal<string | null>(null);
  readonly score = signal(0);

  readonly shuffledCards = computed(() =>
    seededShuffle(this.challenge().cards, this.challenge().cards.length * 7919),
  );
  readonly unsorted = computed(() =>
    this.shuffledCards().filter((card) => !this.assignments()[card.id]),
  );
  readonly correctCount = computed(
    () =>
      this.challenge().cards.filter((card) => this.assignments()[card.id] === card.bucket).length,
  );

  cardsIn(bucketId: string): BucketCard[] {
    return this.shuffledCards().filter((card) => this.assignments()[card.id] === bucketId);
  }

  cardsWithBucket(bucketId: string): BucketCard[] {
    return this.challenge().cards.filter((card) => card.bucket === bucketId);
  }

  bucketName(bucketId: string | undefined): string {
    return this.challenge().buckets.find((bucket) => bucket.id === bucketId)?.name ?? 'nothing';
  }

  assign(bucketId: string): void {
    const card = this.selectedCard();
    if (!card) {
      return;
    }
    this.assignments.update((current) => ({ ...current, [card]: bucketId }));
    this.selectedCard.set(null);
  }

  unassign(cardId: string, event: Event): void {
    event.stopPropagation();
    this.assignments.update((current) => {
      const next = { ...current };
      delete next[cardId];
      return next;
    });
  }

  check(): void {
    const total = this.challenge().cards.length;
    this.score.set(Math.round((this.correctCount() / total) * 100));
    this.phase.set('feedback');
  }

  finish(): void {
    this.completed.emit({
      scorePct: this.score(),
      summary: `${this.correctCount()} of ${this.challenge().cards.length} cards sorted correctly`,
    });
  }
}
