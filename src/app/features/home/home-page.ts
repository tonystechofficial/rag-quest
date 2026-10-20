import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEVELS, levelsForWorld, TOTAL_XP, WORLDS } from '../../content/worlds';
import { WorldId } from '../../core/models';
import { ProgressService } from '../../core/progress.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <section class="hero">
        <div class="hero-copy stack">
          <span class="eyebrow">Free · open source · no account · runs in your browser</span>
          <h1>Learn <span class="gradient-text">Data, NLP &amp; RAG</span> by playing.</h1>
          <p class="lead muted">
            {{ levelCount }} bite-sized challenges: count tokens, place words in an embedding space,
            tune chunking on a real document, rank retrieved passages and hunt hallucinations. Every
            round ends with a takeaway you can use at work tomorrow.
          </p>
          <div class="row">
            <a class="btn btn-primary" [routerLink]="['/play', nextToPlay().id]">
              {{ progress.completedLevels() ? 'Continue' : 'Start playing' }} →
              {{ nextToPlay().title }}
            </a>
            <a class="btn btn-ghost" routerLink="/glossary">Glossary</a>
          </div>
        </div>
        <div class="card hero-stats">
          <div class="stat">
            <span class="eyebrow">Rank</span><strong>{{ progress.rank().title }}</strong>
          </div>
          <div class="stat">
            <span class="eyebrow">XP</span
            ><strong class="mono">{{ progress.totalXp() }} / {{ totalXp }}</strong>
          </div>
          <div class="stat">
            <span class="eyebrow">Challenges</span
            ><strong>{{ progress.completedLevels() }} / {{ levelCount }}</strong>
          </div>
          <div class="stat">
            <span class="eyebrow">Stars</span
            ><strong>{{ progress.totalStars() }} / {{ levelCount * 3 }}</strong>
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
              Top rank reached — thank you for playing!
            </div>
          }
        </div>
      </section>

      <section class="stack" style="margin-top: 44px">
        <div>
          <span class="eyebrow">Three worlds, {{ levelCount }} challenges</span>
          <h2>Pick a world</h2>
        </div>
        <div class="grid grid-3">
          @for (world of worlds; track world.id) {
            @let stats = worldStats(world.id);
            <a
              class="card card-link world-card world-{{ world.id }}"
              [routerLink]="['/world', world.id]"
            >
              <div class="world-icon">{{ world.icon }}</div>
              <h3>{{ world.name }}</h3>
              <p class="muted small">{{ world.description }}</p>
              <div class="row row-between small" style="margin-top: auto">
                <span>{{ stats.levels }} challenges</span>
                <span style="color: var(--warning)"
                  >★ {{ stats.stars }} / {{ stats.levels * 3 }}</span
                >
              </div>
              <div class="progress" style="margin-top: 8px">
                <span [style.width.%]="stats.pct"></span>
              </div>
            </a>
          }
        </div>
      </section>

      <section style="margin-top: 48px">
        <div class="grid grid-3">
          <div class="card">
            <div class="step-badge">1</div>
            <h3>Play a round</h3>
            <p class="muted small">
              Interactive challenges, not slides: click tokens, drag pipeline stages, tune sliders
              on real text.
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
            <h3>Earn stars &amp; XP</h3>
            <p class="muted small">
              Three stars at 90%. Progress is saved in your browser — replay any challenge to
              improve.
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
      font-size: 1.15rem;
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
      font-size: 1.15rem;
    }
    .world-card {
      display: flex;
      flex-direction: column;
      min-height: 230px;
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
  protected readonly worlds = WORLDS;
  protected readonly levels = LEVELS;
  protected readonly levelCount = LEVELS.length;
  protected readonly totalXp = TOTAL_XP;

  readonly nextToPlay = computed(
    () => LEVELS.find((level) => !(this.progress.results()[level.id]?.stars ?? 0)) ?? LEVELS[0],
  );

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
}
