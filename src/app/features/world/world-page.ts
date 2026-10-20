import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { findWorld, levelsForWorld, WORLDS } from '../../content/worlds';
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
          <a routerLink="/">Worlds</a>
          <span>/</span>
          <span>{{ w.name }}</span>
        </nav>
        <header class="world-header card world-{{ w.id }}">
          <div class="world-icon">{{ w.icon }}</div>
          <div style="flex: 1">
            <span class="eyebrow">World</span>
            <h1>{{ w.name }}</h1>
            <p class="muted">{{ w.tagline }} {{ w.description }}</p>
          </div>
          <div class="world-progress">
            <div class="score-big gradient-text">
              {{ earnedStars()
              }}<span class="muted" style="font-size: 1.2rem"> / {{ levels().length * 3 }} ★</span>
            </div>
            <div class="progress">
              <span [style.width.%]="(earnedStars() / (levels().length * 3)) * 100"></span>
            </div>
          </div>
        </header>

        <ol class="levels">
          @for (level of levels(); track level.id; let i = $index) {
            @let result = progress.results()[level.id];
            <li class="card level" [class.done]="result?.stars">
              <div class="level-no mono">{{ i + 1 }}</div>
              <div class="level-body">
                <div class="row" style="gap: 8px">
                  <h3 style="margin: 0">{{ level.title }}</h3>
                  <span class="pill pill-{{ w.id }}">{{ level.concept }}</span>
                </div>
                <p class="muted small" style="margin: 4px 0 0">{{ level.tagline }}</p>
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
                </div>
              </div>
              <div class="level-side">
                <app-stars [count]="result?.stars ?? 0" />
                <a
                  class="btn"
                  [class.btn-primary]="!result"
                  [class.btn-ghost]="result"
                  [routerLink]="['/play', level.id]"
                >
                  {{ result ? 'Replay' : 'Play' }}
                </a>
              </div>
            </li>
          }
        </ol>

        <div class="row" style="justify-content: center; margin-top: 12px">
          @for (other of otherWorlds(); track other.id) {
            <a class="btn btn-ghost" [routerLink]="['/world', other.id]"
              >{{ other.icon }} {{ other.name }}</a
            >
          }
        </div>
      } @else {
        <div class="card stack">
          <h1>Unknown world</h1>
          <div><a class="btn btn-primary" routerLink="/">Back to the worlds</a></div>
        </div>
      }
    </div>
  `,
  styles: `
    .world-header {
      display: flex;
      gap: 20px;
      align-items: center;
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
    .levels {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .level {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .level.done {
      border-color: color-mix(in srgb, var(--success) 40%, var(--border));
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

  readonly world = computed(() => findWorld(this.worldId()));
  readonly levels = computed(() => {
    const world = this.world();
    return world ? levelsForWorld(world.id as WorldId) : [];
  });
  readonly earnedStars = computed(() =>
    this.levels().reduce((sum, level) => sum + (this.progress.results()[level.id]?.stars ?? 0), 0),
  );
  readonly otherWorlds = computed(() => WORLDS.filter((world) => world.id !== this.worldId()));
}
