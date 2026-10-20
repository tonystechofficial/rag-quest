import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MENTOR } from '../../content/mentor';
import {
  findLevel,
  findWorld,
  LEVELS,
  levelsForWorld,
  previousInWing,
  WORLDS,
} from '../../content/worlds';
import { bossOf, isBossQuest, wingOrder } from '../../core/domain/progression';
import { ChallengeResult } from '../../core/models';
import { ProgressService, RecordOutcome } from '../../core/progress.service';
import { BucketSortEngine } from './engines/bucket-sort-engine';
import { ChunkLabEngine } from './engines/chunk-lab-engine';
import { ClaimCheckEngine } from './engines/claim-check-engine';
import { DirtyDataEngine } from './engines/dirty-data-engine';
import { EmbeddingEngine } from './engines/embedding-engine';
import { EstimateEngine } from './engines/estimate-engine';
import { McqEngine } from './engines/mcq-engine';
import { OrderStepsEngine } from './engines/order-steps-engine';
import { PickKEngine } from './engines/pick-k-engine';
import { TokenSelectEngine } from './engines/token-select-engine';
import { ResultPanel } from './result-panel';

@Component({
  selector: 'app-play-page',
  imports: [
    RouterLink,
    ResultPanel,
    McqEngine,
    TokenSelectEngine,
    OrderStepsEngine,
    BucketSortEngine,
    EstimateEngine,
    PickKEngine,
    ClaimCheckEngine,
    DirtyDataEngine,
    EmbeddingEngine,
    ChunkLabEngine,
  ],
  template: `
    <div class="container page stack">
      @if (level(); as lvl) {
        <nav class="row small muted" aria-label="Breadcrumb">
          <a routerLink="/">The Archive</a>
          <span>/</span>
          <a [routerLink]="['/world', lvl.world]">{{ world()?.wing }}</a>
          <span>/</span>
          <span>Quest {{ position() }} of {{ wingSize() }}</span>
        </nav>
        <header class="row row-between" style="align-items: flex-start">
          <div>
            <div class="row" style="gap: 8px">
              <h1 style="margin: 0">{{ lvl.title }}</h1>
              @if (isBoss()) {
                <span class="pill pill-warn">👑 Wing boss</span>
              }
            </div>
            <p class="muted" style="margin: 4px 0 0">{{ lvl.tagline }}</p>
          </div>
          <div class="row small">
            <span class="pill pill-{{ lvl.world }}">{{ lvl.concept }}</span>
            <span class="pill">~{{ lvl.minutes }} min</span>
            <span class="pill">{{ lvl.xp }} XP</span>
          </div>
        </header>

        @if (locked()) {
          <div class="card stack">
            <div class="mentor">
              <div class="mentor-avatar" aria-hidden="true">A</div>
              <div class="mentor-bubble">
                <span class="mentor-name">{{ mentor.name }}</span>
                {{ lockReason() }}
              </div>
            </div>
            <div class="actions" style="justify-content: flex-start">
              @if (previousQuest(); as prev) {
                <a class="btn btn-primary" [routerLink]="['/play', prev.id]"
                  >Go to {{ prev.title }}</a
                >
              }
              <a class="btn btn-ghost" [routerLink]="['/world', lvl.world]"
                >Back to {{ world()?.wing }}</a
              >
              <button type="button" class="btn btn-ghost" (click)="progress.setFreePlay(true)">
                Switch on free play
              </button>
            </div>
          </div>
        } @else if (result(); as res) {
          <app-result-panel [level]="lvl" [result]="res" [outcome]="outcome()!" (retry)="retry()" />
        } @else {
          <p class="story">{{ lvl.story }}</p>
          <div class="passage">{{ lvl.challenge.intro }}</div>
          <div class="card">
            @let c = lvl.challenge;
            @if (c.kind === 'mcq') {
              <app-mcq-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'token-select') {
              <app-token-select-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'order-steps') {
              <app-order-steps-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'bucket-sort') {
              <app-bucket-sort-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'estimate') {
              <app-estimate-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'pick-k') {
              <app-pick-k-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'claim-check') {
              <app-claim-check-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'dirty-data') {
              <app-dirty-data-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'embedding') {
              <app-embedding-engine [challenge]="c" (completed)="onCompleted($event)" />
            } @else if (c.kind === 'chunk-lab') {
              <app-chunk-lab-engine [challenge]="c" (completed)="onCompleted($event)" />
            }
          </div>
          <div class="mentor hint-box">
            <div class="mentor-avatar" aria-hidden="true">A</div>
            @if (showHint()) {
              <div class="mentor-bubble rise">
                <span class="mentor-name">{{ mentor.name }} whispers</span>
                {{ lvl.hint }}
                <div class="small faint" style="font-style: normal; margin-top: 4px">
                  Hint used: no Flawless bonus on this run.
                </div>
              </div>
            } @else {
              <button type="button" class="btn btn-ghost btn-sm" (click)="askAda()">
                {{ mentor.hintCaption }}
              </button>
            }
          </div>
        }
      } @else {
        <div class="card stack">
          <h1>Unknown quest</h1>
          <p class="muted">There is no quest at this address.</p>
          <div><a class="btn btn-primary" routerLink="/">Back to the Archive</a></div>
        </div>
      }
    </div>
  `,
  styles: `
    .story {
      font-style: italic;
      color: var(--text-muted);
      margin: 0;
    }
    .hint-box {
      align-items: center;
    }
  `,
})
export class PlayPage {
  readonly levelId = input.required<string>();

  protected readonly progress = inject(ProgressService);
  private readonly titleService = inject(Title);
  protected readonly mentor = MENTOR;

  readonly level = computed(() => findLevel(this.levelId()));
  readonly world = computed(() => {
    const level = this.level();
    return level ? findWorld(level.world) : undefined;
  });
  readonly position = computed(() => {
    const level = this.level();
    if (!level) return 0;
    return levelsForWorld(level.world).findIndex((candidate) => candidate.id === level.id) + 1;
  });
  readonly wingSize = computed(() => {
    const level = this.level();
    return level ? levelsForWorld(level.world).length : 0;
  });
  readonly isBoss = computed(() => {
    const level = this.level();
    return !!level && isBossQuest(level.id, LEVELS);
  });
  readonly locked = computed(() => {
    const level = this.level();
    return !!level && !this.progress.isUnlocked(level.id);
  });
  readonly previousQuest = computed(() => {
    const level = this.level();
    if (!level) return undefined;
    if (!this.progress.isWingOpen(level.world)) {
      const order = wingOrder(LEVELS);
      const previousWing = order[order.indexOf(level.world) - 1];
      return previousWing ? bossOf(previousWing, LEVELS) : undefined;
    }
    return previousInWing(level.id);
  });

  readonly result = signal<ChallengeResult | null>(null);
  readonly outcome = signal<RecordOutcome | null>(null);
  readonly attempt = signal(1);
  readonly showHint = signal(false);
  readonly hinted = signal(false);

  constructor() {
    effect(() => {
      const level = this.level();
      untracked(() => {
        this.result.set(null);
        this.outcome.set(null);
        this.showHint.set(false);
        this.hinted.set(false);
        this.titleService.setTitle(level ? `${level.title} · RAG Quest` : 'RAG Quest');
      });
    });
  }

  lockReason(): string {
    const level = this.level();
    if (!level) return '';
    if (!this.progress.isWingOpen(level.world)) {
      const order = wingOrder(LEVELS);
      const previousWing = order[order.indexOf(level.world) - 1];
      const boss = previousWing ? bossOf(previousWing, LEVELS) : undefined;
      const previousWorld = WORLDS.find((world) => world.id === previousWing);
      return boss && previousWorld
        ? `Not yet. ${this.world()?.wing ?? 'This wing'} opens once you beat ${boss.title}, the boss of ${previousWorld.wing}.`
        : 'This wing is locked.';
    }
    const previous = previousInWing(level.id);
    return previous
      ? `One shelf at a time. Earn at least one star in ${previous.title} and this quest unlocks.`
      : 'This quest is locked.';
  }

  askAda(): void {
    this.showHint.set(true);
    this.hinted.set(true);
  }

  onCompleted(result: ChallengeResult): void {
    const level = this.level();
    if (!level) {
      return;
    }
    this.outcome.set(this.progress.record(level, result, this.hinted()));
    this.result.set(result);
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.result.set(null);
    this.outcome.set(null);
    this.showHint.set(false);
    this.hinted.set(false);
    this.attempt.update((attempt) => attempt + 1);
  }
}
