import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENTOR } from '../../content/mentor';
import { findWorld, LEVELS, levelsForWorld, WORLDS } from '../../content/worlds';
import { bossOf, isBossQuest, wingOrder } from '../../core/domain/progression';
import { ProgressService } from '../../core/progress.service';
import { Icon } from '../../shared/icon';
import { Stars } from '../../shared/stars';

@Component({
  selector: 'app-world-page',
  imports: [RouterLink, Stars, Icon],
  template: `
    <div class="container page stack">
      @if (world(); as w) {
        <nav class="row small mono" aria-label="Breadcrumb">
          <a routerLink="/">The Archive</a>
          <span class="faint">/</span>
          <span>{{ w.wing }}</span>
        </nav>
        <header class="card tabbed world-header world-{{ w.id }}">
          <span class="tab">{{ w.name }} · wing {{ wingNumber() }} of {{ wingCount }}</span>
          <div class="world-icon" [class.lock]="!open()"><app-icon [name]="w.icon" /></div>
          <div style="flex: 1; min-width: 0">
            <h1>{{ w.wing }}</h1>
            <p>{{ w.story }}</p>
            <div class="mentor">
              <div class="mentor-avatar" aria-hidden="true">A</div>
              <div class="mentor-bubble">
                <span class="mentor-name">{{ mentor.name }}</span>
                {{ open() ? w.mentorIntro : lockMessage() }}
              </div>
            </div>
          </div>
          <div class="world-progress">
            <p class="typed">
              <b>{{ earnedStars() }}</b> / {{ levels().length * 3 }} <span class="stars">★</span>
            </p>
            <div class="progress">
              <span [style.width.%]="(earnedStars() / (levels().length * 3)) * 100"></span>
            </div>
            <p class="typed small faint">
              {{ clearedCount() }} / {{ levels().length }} cards cleared
            </p>
          </div>
        </header>

        <ol class="path">
          @for (level of levels(); track level.id; let i = $index) {
            @let result = progress.results()[level.id];
            @let unlocked = progress.isUnlocked(level.id);
            @let boss = isBoss(level.id);
            <li
              class="card tabbed level"
              [class.done]="result?.stars"
              [class.lock]="!unlocked"
              [class.boss]="boss"
            >
              <span class="tab">Card {{ i + 1 }} · {{ level.concept }}</span>
              @if (boss) {
                <span class="stamp stamp-brass stamp-sm stamp-corner">Wing boss</span>
              } @else if (result?.stars === 3) {
                <span class="stamp stamp-green stamp-sm stamp-corner">Complete</span>
              }
              <div class="level-no mono">
                @if (!unlocked) {
                  <app-icon name="lock" />
                } @else if (boss) {
                  <app-icon name="crown" />
                } @else {
                  {{ i + 1 }}
                }
              </div>
              <div class="level-body">
                <h3 style="margin: 0">{{ level.title }}</h3>
                <p class="small" style="margin: 4px 0 0">
                  {{ unlocked ? level.story : level.tagline }}
                </p>
                <p class="typed small faint" style="margin-top: 6px">
                  ~{{ level.minutes }} min <span class="leader">·</span> {{ level.xp }} XP
                  @if (result) {
                    <span class="leader">·</span> best {{ result.bestScore }}%
                    <span class="leader">·</span> {{ result.attempts }} attempt{{
                      result.attempts === 1 ? '' : 's'
                    }}
                  }
                  @if (!unlocked) {
                    <span class="leader">·</span>
                    <span style="color: var(--headrule)">{{ questLockReason(level.id) }}</span>
                  }
                </p>
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
                    {{ result ? 'Replay' : boss ? 'Face the boss' : 'Pull the card' }}
                  </a>
                } @else {
                  <span class="btn" aria-disabled="true"><app-icon name="lock" /> Locked</span>
                }
              </div>
            </li>
          }
        </ol>

        <div class="row" style="justify-content: center; margin-top: 12px">
          @for (other of otherWorlds(); track other.id) {
            <a class="btn btn-ghost" [routerLink]="['/world', other.id]">
              <app-icon [name]="progress.isWingOpen(other.id) ? other.icon : 'lock'" />
              {{ other.wing }}
            </a>
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
      padding-top: 26px;
    }
    .world-icon {
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      border: 1.5px solid var(--ink);
      background: var(--card-2);
      font-size: 1.9rem;
      flex: none;
    }
    .world-data .world-icon {
      color: var(--world-data);
      border-color: var(--world-data);
    }
    .world-nlp .world-icon {
      color: var(--world-nlp);
      border-color: var(--world-nlp);
    }
    .world-rag .world-icon {
      color: var(--world-rag);
      border-color: var(--world-rag);
    }
    .world-progress {
      min-width: 200px;
    }
    .path {
      list-style: none;
      margin: 10px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .level {
      display: flex;
      gap: 16px;
      align-items: center;
      padding-top: 24px;
    }
    .level.done {
      border-color: var(--pencil);
    }
    .level.lock {
      opacity: 0.78;
    }
    .level.boss {
      background: var(--card-2);
      border-color: var(--brass);
    }
    .level-no {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1.5px solid var(--ink);
      background: var(--card-2);
      font-weight: 700;
      font-size: 1.1rem;
      flex: none;
    }
    .level.lock .level-no {
      border-style: dashed;
      color: var(--ink-2);
    }
    .level.boss .level-no {
      color: var(--brass);
      border-color: var(--brass);
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
      ? `This drawer is still locked. Beat ${boss.title}, the boss of ${previousWorld.wing}, and I will open it. (Or switch on free play in the footer.)`
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
