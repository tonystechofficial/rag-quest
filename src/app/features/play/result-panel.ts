import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { nextLevel } from '../../content/worlds';
import { RecordOutcome } from '../../core/progress.service';
import { ChallengeResult, Level } from '../../core/models';
import { Stars } from '../../shared/stars';

@Component({
  selector: 'app-result-panel',
  imports: [RouterLink, Stars],
  template: `
    <div class="card result stack">
      <div>
        <span class="eyebrow">Challenge complete</span>
        <h2>{{ level().title }}</h2>
      </div>
      <div class="row" style="gap: 24px; align-items: flex-end">
        <div>
          <div class="score-big gradient-text">{{ result().scorePct }}%</div>
          <app-stars [count]="outcome().stars" />
        </div>
        <div class="stack-sm" style="gap: 4px">
          <div class="xp-gain">
            @if (outcome().xpGained > 0) {
              <strong>+{{ outcome().xpGained }} XP</strong>
            } @else {
              <strong class="muted">No new XP</strong>
            }
          </div>
          <div class="small muted">
            {{ result().summary }}
            @if (outcome().previousBest !== null) {
              · previous best {{ outcome().previousBest }}%
            }
          </div>
          @if (outcome().stars < 3) {
            <div class="small faint">
              Three stars at 90% — replay anytime to improve your best score.
            </div>
          }
        </div>
      </div>
      <div class="takeaway">
        <div class="eyebrow" style="margin-bottom: 6px">What to remember</div>
        <p>{{ level().takeaway }}</p>
      </div>
      <div class="actions" style="justify-content: flex-start">
        <button type="button" class="btn btn-ghost" (click)="retry.emit()">Retry</button>
        <a class="btn btn-ghost" [routerLink]="['/world', level().world]">World map</a>
        @if (next(); as n) {
          <a class="btn btn-primary" [routerLink]="['/play', n.id]"
            >Next challenge: {{ n.title }} →</a
          >
        } @else {
          <a class="btn btn-primary" routerLink="/">You finished the quest! Back to the worlds →</a>
        }
      </div>
    </div>
  `,
  styles: `
    .result {
      border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
      box-shadow: var(--shadow);
    }
    .xp-gain {
      font-size: 1.3rem;
    }
    .takeaway {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent-2);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
    }
  `,
})
export class ResultPanel {
  readonly level = input.required<Level>();
  readonly result = input.required<ChallengeResult>();
  readonly outcome = input.required<RecordOutcome>();
  readonly retry = output<void>();

  readonly next = computed(() => nextLevel(this.level().id));
}
