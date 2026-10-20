import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENTOR } from '../../content/mentor';
import { findWorld, LEVELS, levelsForWorld, WORLDS } from '../../content/worlds';
import { bossOf, isBossQuest, wingOrder } from '../../core/domain/progression';
import { WorldId } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { Stars } from '../../shared/stars';

@Component({
  selector: 'app-world-page',
  imports: [RouterLink, Stars],
  template: `
    <div class="container page stack">
      @if (world(); as w) {
        <nav class="row small muted" aria-label="Breadcrumb">
          <a routerLink="/">The Archive</a>
          <span>/</span>
          <span>{{ w.wing }}</span>
        </nav>
        <header class="world-header card world-{{ w.id }}">
          <div class="world-icon" [class.lock]="!open()">{{ w.icon }}</div>
          <div style="flex: 1">
            <span class="eyebrow">{{ w.name }} · wing {{ wingNumber() }} of {{ wingCount }}</span>
            <h1>{{ w.wing }}</h1>
            <p class="muted">{{ w.story }}</p>
            <div class="mentor">
              <div class="mentor-avatar" aria-hidden="true">A</div>
              <div class="mentor-bubble">
                <span class="mentor-name">{{ mentor.name }}</span>
                {{ open() ? w.mentorIntro : lockMessage() }}
              </div>
            </div>
          </div>
          <div class="world-progress">
            <div class="score-big gradient-text">
              {{ earnedStars()
              }}<span class="muted" style="font-size: 1.2rem"> / {{ levels().length * 3 }} ★</span>
            </div>
            <div class="progress">
              <span [style.width.%]="(earnedStars() / (levels().length * 3)) * 100"></span>
            </div>
            <div class="small faint" style="margin-top: 6px">
              {{ clearedCount() }} / {{ levels().length }} quests cleared
            </div>
          </div>
        </header>

        <ol class="path">
          @for (level of levels(); track level.id; let i = $index) {
            @let result = progress.results()[level.id];
            @let unlocked = progress.isUnlocked(level.id);
            @let boss = isBoss(level.id);
            <li
              class="card level"
              [class.done]="result?.stars"
              [class.lock]="!unlocked"
              [class.boss]="boss"
            >
              <div class="level-no mono" [class.boss-no]="boss">
                @if (!unlocked) {
                  🔒
                } @else if (boss) {
                  👑
                } @else {
                  {{ i + 1 }}
                }
              </div>
              <div class="level-body">
                <div class="row" style="gap: 8px">
                  <h3 style="margin: 0">{{ level.title }}</h3>
                  @if (boss) {
                    <span class="pill pill-warn">Wing boss</span>
                  }
                  <span class="pill pill-{{ w.id }}">{{ level.concept }}</span>
                </div>
                <p class="muted small" style="margin: 4px 0 0">
                  {{ unlocked ? level.story : level.tagline }}
                </p>
                <div class="row small faint" style="margin-top: 8px; gap: 10px">
                  <span>~{{ level.minutes }} min</span>
                  <span>{{ level.xp }} XP</span>
                  @if (result) {
                    <span
                      >best {{ result.bestScore }}% · {{ result.attempts }} attempt{{
                        result.attempts === 1 ? '' : 's'
                      }}</span
                    >
                  }
                  @if (!unlocked) {
                    <span style="color: var(--warning)">{{ questLockReason(level.id) }}</span>
                  }
                </div>
              </div>
              <div class="level-side">
                <app-stars [count]="result?.stars ?? 0" />
                @if (unlocked) {
                  <a
                    class="btn"
                    [class.btn-primary]="!result"
                    [class.btn-ghost]="result"
                    [routerLink]="['/play', level.id]"
                  >
                    {{ result ? 'Replay' : boss ? 'Face the boss' : 'Play' }}
                  </a>
                } @else {
                  <span class="btn" aria-disabled="true">Locked</span>
                }
              </div>
            </li>
          }
        </ol>

        <div class="row" style="justify-content: center; margin-top: 12px">
          @for (other of otherWorlds(); track other.id) {
            <a class="btn btn-ghost" [routerLink]="['/world', other.id]"
              >{{ progress.isWingOpen(other.id) ? other.icon : '🔒' }} {{ other.wing }}</a
            >
          }
        </div>
      } @else {
        <div class="card stack">
          <h1>Unknown wing</h1>
          <div><a class="btn btn-primary" routerLink="/">Back to the Archive</a></div>
        </div>
      }
    </div>
  `,
  styles: `
    .world-header {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .world-icon {
      font-size: 2.6rem;
      width: 84px;
      height: 84px;
      display: grid;
      place-items: center;
      border-radius: 20px;
      background: var(--surface-3);
      flex: none;
    }
    .world-data .world-icon {
      background: color-mix(in srgb, var(--world-data) 18%, var(--surface-2));
    }
    .world-nlp .world-icon {
      background: color-mix(in srgb, var(--world-nlp) 18%, var(--surface-2));
    }
    .world-rag .world-icon {
      background: color-mix(in srgb, var(--world-rag) 18%, var(--surface-2));
    }
    .world-progress {
      min-width: 200px;
    }
    .path {
      list-style: none;
      margin: 0;
      padding: 0 0 0 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }
    .path::before {
      content: '';
      position: absolute;
      left: 40px;
      top: 30px;
      bottom: 30px;
      width: 2px;
      background: var(--border-strong);
      z-index: 0;
    }
    .level {
      display: flex;
      gap: 16px;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    .level.done {
      border-color: color-mix(in srgb, var(--success) 40%, var(--border));
    }
    .level.lock {
      opacity: 0.72;
    }
    .level.boss {
      border-color: color-mix(in srgb, var(--warning) 55%, var(--border));
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--warning) 8%, var(--surface)),
        var(--surface)
      );
    }
    .level-no {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: var(--surface-3);
      font-weight: 900;
      flex: none;
    }
    .level-no.boss-no {
      background: color-mix(in srgb, var(--warning) 25%, var(--surface-3));
      font-size: 1.3rem;
    }
    .level-body {
      flex: 1;
      min-width: 0;
    }
    .level-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      flex: none;
    }
    @media (max-width: 640px) {
      .level {
        flex-wrap: wrap;
      }
      .level-side {
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
      }
      .path::before {
        display: none;
      }
    }
  `,
})
export class WorldPage {
  readonly worldId = input.required<string>();
  protected readonly progress = inject(ProgressService);
  protected readonly mentor = MENTOR;
  protected readonly wingCount = WORLDS.length;

  readonly world = computed(() => findWorld(this.worldId()));
  readonly levels = computed(() => {
    const world = this.world();
    return world ? levelsForWorld(world.id) : [];
  });
  readonly open = computed(() => {
    const world = this.world();
    return !!world && this.progress.isWingOpen(world.id);
  });
  readonly wingNumber = computed(() => {
    const world = this.world();
    return world ? wingOrder(LEVELS).indexOf(world.id) + 1 : 0;
  });
  readonly earnedStars = computed(() =>
    this.levels().reduce((sum, level) => sum + (this.progress.results()[level.id]?.stars ?? 0), 0),
  );
  readonly clearedCount = computed(
    () =>
      this.levels().filter((level) => (this.progress.results()[level.id]?.stars ?? 0) > 0).length,
  );
  readonly otherWorlds = computed(() => WORLDS.filter((world) => world.id !== this.worldId()));

  isBoss(levelId: string): boolean {
    return isBossQuest(levelId, LEVELS);
  }

  lockMessage(): string {
    const world = this.world();
    if (!world) return '';
    const order = wingOrder(LEVELS);
    const previous = order[order.indexOf(world.id) - 1];
    const boss = previous ? bossOf(previous, LEVELS) : undefined;
    const previousWorld = WORLDS.find((candidate) => candidate.id === previous);
    return boss && previousWorld
      ? `This wing is still locked. Beat ${boss.title}, the boss of ${previousWorld.wing}, and I will open the door. (Or switch on free play in the footer.)`
      : 'This wing is locked.';
  }

  questLockReason(levelId: string): string {
    if (!this.open()) {
      return 'wing locked';
    }
    const wing = this.levels();
    const index = wing.findIndex((level) => level.id === levelId);
    const previous = index > 0 ? wing[index - 1] : undefined;
    return previous ? `earn a star in ${previous.title} first` : '';
  }
}
