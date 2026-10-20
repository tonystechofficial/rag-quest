import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { placementScore } from '../../../core/domain/scoring';
import { cosine, euclidean, nearestNeighbors } from '../../../core/domain/similarity';
import { EmbeddedWord, EmbeddingChallenge } from '../../../core/models';
import { RoundEngine } from './round-engine';

const PALETTE = [
  'var(--success)',
  'var(--warning)',
  'var(--accent)',
  'var(--danger)',
  'var(--accent-2)',
];
const EXTENT = 1.15;

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-embedding-engine',
  imports: [DecimalPipe, LowerCasePipe],
  template: `
    <div class="stack">
      <div class="engine-header">
        <span class="pill">Word {{ index() + 1 }} / {{ total() }}</span>
        <span class="progress"><span [style.width.%]="progressPct()"></span></span>
        @if (scores().length) {
          <span class="small muted">Average: {{ averageScore() | number: '1.0-0' }}%</span>
        }
      </div>

      @let m = mystery();
      <div class="row row-between">
        <p class="prompt" style="margin: 0">
          Where does <span class="gradient-text">“{{ m.word }}”</span> belong?
        </p>
        <div class="row small" style="gap: 10px">
          @for (entry of groupEntries(); track entry[0]) {
            <span class="row" style="gap: 6px">
              <span class="dot" [style.background]="colorOf(entry[0])"></span>{{ entry[1] }}
            </span>
          }
        </div>
      </div>

      <div class="map-wrap">
        <svg
          class="map"
          [class.ready]="phase() === 'answer'"
          [attr.viewBox]="viewBox"
          role="img"
          [attr.aria-label]="'Embedding map with ' + challenge().words.length + ' words'"
          (click)="place($event)"
        >
          <line x1="-1.1" y1="0" x2="1.1" y2="0" class="axis" />
          <line x1="0" y1="-1.1" x2="0" y2="1.1" class="axis" />
          @for (word of challenge().words; track word.word) {
            <g>
              <circle
                [attr.cx]="word.x"
                [attr.cy]="-word.y"
                r="0.035"
                [attr.fill]="colorOf(word.group)"
              />
              <text [attr.x]="word.x" [attr.y]="-word.y + 0.1" class="label">{{ word.word }}</text>
            </g>
          }
          @if (guess(); as g) {
            <g>
              <circle [attr.cx]="g.x" [attr.cy]="-g.y" r="0.05" class="guess" />
              <text [attr.x]="g.x" [attr.y]="-g.y - 0.08" class="label strong">your guess</text>
            </g>
          }
          @if (phase() === 'feedback' && guess(); as g) {
            <line [attr.x1]="g.x" [attr.y1]="-g.y" [attr.x2]="m.x" [attr.y2]="-m.y" class="link" />
            <circle
              [attr.cx]="m.x"
              [attr.cy]="-m.y"
              r="0.05"
              [attr.fill]="colorOf(m.group)"
              class="truth"
            />
            <text [attr.x]="m.x" [attr.y]="-m.y + 0.12" class="label strong">{{ m.word }}</text>
          }
        </svg>
      </div>

      @if (phase() === 'answer') {
        <div class="actions">
          <span class="small muted" style="margin-right: auto">
            {{
              guess() ? 'Click again to move your guess.' : 'Click on the map to place the word.'
            }}
          </span>
          <button type="button" class="btn btn-primary" [disabled]="!guess()" (click)="check()">
            Lock in
          </button>
        </div>
      } @else {
        <div
          class="feedback"
          [class.good]="roundScore() >= 90"
          [class.info]="roundScore() >= 60 && roundScore() < 90"
          [class.bad]="roundScore() < 60"
        >
          <div class="feedback-title">
            Distance {{ distance() | number: '1.2-2' }} → {{ roundScore() }} points. “{{ m.word }}”
            lives with the {{ challenge().groups[m.group] | lowercase }}.
          </div>
          <p class="small">
            Nearest neighbours of “{{ m.word }}” — what a vector database would return for top-3:
          </p>
          <div class="row" style="gap: 8px">
            @for (n of neighbours(); track n.id) {
              <span class="pill mono"
                >{{ n.id }} · dist {{ n.score | number: '1.2-2' }} · cos
                {{ n.cosine | number: '1.2-2' }}</span
              >
            }
          </div>
          <p class="small muted" style="margin-top: 8px">
            Distance (euclidean) and cosine similarity are the two usual ways to compare vectors;
            cosine only looks at the direction, which is why words in the same quadrant score close
            to 1.
          </p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="next()">
            {{ isLast() ? 'See results' : 'Next word' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .map-wrap {
      display: flex;
      justify-content: center;
    }
    .map {
      width: 100%;
      max-width: 560px;
      aspect-ratio: 1;
      background: radial-gradient(circle at center, var(--surface-2), var(--surface));
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: var(--font);
    }
    .map.ready {
      cursor: crosshair;
    }
    .axis {
      stroke: var(--border);
      stroke-width: 0.006;
    }
    .label {
      font-size: 0.075px;
      fill: var(--text-muted);
      text-anchor: middle;
      pointer-events: none;
    }
    .label.strong {
      fill: var(--text);
      font-weight: 700;
    }
    .guess {
      fill: none;
      stroke: var(--text);
      stroke-width: 0.012;
      stroke-dasharray: 0.03 0.02;
    }
    .truth {
      stroke: var(--text);
      stroke-width: 0.01;
    }
    .link {
      stroke: var(--text-muted);
      stroke-width: 0.008;
      stroke-dasharray: 0.03 0.03;
    }
    .dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  `,
})
export class EmbeddingEngine extends RoundEngine {
  readonly challenge = input.required<EmbeddingChallenge>();
  override readonly total = computed(() => this.challenge().mystery.length);
  readonly mystery = computed(() => this.challenge().mystery[this.index()]);
  readonly guess = signal<Point | null>(null);
  readonly viewBox = `${-EXTENT} ${-EXTENT} ${2 * EXTENT} ${2 * EXTENT}`;

  readonly groupEntries = computed(() => Object.entries(this.challenge().groups));
  readonly distance = computed(() => {
    const g = this.guess();
    const m = this.mystery();
    return g ? euclidean([g.x, g.y], [m.x, m.y]) : 0;
  });
  readonly neighbours = computed(() => {
    const m = this.mystery();
    const items = this.challenge().words.map((word) => ({
      id: word.word,
      vector: [word.x, word.y],
    }));
    return nearestNeighbors([m.x, m.y], items, 3, 'euclidean').map((n) => ({
      ...n,
      cosine: cosine([m.x, m.y], this.vectorOf(n.id)),
    }));
  });

  colorOf(group: string): string {
    const index = Object.keys(this.challenge().groups).indexOf(group);
    return PALETTE[index % PALETTE.length];
  }

  place(event: MouseEvent): void {
    if (this.phase() !== 'answer') {
      return;
    }
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 * EXTENT - EXTENT;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 * EXTENT - EXTENT);
    this.guess.set({ x: clamp(x), y: clamp(y) });
  }

  check(): void {
    if (!this.guess()) {
      return;
    }
    this.reveal(placementScore(this.distance()));
  }

  protected override onRoundStart(): void {
    this.guess.set(null);
  }

  protected override feats(): string[] {
    return this.scores().some((score) => score === 100) ? ['bullseye'] : [];
  }

  protected override summary(): string {
    return `Average placement score of ${Math.round(this.averageScore())}% over ${this.total()} words`;
  }

  private vectorOf(word: string): number[] {
    const found: EmbeddedWord | undefined = this.challenge().words.find((w) => w.word === word);
    return found ? [found.x, found.y] : [0, 0];
  }
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}
