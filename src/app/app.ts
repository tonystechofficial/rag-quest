import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BADGES } from './core/domain/achievements';
import { ProgressService } from './core/progress.service';
import { Icon } from './shared/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="topbar">
      <div class="container topbar-inner">
        <a routerLink="/" class="brand" aria-label="RAG Quest home">
          <span class="plate"><app-icon name="drawer" /> RAG Quest</span>
          <span class="brand-sub">Catalogue of the Archive</span>
        </a>
        <nav class="nav" aria-label="Main">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
            >Archive</a
          >
          <a routerLink="/badges" routerLinkActive="active">Badges</a>
          <a routerLink="/glossary" routerLinkActive="active">Glossary</a>
          <a href="https://github.com/tonystechofficial/rag-quest" target="_blank" rel="noopener"
            >GitHub</a
          >
        </nav>
        <div class="status">
          @if (progress.streak() > 0) {
            <span class="pill pill-warn" title="Days played in a row"
              ><app-icon name="flame" /> {{ progress.streak() }}</span
            >
          }
          <a class="pill" routerLink="/badges" title="Badges earned"
            ><app-icon name="medal" /> {{ progress.badges().length }} / {{ badgeCount }}</a
          >
          <div class="xp" title="Your rank and experience points">
            <span class="xp-rank">{{ progress.rank().title }}</span>
            <span class="xp-value mono">{{ progress.totalXp() }} XP</span>
            <span class="progress xp-bar" aria-hidden="true"
              ><span [style.width.%]="progress.rank().progress * 100"></span
            ></span>
          </div>
        </div>
      </div>
    </header>

    <main id="main"><router-outlet /></main>

    <footer class="footer">
      <div class="container footer-inner small">
        <span class="mono">
          RAG Quest · open source under the MIT license ·
          <a href="https://github.com/tonystechofficial/rag-quest" target="_blank" rel="noopener"
            >source on GitHub</a
          >
        </span>
        <span class="row" style="gap: 12px">
          <label
            class="row label"
            style="gap: 6px; cursor: pointer"
            title="Unlock every quest and wing"
          >
            <input
              type="checkbox"
              [checked]="progress.freePlay()"
              (change)="progress.setFreePlay($any($event.target).checked)"
              style="accent-color: var(--brass)"
            />
            Free play
          </label>
          <span class="muted">Progress is kept in this browser only.</span>
          @if (confirmReset()) {
            <button
              type="button"
              class="btn btn-sm"
              style="border-color: var(--headrule); color: var(--headrule)"
              (click)="reset()"
            >
              Yes, erase my progress
            </button>
            <button type="button" class="btn btn-sm btn-ghost" (click)="confirmReset.set(false)">
              Cancel
            </button>
          } @else {
            <button type="button" class="btn btn-sm btn-ghost" (click)="confirmReset.set(true)">
              Reset progress
            </button>
          }
        </span>
      </div>
    </footer>

    <div class="toasts" aria-live="polite">
      @for (toast of progress.toasts(); track toast.id) {
        <div class="toast" role="status">
          <span class="stamp stamp-sm">Badge</span>
          <div style="flex: 1; min-width: 0">
            <strong class="label" style="color: var(--ink)">{{ toast.title }}</strong>
            <div class="small muted">{{ toast.text }}</div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-icon btn-sm"
            aria-label="Dismiss"
            (click)="progress.dismissToast(toast.id)"
          >
            <app-icon name="x" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .skip-link {
      position: absolute;
      left: -999px;
      top: 8px;
      background: var(--ink);
      color: var(--card);
      padding: 8px 12px;
      z-index: 100;
    }
    .skip-link:focus {
      left: 8px;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--card-3);
      border-bottom: 3px double var(--ink-2);
    }
    .topbar-inner {
      display: flex;
      align-items: center;
      gap: 22px;
      min-height: 66px;
    }
    .brand {
      display: flex;
      flex-direction: column;
      gap: 1px;
      color: var(--ink);
      text-decoration: none;
    }
    .plate {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-label);
      font-weight: 700;
      font-size: 1.25rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 10px;
      border: 1.5px solid var(--brass);
      background: var(--card);
      color: var(--ink);
      box-shadow: 1px 1px 0 var(--brass);
    }
    .brand-sub {
      font-family: var(--mono);
      font-size: 0.72rem;
      color: var(--ink-2);
      padding-left: 2px;
    }
    .nav {
      display: flex;
      gap: 2px;
      flex: 1;
    }
    .nav a {
      font-family: var(--font-label);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.95rem;
      color: var(--ink-2);
      text-decoration: none;
      padding: 6px 12px;
      border-bottom: 3px solid transparent;
    }
    .nav a:hover {
      color: var(--ink);
    }
    .nav a.active {
      color: var(--ink);
      border-bottom-color: var(--headrule);
    }
    .status {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status a.pill {
      text-decoration: none;
    }
    .xp {
      display: grid;
      grid-template-columns: auto auto;
      gap: 2px 10px;
      align-items: center;
      font-size: 0.85rem;
    }
    .xp-rank {
      font-family: var(--font-label);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .xp-value {
      color: var(--ink-2);
      text-align: right;
    }
    .xp-bar {
      grid-column: 1 / -1;
      height: 5px;
    }
    main {
      min-height: calc(100vh - 66px - 90px);
    }
    .footer {
      border-top: 1px solid var(--edge-strong);
      padding: 20px 0 28px;
      margin-top: 24px;
    }
    .footer-inner {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
    }
    @media (max-width: 760px) {
      .topbar-inner {
        flex-wrap: wrap;
        gap: 8px 16px;
        padding: 10px 0;
      }
      .nav {
        order: 3;
        width: 100%;
        flex-wrap: wrap;
      }
      .status {
        margin-left: auto;
      }
    }
  `,
})
export class App {
  protected readonly progress = inject(ProgressService);
  protected readonly confirmReset = signal(false);
  protected readonly badgeCount = BADGES.length;

  protected reset(): void {
    this.progress.reset();
    this.confirmReset.set(false);
  }
}
