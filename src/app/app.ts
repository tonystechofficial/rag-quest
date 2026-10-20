import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BADGES } from './core/domain/achievements';
import { ProgressService } from './core/progress.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="topbar">
      <div class="container topbar-inner">
        <a routerLink="/" class="brand" aria-label="RAG Quest home">
          <img src="favicon.svg" alt="" width="28" height="28" />
          <span>RAG <span class="gradient-text">Quest</span></span>
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
              >🔥 {{ progress.streak() }}</span
            >
          }
          <a class="pill" routerLink="/badges" title="Badges earned"
            >🏅 {{ progress.badges().length }} / {{ badgeCount }}</a
          >
          <div class="xp" title="Your rank and experience points">
            <span class="xp-rank">{{ progress.rank().title }}</span>
            <span class="xp-value mono">{{ progress.totalXp() }} XP</span>
            <span class="progress xp-bar" aria-hidden="true">
              <span [style.width.%]="progress.rank().progress * 100"></span>
            </span>
          </div>
        </div>
      </div>
    </header>

    <main id="main"><router-outlet /></main>

    <footer class="footer">
      <div class="container footer-inner small muted">
        <span>
          RAG Quest · open source under the MIT license ·
          <a href="https://github.com/tonystechofficial/rag-quest" target="_blank" rel="noopener"
            >source on GitHub</a
          >
        </span>
        <span class="row" style="gap: 12px">
          <label class="row" style="gap: 6px; cursor: pointer" title="Unlock every quest and wing">
            <input
              type="checkbox"
              [checked]="progress.freePlay()"
              (change)="progress.setFreePlay($any($event.target).checked)"
              style="accent-color: var(--accent)"
            />
            Free play
          </label>
          <span>Progress is saved in this browser only.</span>
          @if (confirmReset()) {
            <button
              type="button"
              class="btn btn-sm"
              style="border-color: var(--danger); color: var(--danger)"
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
          <span class="toast-icon" aria-hidden="true">{{ toast.icon }}</span>
          <div style="flex: 1">
            <strong>{{ toast.title }}</strong>
            <div class="small muted">{{ toast.text }}</div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-icon btn-sm"
            aria-label="Dismiss"
            (click)="progress.dismissToast(toast.id)"
          >
            ✕
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
      background: var(--accent);
      color: #07101f;
      padding: 8px 12px;
      border-radius: 8px;
      z-index: 100;
    }
    .skip-link:focus {
      left: 8px;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(14px);
      background: color-mix(in srgb, var(--bg) 78%, transparent);
      border-bottom: 1px solid var(--border);
    }
    .topbar-inner {
      display: flex;
      align-items: center;
      gap: 20px;
      min-height: 64px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 900;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    .brand:hover {
      text-decoration: none;
    }
    .nav {
      display: flex;
      gap: 4px;
      flex: 1;
    }
    .nav a {
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.95rem;
    }
    .nav a:hover {
      color: var(--text);
      text-decoration: none;
      background: var(--surface-2);
    }
    .nav a.active {
      color: var(--text);
      background: var(--surface-3);
    }
    .status {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status a.pill:hover {
      text-decoration: none;
      filter: brightness(1.2);
    }
    .xp {
      display: grid;
      grid-template-columns: auto auto;
      gap: 2px 10px;
      align-items: center;
      font-size: 0.85rem;
    }
    .xp-rank {
      font-weight: 700;
    }
    .xp-value {
      color: var(--text-muted);
      text-align: right;
    }
    .xp-bar {
      grid-column: 1 / -1;
      height: 5px;
    }
    main {
      min-height: calc(100vh - 64px - 90px);
    }
    .footer {
      border-top: 1px solid var(--border);
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
    @media (max-width: 720px) {
      .topbar-inner {
        flex-wrap: wrap;
        gap: 8px 16px;
        padding: 10px 0;
      }
      .nav {
        order: 3;
        width: 100%;
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
