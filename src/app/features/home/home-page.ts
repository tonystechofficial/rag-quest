import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENTOR } from '../../content/mentor';
import { LEVELS, levelsForWorld, TOTAL_XP, WORLDS } from '../../content/worlds';
import { BADGES } from '../../core/domain/achievements';
import { bossOf, wingOrder } from '../../core/domain/progression';
import { WorldId } from '../../core/models';
import { ProgressService } from '../../core/progress.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <section class="hero">
        <div class="hero-copy stack">
          <span class="eyebrow"
            >A game about data, language and retrieval · free · open source</span
          >
          <h1>
            The Oracle is <span class="gradient-text">hallucinating</span>. Restore the Archive.
          </h1>
          <p class="lead muted">
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
                {{ progress.completedLevels() ? 'Continue' : 'Start playing' }} → {{ next.title }}
              </a>
            } @else {
              <a class="btn btn-primary" routerLink="/badges">Archive restored — see your badges</a>
            }
            <a class="btn btn-ghost" routerLink="/glossary">Glossary</a>
          </div>
        </div>

        <div class="card hero-stats">
          <div class="eyebrow" style="grid-column: 1 / -1">Quest log</div>
          <div class="stat">
            <span class="eyebrow">Rank</span><strong>{{ progress.rank().title }}</strong>
          </div>
          <div class="stat">
            <span class="eyebrow">XP</span
            ><strong class="mono">{{ progress.totalXp() }} / {{ totalXp }}</strong>
          </div>
          <div class="stat">
            <span class="eyebrow">Stars</span
            ><strong>★ {{ progress.totalStars() }} / {{ levelCount * 3 }}</strong>
          </div>
          <div class="stat">
            <span class="eyebrow">Badges</span
            ><a routerLink="/badges"
              ><strong>🏅 {{ progress.badges().length }} / {{ badgeCount }}</strong></a
            >
          </div>
          <div class="stat">
            <span class="eyebrow">Streak</span
            ><strong>{{
              progress.streak() > 0
                ? '🔥 ' + progress.streak() + ' day' + (progress.streak() > 1 ? 's' : '')
                : '—'
            }}</strong>
          </div>
          <div class="stat">
            <span class="eyebrow">Quests cleared</span
            ><strong>{{ progress.completedLevels() }} / {{ levelCount }}</strong>
          </div>
          <div class="progress" style="grid-column: 1 / -1">
            <span [style.width.%]="(progress.totalXp() / totalXp) * 100"></span>
          </div>
          @if (progress.rank().next; as next) {
            <div class="small faint" style="grid-column: 1 / -1">
              {{ next.minXp - progress.totalXp() }} XP to {{ next.title }}
            </div>
          } @else {
            <div class="small faint" style="grid-column: 1 / -1">
              Top rank reached. {{ mentor.restored }}
            </div>
          }
        </div>
      </section>

      <section class="stack" style="margin-top: 44px">
        <div>
          <span class="eyebrow"
            >Three wings, {{ levelCount }} quests · beat a wing's boss to open the next</span
          >
          <h2>The Archive</h2>
        </div>
        <div class="grid grid-3">
          @for (world of worlds; track world.id) {
            @let stats = worldStats(world.id);
            @let open = progress.isWingOpen(world.id);
            <a
              class="card card-link world-card world-{{ world.id }}"
              [class.lock]="!open"
              [routerLink]="['/world', world.id]"
            >
              <div class="row row-between">
                <div class="world-icon">{{ world.icon }}</div>
                @if (!open) {
                  <span class="pill">🔒 Locked</span>
                } @else if (stats.stars === stats.levels * 3) {
                  <span class="pill pill-good">Mastered</span>
                } @else if (stats.stars > 0) {
                  <span class="pill pill-{{ world.id }}">In progress</span>
                }
              </div>
              <span class="eyebrow">{{ world.name }}</span>
              <h3>{{ world.wing }}</h3>
              <p class="muted small">{{ world.description }}</p>
              <div class="row row-between small" style="margin-top: auto">
                <span>{{ stats.levels }} quests</span>
                <span style="color: var(--warning)"
                  >★ {{ stats.stars }} / {{ stats.levels * 3 }}</span
                >
              </div>
              <div class="progress" style="margin-top: 8px">
                <span [style.width.%]="stats.pct"></span>
              </div>
              @if (!open) {
                <p class="small faint" style="margin: 8px 0 0">{{ unlockHint(world.id) }}</p>
              }
            </a>
          }
        </div>
      </section>

      <section style="margin-top: 48px">
        <div class="grid grid-3">
          <div class="card">
            <div class="step-badge">1</div>
            <h3>Play a quest</h3>
            <p class="muted small">
              Hands-on puzzles, not slides: click tokens, drag pipeline stages, tune sliders on a
              real document. Stuck? Ask Ada for a hint.
            </p>
          </div>
          <div class="card">
            <div class="step-badge">2</div>
            <h3>Read the why</h3>
            <p class="muted small">
              Every answer comes with an explanation and the real numbers behind it: TF-IDF tables,
              distances, retrieval scores.
            </p>
          </div>
          <div class="card">
            <div class="step-badge">3</div>
            <h3>Earn stars, XP and badges</h3>
            <p class="muted small">
              Three stars at 90%. Bonuses for first-try perfection and flawless runs,
              {{ badgeCount }}
              badges to collect, a certificate when the Oracle is restored.
            </p>
          </div>
        </div>
      </section>

      <section style="margin-top: 48px">
        <div class="card">
          <div class="eyebrow">Concepts you will practice</div>
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
      grid-template-columns: 1.4fr 1fr;
      gap: 28px;
      align-items: center;
      padding-top: 24px;
    }
    .lead {
      font-size: 1.1rem;
      max-width: 60ch;
    }
    .hero-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 18px;
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat strong {
      font-size: 1.05rem;
    }
    .stat a {
      color: inherit;
    }
    .world-card {
      display: flex;
      flex-direction: column;
      min-height: 250px;
    }
    .world-card.lock {
      opacity: 0.75;
    }
    .world-card.lock .world-icon {
      filter: grayscale(1);
    }
    .world-icon {
      font-size: 1.8rem;
      width: 54px;
      height: 54px;
      display: grid;
      place-items: center;
      border-radius: 16px;
      background: var(--surface-3);
      margin-bottom: 12px;
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
    .step-badge {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-weight: 900;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: #07101f;
      margin-bottom: 12px;
    }
    a.pill:hover {
      text-decoration: none;
      filter: brightness(1.2);
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

  unlockHint(worldId: WorldId): string {
    const order = wingOrder(LEVELS);
    const previous = order[order.indexOf(worldId) - 1];
    const boss = previous ? bossOf(previous, LEVELS) : undefined;
    const previousWorld = WORLDS.find((world) => world.id === previous);
    return boss && previousWorld
      ? `Beat ${boss.title}, the boss of ${previousWorld.wing}, to open this wing.`
      : '';
  }
}
