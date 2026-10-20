import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENTOR } from '../../content/mentor';
import { LEVELS, levelsForWorld, TOTAL_XP, WORLDS } from '../../content/worlds';
import { BADGES } from '../../core/domain/achievements';
import { bossOf, wingOrder } from '../../core/domain/progression';
import { WorldId } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, Icon],
  template: `
    <div class="container page">
      <section class="hero">
        <div class="hero-copy stack">
          <span class="eyebrow">Catalogue of the Archive · free · open source · no account</span>
          <h1>
            The Oracle is <span class="gradient-text">hallucinating</span>.<br />Restore the
            Archive.
          </h1>
          <p class="lead">
            {{ levelCount }} quests across three wings: clean the Data Vault, teach the Language
            Hall to read, rebuild the Retrieval Engine. Each quest is a hands-on puzzle with the
            real numbers behind it, and ends with a takeaway you can use at work tomorrow.
          </p>
          <div class="mentor">
            <div class="mentor-avatar" aria-hidden="true">A</div>
            <div class="mentor-bubble">
              <span class="mentor-name">{{ mentor.name }}, {{ mentor.role }}</span>
              {{ mentor.welcome }}
            </div>
          </div>
          <div class="row">
            @if (progress.nextQuest(); as next) {
              <a class="btn btn-primary" [routerLink]="['/play', next.id]">
                {{ progress.completedLevels() ? 'Continue' : 'Start playing' }}
                <app-icon name="arrow-right" /> {{ next.title }}
              </a>
            } @else {
              <a class="btn btn-primary" routerLink="/badges">Archive restored, see your badges</a>
            }
            <a class="btn btn-ghost" routerLink="/glossary">Glossary</a>
          </div>
        </div>

        <aside class="card ruled tabbed quest-log">
          <span class="tab">Quest log · apprentice record</span>
          <p class="typed">
            Rank <span class="leader">..........</span> <b>{{ progress.rank().title }}</b>
          </p>
          <p class="typed">
            Experience <span class="leader">....</span>
            <b>{{ progress.totalXp() }} / {{ totalXp }} XP</b>
          </p>
          <p class="typed">
            Stars <span class="leader">.........</span>
            <b>{{ progress.totalStars() }} / {{ levelCount * 3 }}</b>
          </p>
          <p class="typed">
            Badges <span class="leader">........</span>
            <a routerLink="/badges">{{ progress.badges().length }} / {{ badgeCount }}</a>
          </p>
          <p class="typed">
            Streak <span class="leader">........</span>
            {{
              progress.streak() > 0
                ? progress.streak() + ' day' + (progress.streak() > 1 ? 's' : '')
                : 'none yet'
            }}
          </p>
          <p class="typed">
            Quests cleared <span class="leader">.</span>
            <b>{{ progress.completedLevels() }} / {{ levelCount }}</b>
          </p>
          <div class="progress" style="margin-top: 10px">
            <span [style.width.%]="(progress.totalXp() / totalXp) * 100"></span>
          </div>
          @if (progress.rank().next; as next) {
            <p class="typed small faint">
              {{ next.minXp - progress.totalXp() }} XP to {{ next.title }}
            </p>
          } @else {
            <p class="typed small faint">Top rank reached.</p>
          }
        </aside>
      </section>

      <section class="stack" style="margin-top: 44px">
        <div>
          <span class="eyebrow"
            >Three wings, {{ levelCount }} quests · beat a wing's boss to open the next</span
          >
          <h2>The drawers of the Archive</h2>
        </div>
        <div class="grid grid-3 wings">
          @for (world of worlds; track world.id) {
            @let stats = worldStats(world.id);
            @let open = progress.isWingOpen(world.id);
            <a
              class="card tabbed card-link world-card world-{{ world.id }}"
              [class.lock]="!open"
              [routerLink]="['/world', world.id]"
            >
              <span class="tab">{{ world.name }}</span>
              @if (!open) {
                <span class="stamp stamp-ink stamp-sm stamp-corner">Locked</span>
              } @else if (stats.stars === stats.levels * 3) {
                <span class="stamp stamp-green stamp-sm stamp-corner">Complete</span>
              } @else if (stats.stars > 0) {
                <span class="stamp stamp-brass stamp-sm stamp-corner">In progress</span>
              }
              <div class="world-icon"><app-icon [name]="world.icon" /></div>
              <h3>{{ world.wing }}</h3>
              <p class="small">{{ world.description }}</p>
              <p class="typed small" style="margin-top: auto">
                {{ stats.levels }} quests <span class="leader">·</span>
                <span class="stars">{{ starsText(stats.stars, stats.levels * 3) }}</span>
              </p>
              <div class="progress"><span [style.width.%]="stats.pct"></span></div>
              @if (!open) {
                <p class="small faint" style="margin: 8px 0 0">{{ unlockHint(world.id) }}</p>
              }
            </a>
          }
        </div>
      </section>

      <section style="margin-top: 48px" class="grid grid-2">
        <div class="card ruled tabbed">
          <span class="tab">Instructions for apprentices</span>
          <p class="typed">
            1. Pull a card and play its rounds: click tokens, drag pipeline stages, tune sliders on
            real text.
          </p>
          <p class="typed">
            2. Read the why. Every answer comes with the rule and the real numbers behind it.
          </p>
          <p class="typed">
            3. Earn stars, XP and badges. Three stars at 90%. Stuck? Ask Ada for a hint.
          </p>
        </div>
        <div class="card">
          <span class="eyebrow">Concepts you will practice</span>
          <div class="row" style="margin-top: 10px; gap: 8px">
            @for (level of levels; track level.id) {
              <a class="pill pill-{{ level.world }}" [routerLink]="['/play', level.id]">{{
                level.concept
              }}</a>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    .hero {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 32px;
      align-items: start;
      padding-top: 24px;
    }
    .lead {
      font-size: 1.12rem;
      max-width: 58ch;
    }
    .quest-log {
      margin-top: 26px;
    }
    .quest-log a {
      color: var(--pen-blue);
    }
    .world-card {
      display: flex;
      flex-direction: column;
      min-height: 260px;
      padding-top: 24px;
    }
    .world-card.lock {
      opacity: 0.8;
    }
    .world-icon {
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      border: 1.5px solid var(--ink);
      background: var(--card-2);
      margin-bottom: 10px;
      font-size: 1.4rem;
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
    .world-card h3 {
      margin-bottom: 4px;
    }
    a.pill {
      text-decoration: none;
    }
    a.pill:hover {
      background: var(--card);
    }
    @media (max-width: 860px) {
      .hero {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class HomePage {
  protected readonly progress = inject(ProgressService);
  protected readonly mentor = MENTOR;
  protected readonly worlds = WORLDS;
  protected readonly levels = LEVELS;
  protected readonly levelCount = LEVELS.length;
  protected readonly totalXp = TOTAL_XP;
  protected readonly badgeCount = BADGES.length;

  worldStats(worldId: WorldId): { levels: number; stars: number; pct: number } {
    const levels = levelsForWorld(worldId);
    const stars = levels.reduce(
      (sum, level) => sum + (this.progress.results()[level.id]?.stars ?? 0),
      0,
    );
    return {
      levels: levels.length,
      stars,
      pct: levels.length ? (stars / (levels.length * 3)) * 100 : 0,
    };
  }

  starsText(earned: number, total: number): string {
    return `${earned} / ${total} ★`;
  }

  unlockHint(worldId: WorldId): string {
    const order = wingOrder(LEVELS);
    const previous = order[order.indexOf(worldId) - 1];
    const boss = previous ? bossOf(previous, LEVELS) : undefined;
    const previousWorld = WORLDS.find((world) => world.id === previous);
    return boss && previousWorld
      ? `Beat ${boss.title}, the boss of ${previousWorld.wing}, to open this drawer.`
      : '';
  }
}
