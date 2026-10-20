import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { ClaimCheckChallenge } from '../../../core/models';
import { RoundEngine } from './round-engine';

@Component({
  selector: 'app-claim-check-engine',
  imports: [DecimalPipe],
  template: `
    <div class="stack">
      <div class="engine-header">
        <span class="pill">Answer {{ index() + 1 }} / {{ total() }}</span>
        <span class="progress"><span [style.width.%]="progressPct()"></span></span>
        @if (scores().length) {
          <span class="small muted">Average: {{ averageScore() | number: '1.0-0' }}%</span>
        }
      </div>

      @let r = round();
      <div class="grid grid-2">
        <div class="passage">
          <span class="eyebrow">Retrieved context</span>
          <p>{{ r.context }}</p>
        </div>
        <div class="passage answer">
          <span class="eyebrow">Generated answer</span>
          <p>{{ r.answer }}</p>
        </div>
      </div>

      <p class="prompt">Tick every claim that the context does <em>not</em> support.</p>
      <div class="stack-sm">
        @for (claim of r.claims; track $index) {
          @let flagged = flags().includes($index);
          @if (phase() === 'answer') {
            <label class="checkbox">
              <input type="checkbox" [checked]="flagged" (change)="toggle($index)" />
              <span>{{ claim.text }}</span>
            </label>
          } @else {
            @let right = flagged === !claim.supported;
            <div class="feedback" [class.good]="right" [class.bad]="!right">
              <div class="row row-between" style="gap: 8px">
                <strong>{{ claim.text }}</strong>
                <span
                  class="pill"
                  [class.pill-good]="claim.supported"
                  [class.pill-bad]="!claim.supported"
                >
                  {{ claim.supported ? 'Supported' : 'Not supported' }}
                </span>
              </div>
              <p class="small" style="margin-top: 6px">
                @if (!right) {
                  <strong>{{
                    flagged ? 'You flagged a supported claim.' : 'You missed this one.'
                  }}</strong>
                }
                {{ claim.why }}
              </p>
            </div>
          }
        }
      </div>

      @if (phase() === 'answer') {
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="check()">Check claims</button>
        </div>
      } @else {
        <div class="feedback info">
          <div class="feedback-title">
            {{ correctCount() }} / {{ r.claims.length }} claims judged correctly —
            {{ roundScore() }}%
          </div>
          <p class="small">
            This is how faithfulness is evaluated in practice: split the answer into atomic claims,
            then verify each one against the retrieved context only — not against what you happen to
            know.
          </p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="next()">
            {{ isLast() ? 'See results' : 'Next answer' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class ClaimCheckEngine extends RoundEngine {
  readonly challenge = input.required<ClaimCheckChallenge>();
  override readonly total = computed(() => this.challenge().rounds.length);
  readonly round = computed(() => this.challenge().rounds[this.index()]);
  readonly flags = signal<number[]>([]);
  readonly correctCount = computed(
    () =>
      this.round().claims.filter((claim, i) => this.flags().includes(i) === !claim.supported)
        .length,
  );

  toggle(index: number): void {
    this.flags.update((flags) =>
      flags.includes(index) ? flags.filter((i) => i !== index) : [...flags, index],
    );
  }

  check(): void {
    this.reveal(Math.round((this.correctCount() / this.round().claims.length) * 100));
  }

  protected override onRoundStart(): void {
    this.flags.set([]);
  }

  protected override summary(): string {
    return `${Math.round(this.averageScore())}% of claims judged correctly`;
  }
}
