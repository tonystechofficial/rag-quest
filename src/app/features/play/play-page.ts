import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { findLevel, findWorld, levelsForWorld } from '../../content/worlds';
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
          <a routerLink="/">Worlds</a>
          <span>/</span>
          <a [routerLink]="['/world', lvl.world]">{{ world()?.name }}</a>
          <span>/</span>
          <span>Challenge {{ position() }}</span>
        </nav>
        <header class="row row-between" style="align-items: flex-start">
          <div>
            <h1>{{ lvl.title }}</h1>
            <p class="muted" style="margin: 0">{{ lvl.tagline }}</p>
          </div>
          <div class="row small">
            <span class="pill pill-{{ lvl.world }}">{{ lvl.concept }}</span>
            <span class="pill">~{{ lvl.minutes }} min</span>
            <span class="pill">{{ lvl.xp }} XP</span>
          </div>
        </header>

        @if (result(); as res) {
          <app-result-panel [level]="lvl" [result]="res" [outcome]="outcome()!" (retry)="retry()" />
        } @else {
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
        }
      } @else {
        <div class="card stack">
          <h1>Unknown challenge</h1>
          <p class="muted">There is no challenge at this address.</p>
          <div><a class="btn btn-primary" routerLink="/">Back to the worlds</a></div>
        </div>
      }
    </div>
  `,
})
export class PlayPage {
  readonly levelId = input.required<string>();

  private readonly progress = inject(ProgressService);
  private readonly titleService = inject(Title);

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

  readonly result = signal<ChallengeResult | null>(null);
  readonly outcome = signal<RecordOutcome | null>(null);
  readonly attempt = signal(1);

  constructor() {
    effect(() => {
      const level = this.level();
      untracked(() => {
        this.result.set(null);
        this.outcome.set(null);
        this.titleService.setTitle(level ? `${level.title} · RAG Quest` : 'RAG Quest');
      });
    });
  }

  onCompleted(result: ChallengeResult): void {
    const level = this.level();
    if (!level) {
      return;
    }
    this.outcome.set(this.progress.record(level.id, result.scorePct, level.xp));
    this.result.set(result);
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.result.set(null);
    this.outcome.set(null);
    this.attempt.update((attempt) => attempt + 1);
  }
}
