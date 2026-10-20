import { Component, computed, input, output, signal } from '@angular/core';
import { pairwiseOrderAccuracy, seededShuffle } from '../../../core/domain/ordering';
import { ChallengeResult, OrderStepsChallenge } from '../../../core/models';

@Component({
  selector: 'app-order-steps-engine',
  template: `
    <div class="stack">
      @if (phase() === 'answer') {
        <p class="small muted">
          Drag a step to a new position, or use the arrows. First step on top.
        </p>
        <ol class="steps">
          @for (id of order(); track id; let i = $index) {
            @let step = byId().get(id)!;
            <li
              class="step"
              draggable="true"
              [class.dragging]="dragFrom() === i"
              (dragstart)="dragFrom.set(i)"
              (dragend)="dragFrom.set(null)"
              (dragover)="$event.preventDefault()"
              (drop)="dropAt(i)"
            >
              <span class="step-no mono">{{ i + 1 }}</span>
              <div class="step-body">
                <strong>{{ step.title }}</strong>
                <div class="small muted">{{ step.detail }}</div>
              </div>
              <div class="step-actions">
                <button
                  type="button"
                  class="btn btn-ghost btn-icon"
                  (click)="move(i, -1)"
                  [disabled]="i === 0"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-icon"
                  (click)="move(i, 1)"
                  [disabled]="i === order().length - 1"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
            </li>
          }
        </ol>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="check()">Check order</button>
        </div>
      } @else {
        <div
          class="feedback"
          [class.good]="score() >= 90"
          [class.info]="score() >= 60 && score() < 90"
          [class.bad]="score() < 60"
        >
          <div class="feedback-title">
            {{ score() }}% of step pairs in the right order · {{ exactCount() }} /
            {{ order().length }} steps at their exact position
          </div>
          <p class="small">
            The score counts pairs of steps ordered correctly, so one misplaced step costs little
            and a reversed pipeline costs everything. Below is the reference order with the phase
            each step belongs to.
          </p>
        </div>
        <ol class="steps">
          @for (step of challenge().steps; track step.id; let i = $index) {
            @let yours = order().indexOf(step.id) + 1;
            <li class="step static" [class.ok]="yours === i + 1" [class.ko]="yours !== i + 1">
              <span class="step-no mono">{{ i + 1 }}</span>
              <div class="step-body">
                <div class="row" style="gap: 8px">
                  <strong>{{ step.title }}</strong>
                  <span class="pill">{{ step.phase }}</span>
                </div>
                <div class="small muted">{{ step.detail }}</div>
                @if (yours !== i + 1) {
                  <div class="small" style="color: var(--warning)">
                    You placed it at position {{ yours }}.
                  </div>
                }
              </div>
            </li>
          }
        </ol>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="finish()">See results</button>
        </div>
      }
    </div>
  `,
  styles: `
    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .step {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-2);
      cursor: grab;
    }
    .step.static {
      cursor: default;
    }
    .step.dragging {
      opacity: 0.5;
    }
    .step.ok {
      border-color: var(--success);
    }
    .step.ko {
      border-color: var(--danger);
    }
    .step-no {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: var(--surface-3);
      font-weight: 800;
      flex: none;
    }
    .step-body {
      flex: 1;
      min-width: 0;
    }
    .step-actions {
      display: flex;
      gap: 4px;
      flex: none;
    }
  `,
})
export class OrderStepsEngine {
  readonly challenge = input.required<OrderStepsChallenge>();
  readonly completed = output<ChallengeResult>();

  readonly phase = signal<'answer' | 'feedback'>('answer');
  readonly dragFrom = signal<number | null>(null);
  readonly score = signal(0);

  readonly byId = computed(() => new Map(this.challenge().steps.map((step) => [step.id, step])));
  readonly correctOrder = computed(() => this.challenge().steps.map((step) => step.id));
  readonly order = signal<string[]>([]);
  readonly exactCount = computed(
    () => this.order().filter((id, i) => this.correctOrder()[i] === id).length,
  );

  constructor() {
    // Shuffle once the input is available (inputs are set before the first render).
    queueMicrotask(() => this.order.set(this.shuffled()));
  }

  move(index: number, delta: number): void {
    const target = index + delta;
    const order = [...this.order()];
    if (target < 0 || target >= order.length) {
      return;
    }
    [order[index], order[target]] = [order[target], order[index]];
    this.order.set(order);
  }

  dropAt(index: number): void {
    const from = this.dragFrom();
    this.dragFrom.set(null);
    if (from === null || from === index) {
      return;
    }
    const order = [...this.order()];
    const [moved] = order.splice(from, 1);
    order.splice(index, 0, moved);
    this.order.set(order);
  }

  check(): void {
    const accuracy = pairwiseOrderAccuracy(this.order(), this.correctOrder());
    this.score.set(Math.round(accuracy * 100));
    this.phase.set('feedback');
  }

  finish(): void {
    this.completed.emit({
      scorePct: this.score(),
      flawless: this.score() >= 90,
      summary: `${this.exactCount()} of ${this.order().length} steps at their exact position`,
    });
  }

  private shuffled(): string[] {
    const ids = this.correctOrder();
    let seed = Math.floor(Math.random() * 100000);
    for (let attempt = 0; attempt < 20; attempt++, seed++) {
      const candidate = seededShuffle(ids, seed);
      if (candidate.some((id, i) => id !== ids[i])) {
        return candidate;
      }
    }
    return [...ids].reverse();
  }
}
