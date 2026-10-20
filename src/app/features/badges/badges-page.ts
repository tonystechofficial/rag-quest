import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENTOR } from '../../content/mentor';
import { LEVELS } from '../../content/worlds';
import { BADGES } from '../../core/domain/achievements';
import { ProgressService } from '../../core/progress.service';
import { downloadCanvas, drawCertificate } from './certificate';

@Component({
  selector: 'app-badges-page',
  imports: [RouterLink],
  template: `
    <div class="container page stack">
      <header>
        <span class="eyebrow">{{ progress.badges().length }} of {{ badges.length }} stamped</span>
        <h1>Badges</h1>
        <p style="margin: 0; max-width: 60ch">
          Feats of an Archivist, stamped on your record. Most come from playing well, a few from
          playing often.
        </p>
      </header>

      <div class="grid grid-3">
        @for (badge of badges; track badge.id) {
          @let earned = progress.hasBadge(badge.id);
          <div
            class="card badge"
            [class.earned]="earned"
            [class.lock]="!earned"
            [title]="badge.description"
          >
            <div class="seal">
              <span
                class="stamp"
                [class.stamp-ink]="!earned"
                [class.stamp-sm]="badge.title.length > 16"
                >{{ earned ? badge.title : 'Not yet' }}</span
              >
            </div>
            <div>
              <strong class="label" style="color: var(--ink); font-size: 0.95rem">{{
                badge.title
              }}</strong>
              <div class="small muted">{{ badge.description }}</div>
            </div>
          </div>
        }
      </div>

      <section class="card ruled tabbed certificate" [class.ready]="restored()">
        <span class="tab">Certificate</span>
        @if (restored()) {
          <span class="stamp stamp-corner">Restored</span>
        }
        <h2>
          {{
            restored()
              ? 'The Oracle speaks true again'
              : 'Restore the Oracle to earn your certificate'
          }}
        </h2>
        <p class="typed">
          @if (restored()) {
            {{ mentor.restored }}
          } @else {
            Earn at least one star on every card of the Archive <span class="leader">·</span>
            {{ progress.completedLevels() }} / {{ levelCount }} cleared so far.
          }
        </p>
        @if (restored()) {
          <div class="row" style="gap: 12px; align-items: flex-end; margin-top: 10px">
            <label class="stack-sm" style="gap: 4px; flex: 1; min-width: 220px">
              <span class="label">Name on the certificate</span>
              <input
                type="text"
                maxlength="40"
                placeholder="Your name"
                [value]="progress.playerName()"
                (input)="progress.setPlayerName($any($event.target).value)"
              />
            </label>
            <button type="button" class="btn btn-primary" (click)="download()">
              Download the certificate (PNG)
            </button>
          </div>
          @if (preview(); as url) {
            <img [src]="url" alt="Preview of your certificate" class="preview" />
          }
          @if (unsupported()) {
            <p class="small" style="color: var(--headrule)">
              This browser cannot draw the certificate.
            </p>
          }
        } @else {
          <div class="progress" style="margin-top: 10px">
            <span [style.width.%]="(progress.completedLevels() / levelCount) * 100"></span>
          </div>
          <div style="margin-top: 14px">
            <a class="btn btn-primary" routerLink="/">Back to the Archive</a>
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    .badge {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .badge.lock {
      opacity: 0.7;
    }
    .badge.lock .stamp {
      opacity: 0.6;
      border-style: dashed;
    }
    .badge.earned {
      border-color: var(--brass);
    }
    .seal {
      width: 120px;
      flex: none;
      display: grid;
      place-items: center;
    }
    .seal .stamp {
      font-size: 0.9rem;
      text-align: center;
      white-space: normal;
      line-height: 1.15;
      max-width: 118px;
    }
    .certificate.ready {
      border-color: var(--pencil);
    }
    .preview {
      display: block;
      width: 100%;
      max-width: 720px;
      margin-top: 14px;
      border: 1px solid var(--edge-strong);
    }
  `,
})
export class BadgesPage {
  protected readonly progress = inject(ProgressService);
  protected readonly badges = BADGES;
  protected readonly mentor = MENTOR;
  protected readonly levelCount = LEVELS.length;
  protected readonly unsupported = signal(false);

  readonly restored = computed(() => this.progress.hasBadge('oracle-restored'));
  readonly preview = computed(() => {
    if (!this.restored()) return null;
    const canvas = drawCertificate(this.data());
    return canvas ? canvas.toDataURL('image/png') : null;
  });

  download(): void {
    const canvas = drawCertificate(this.data());
    if (!canvas) {
      this.unsupported.set(true);
      return;
    }
    downloadCanvas(canvas, 'rag-quest-certificate.png');
  }

  private data() {
    return {
      name: this.progress.playerName(),
      quests: this.progress.completedLevels(),
      totalQuests: LEVELS.length,
      stars: this.progress.totalStars(),
      totalStars: LEVELS.length * 3,
      xp: this.progress.totalXp(),
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  }
}
