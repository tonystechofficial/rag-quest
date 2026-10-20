import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENTOR, mentorLine } from '../../content/mentor';
import { LEVELS, nextLevel } from '../../content/worlds';
import { isBossQuest } from '../../core/domain/progression';
import { ChallengeResult, Level } from '../../core/models';
import { ProgressService, RecordOutcome } from '../../core/progress.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-result-panel',
  imports: [RouterLink, Icon],
  template: `
    <div class="card ruled tabbed result">
      <span class="tab">Card · {{ level().title }}</span>
      @if (outcome().stars > 0) {
        <span class="stamp stamp-corner pop">{{ isBoss() ? 'Boss cleared' : 'Cleared' }}</span>
      } @else {
        <span class="stamp stamp-ink stamp-corner pop">Attempted</span>
      }

      <div class="score-row">
        <div class="score-big pop">{{ result().scorePct }}%</div>
        <div class="big-stars" [attr.aria-label]="outcome().stars + ' out of 3 stars'">
          @for (i of [1, 2, 3]; track i) {
            <span
              class="pop"
              [class.off]="i > outcome().stars"
              [style.animation-delay.ms]="150 + i * 160"
              >★</span
            >
          }
        </div>
      </div>

      <p class="typed">
        Experience <span class="leader">......</span>
        @if (outcome().xpGained > 0) {
          <b>+{{ outcome().xpGained }} XP</b>
        } @else {
          <span class="muted">no new XP</span>
        }
        @if (outcome().bonus.firstTry) {
          <span class="leader">·</span> first try +{{ outcome().bonus.firstTry }}
        }
        @if (outcome().bonus.flawless) {
          <span class="leader">·</span> flawless +{{ outcome().bonus.flawless }}
        }
        @if (outcome().hinted && result().flawless) {
          <span class="leader">·</span> <span class="muted">flawless, but hinted — no bonus</span>
        }
      </p>
      <p class="typed">
        Result <span class="leader">..........</span> {{ result().summary }}
        @if (outcome().previousBest !== null) {
          <span class="leader">·</span> previous best {{ outcome().previousBest }}%
        }
      </p>
      @if (outcome().stars < 3) {
        <p class="typed small faint">
          Three stars at 90%. Replay anytime to improve your best score.
        </p>
      }

      <div class="mentor rise" style="margin-top: 14px; animation-delay: 350ms">
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
        <div class="grid grid-2 rise" style="margin-top: 16px; animation-delay: 500ms">
          @for (badge of outcome().newBadges; track badge.id) {
            <div class="card-soft unlock">
              <span class="stamp stamp-sm">Badge</span>
              <div>
                <div class="eyebrow">Badge unlocked</div>
                <strong>{{ badge.title }}</strong>
                <div class="small muted">{{ badge.description }}</div>
              </div>
            </div>
          }
          @for (wing of outcome().unlockedWings; track wing.id) {
            <a class="card-soft unlock card-link" [routerLink]="['/world', wing.id]">
              <span class="stamp stamp-brass stamp-sm">Open</span>
              <div>
                <div class="eyebrow">Wing opened</div>
                <strong>{{ wing.wing }}</strong>
                <div class="small muted">{{ wingLine(wing.id) }}</div>
              </div>
            </a>
          }
          @for (quest of outcome().unlockedQuests; track quest.id) {
            <a class="card-soft unlock card-link" [routerLink]="['/play', quest.id]">
              <span class="unlock-icon"><app-icon name="unlock" /></span>
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

      <div class="actions" style="justify-content: flex-start; margin-top: 16px">
        <button type="button" class="btn btn-ghost" (click)="retry.emit()">
          <app-icon name="refresh" /> Retry
        </button>
        <a class="btn btn-ghost" [routerLink]="['/world', level().world]"
          ><app-icon name="map" /> Wing map</a
        >
        @if (next(); as n) {
          <a class="btn btn-primary" [routerLink]="['/play', n.id]"
            >Next card: {{ n.title }} <app-icon name="arrow-right"
          /></a>
        } @else if (outcome().stars === 0 && nextInOrder()) {
          <span class="small muted">Earn a star to unlock the next card.</span>
        } @else if (progress.nextQuest(); as suggestion) {
          <a class="btn btn-primary" [routerLink]="['/play', suggestion.id]"
            >Continue: {{ suggestion.title }} <app-icon name="arrow-right"
          /></a>
        } @else {
          <a class="btn btn-primary" routerLink="/badges"
            >Archive restored, claim your certificate <app-icon name="arrow-right"
          /></a>
        }
      </div>
    </div>
  `,
  styles: `
    .result {
      padding-top: 58px;
    }
    .score-row {
      display: flex;
      gap: 22px;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .big-stars {
      font-size: 2.1rem;
      color: var(--brass);
      letter-spacing: 4px;
      line-height: 1;
      padding-bottom: 6px;
    }
    .big-stars .off {
      color: var(--edge);
    }
    .big-stars span {
      display: inline-block;
    }
    .takeaway {
      margin-top: 16px;
      background: var(--card-2);
      border: 1px solid var(--edge);
      border-left: 3px solid var(--pen-blue);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
    }
    .unlock {
      display: flex;
      gap: 14px;
      align-items: center;
      color: inherit;
    }
    .unlock-icon {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1.5px solid var(--ink);
      background: var(--card);
      font-size: 1.2rem;
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

  readonly isBoss = computed(() => isBossQuest(this.level().id, LEVELS));
  readonly nextInOrder = computed(() => nextLevel(this.level().id));
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
