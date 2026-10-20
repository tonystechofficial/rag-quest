import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENTOR, mentorLine } from '../../content/mentor';
import { LEVELS, nextLevel } from '../../content/worlds';
import { isBossQuest } from '../../core/domain/progression';
import { ChallengeResult, Level } from '../../core/models';
import { ProgressService, RecordOutcome } from '../../core/progress.service';

interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

const CONFETTI_COLORS = ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399', '#fb7185', '#e8edf8'];

@Component({
  selector: 'app-result-panel',
  imports: [RouterLink],
  template: `
    @if (outcome().stars === 3) {
      <div class="confetti-layer" aria-hidden="true">
        @for (piece of confetti; track $index) {
          <span
            class="confetti"
            [style.left.%]="piece.left"
            [style.background]="piece.color"
            [style.animation-delay.ms]="piece.delay"
            [style.animation-duration.ms]="piece.duration"
            [style.transform]="'rotate(' + piece.rotate + 'deg)'"
          ></span>
        }
      </div>
    }
    <div class="card result stack">
      <div>
        <span class="eyebrow"
          >{{ isBoss() ? 'Wing boss ' : 'Quest '
          }}{{ outcome().stars > 0 ? 'cleared' : 'attempted' }}</span
        >
        <h2>{{ level().title }}</h2>
      </div>
      <div class="row" style="gap: 24px; align-items: flex-end">
        <div>
          <div class="score-big gradient-text pop">{{ result().scorePct }}%</div>
          <div class="big-stars" [attr.aria-label]="outcome().stars + ' out of 3 stars'">
            @for (i of [1, 2, 3]; track i) {
              <span
                class="pop"
                [class.off]="i > outcome().stars"
                [style.animation-delay.ms]="200 + i * 180"
                >★</span
              >
            }
          </div>
        </div>
        <div class="stack-sm" style="gap: 4px">
          <div class="xp-gain rise" style="animation-delay: 300ms">
            @if (outcome().xpGained > 0) {
              <strong>+{{ outcome().xpGained }} XP</strong>
            } @else {
              <strong class="muted">No new XP</strong>
            }
          </div>
          <div class="row small" style="gap: 6px">
            @if (outcome().bonus.firstTry) {
              <span class="pill pill-good">+{{ outcome().bonus.firstTry }} first try</span>
            }
            @if (outcome().bonus.flawless) {
              <span class="pill pill-good">+{{ outcome().bonus.flawless }} flawless</span>
            }
            @if (outcome().hinted && result().flawless) {
              <span class="pill">flawless, but hinted — no bonus</span>
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

      <div class="mentor rise" style="animation-delay: 450ms">
        <div class="mentor-avatar" aria-hidden="true">A</div>
        <div class="mentor-bubble">
          <span class="mentor-name">{{ mentorName }}</span>
          {{ mentorComment() }}
          @if (isBoss() && outcome().stars > 0) {
            {{ bossLine }}
          }
        </div>
      </div>

      @if (
        outcome().newBadges.length ||
        outcome().unlockedWings.length ||
        outcome().unlockedQuests.length
      ) {
        <div class="grid grid-2 rise" style="animation-delay: 600ms">
          @for (badge of outcome().newBadges; track badge.id) {
            <div class="card-soft unlock">
              <span class="unlock-icon">{{ badge.icon }}</span>
              <div>
                <div class="eyebrow">Badge unlocked</div>
                <strong>{{ badge.title }}</strong>
                <div class="small muted">{{ badge.description }}</div>
              </div>
            </div>
          }
          @for (wing of outcome().unlockedWings; track wing.id) {
            <a class="card-soft unlock card-link" [routerLink]="['/world', wing.id]">
              <span class="unlock-icon">{{ wing.icon }}</span>
              <div>
                <div class="eyebrow">Wing opened</div>
                <strong>{{ wing.wing }}</strong>
                <div class="small muted">{{ wingLine(wing.id) }}</div>
              </div>
            </a>
          }
          @for (quest of outcome().unlockedQuests; track quest.id) {
            <a class="card-soft unlock card-link" [routerLink]="['/play', quest.id]">
              <span class="unlock-icon">🔓</span>
              <div>
                <div class="eyebrow">Quest unlocked</div>
                <strong>{{ quest.title }}</strong>
                <div class="small muted">{{ quest.tagline }}</div>
              </div>
            </a>
          }
        </div>
      }

      <div class="takeaway">
        <div class="eyebrow" style="margin-bottom: 6px">What to remember</div>
        <p>{{ level().takeaway }}</p>
      </div>

      <div class="actions" style="justify-content: flex-start">
        <button type="button" class="btn btn-ghost" (click)="retry.emit()">Retry</button>
        <a class="btn btn-ghost" [routerLink]="['/world', level().world]">Wing map</a>
        @if (next(); as n) {
          <a class="btn btn-primary" [routerLink]="['/play', n.id]">Next quest: {{ n.title }} →</a>
        } @else if (outcome().stars === 0 && nextInOrder()) {
          <span class="small muted">Earn a star to unlock the next quest.</span>
        } @else if (progress.nextQuest(); as suggestion) {
          <a class="btn btn-primary" [routerLink]="['/play', suggestion.id]"
            >Continue: {{ suggestion.title }} →</a
          >
        } @else {
          <a class="btn btn-primary" routerLink="/badges"
            >Archive restored — claim your certificate →</a
          >
        }
      </div>
    </div>
  `,
  styles: `
    .result {
      border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
      box-shadow: var(--shadow);
    }
    .big-stars {
      font-size: 2rem;
      color: var(--warning);
      letter-spacing: 4px;
      line-height: 1;
      margin-top: 4px;
    }
    .big-stars .off {
      color: var(--border-strong);
    }
    .big-stars span {
      display: inline-block;
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
    .unlock {
      display: flex;
      gap: 12px;
      align-items: center;
      border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
      color: inherit;
    }
    .unlock-icon {
      font-size: 1.8rem;
      flex: none;
    }
  `,
})
export class ResultPanel {
  readonly level = input.required<Level>();
  readonly result = input.required<ChallengeResult>();
  readonly outcome = input.required<RecordOutcome>();
  readonly retry = output<void>();

  protected readonly progress = inject(ProgressService);
  protected readonly mentorName = MENTOR.name;
  protected readonly bossLine = MENTOR.bossBeaten;
  protected readonly confetti: ConfettiPiece[] = Array.from({ length: 28 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i * 53) % 700,
    duration: 2200 + ((i * 97) % 1400),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: (i * 47) % 360,
  }));

  readonly isBoss = computed(() => isBossQuest(this.level().id, LEVELS));
  readonly nextInOrder = computed(() => nextLevel(this.level().id));
  /** The next quest in order, only when it is reachable now. */
  readonly next = computed(() => {
    const candidate = this.nextInOrder();
    return candidate && this.progress.isUnlocked(candidate.id) ? candidate : undefined;
  });
  readonly mentorComment = computed(() =>
    mentorLine(this.outcome().stars, this.level().id.length + this.result().scorePct),
  );

  wingLine(worldId: string): string {
    return MENTOR.wingOpened[worldId as keyof typeof MENTOR.wingOpened] ?? '';
  }
}
