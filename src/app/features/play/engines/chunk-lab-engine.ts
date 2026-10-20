import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { evaluateChunking } from '../../../core/domain/chunk-lab';
import { starsForScore } from '../../../core/domain/scoring';
import { ChallengeResult, ChunkLabChallenge } from '../../../core/models';
import { Stars } from '../../../shared/stars';

@Component({
  selector: 'app-chunk-lab-engine',
  imports: [DecimalPipe, PercentPipe, Stars],
  template: `
    <div class="stack">
      <div class="grid grid-2">
        <div class="card-soft stack-sm">
          <label class="row row-between" for="size">
            <span><strong>Chunk size</strong> <span class="muted small">(words)</span></span>
            <span class="mono" style="font-weight: 800">{{ size() }}</span>
          </label>
          <input
            id="size"
            type="range"
            min="10"
            max="300"
            step="10"
            [value]="size()"
            (input)="size.set(+$any($event.target).value)"
          />
          <div class="row row-between small faint">
            <span>10 — precise but fragmented</span><span>300 — whole document</span>
          </div>
        </div>
        <div class="card-soft stack-sm">
          <label class="row row-between" for="overlap">
            <span
              ><strong>Overlap</strong> <span class="muted small">(% of the chunk size)</span></span
            >
            <span class="mono" style="font-weight: 800"
              >{{ overlapPct() }}% = {{ overlapWords() }} words</span
            >
          </label>
          <input
            id="overlap"
            type="range"
            min="0"
            max="50"
            step="5"
            [value]="overlapPct()"
            (input)="overlapPct.set(+$any($event.target).value)"
          />
          <div class="row row-between small faint">
            <span>0 — hard cuts</span><span>50 — every sentence appears twice</span>
          </div>
        </div>
      </div>

      @let rep = report();
      <div class="row">
        <span class="pill">{{ rep.chunks.length }} chunks</span>
        <span class="pill">{{ rep.documentWords }} words in the document</span>
        <span class="pill">top-2 chunks retrieved per question</span>
        <span
          class="pill"
          [class.pill-good]="rep.hits === rep.results.length"
          [class.pill-warn]="rep.hits < rep.results.length"
        >
          {{ rep.hits }} / {{ rep.results.length }} questions answerable
        </span>
        <span class="pill">efficiency {{ rep.efficiency | percent: '1.0-0' }}</span>
      </div>

      <div class="grid grid-2">
        <div class="stack-sm">
          <div class="eyebrow">
            Customer questions — click one to highlight its retrieved chunks
          </div>
          @for (result of rep.results; track $index) {
            <button
              type="button"
              class="option"
              [class.selected]="selected() === $index"
              [class.correct]="selected() === $index && result.hit"
              [class.wrong]="selected() === $index && !result.hit"
              (click)="selected.set($index)"
            >
              <span
                class="key"
                [style.background]="result.hit ? 'var(--success)' : 'var(--danger)'"
                [style.color]="'#07101f'"
              >
                {{ result.hit ? '✓' : '✗' }}
              </span>
              <span class="stack-sm" style="gap: 4px; flex: 1">
                <span>{{ result.question.q }}</span>
                <span class="small muted mono">
                  terms: {{ result.terms.join(' ') }} · retrieved
                  @for (hit of result.retrieved; track hit.id) {
                    {{ hit.id }} ({{ hit.score | number: '1.2-2' }}){{ $last ? '' : ',' }}
                  }
                </span>
                @if (!result.hit) {
                  <span class="small" style="color: var(--warning)">
                    No single retrieved chunk contains the complete fact (needs “{{
                      result.question.keywords.join('” and “')
                    }}”).
                  </span>
                }
              </span>
            </button>
          }
          <div class="card-soft">
            <div class="row row-between">
              <div>
                <div class="eyebrow">Score for this configuration</div>
                <div class="score-big gradient-text">{{ rep.score }}%</div>
              </div>
              <app-stars [count]="starsForScore(rep.score)" />
            </div>
            <p class="small muted" style="margin-top: 6px">
              80 points for answerable questions, 20 for efficiency (share of the document you did
              <em>not</em> send to the model).
            </p>
            <div class="actions">
              <button type="button" class="btn btn-primary" (click)="submit()">
                Submit this configuration
              </button>
            </div>
          </div>
        </div>

        <div class="stack-sm">
          <div class="eyebrow">{{ challenge().title }} — {{ rep.chunks.length }} chunks</div>
          <div class="chunks">
            @for (chunk of rep.chunks; track chunk.id) {
              @let rank = rankOf(chunk.id);
              <div
                class="chunk"
                [class.hit]="rank === 1"
                [class.second]="rank === 2"
                [class.fact]="rank > 0 && containsFact(chunk.text)"
              >
                <div class="row row-between small muted" style="gap: 6px">
                  <span class="mono"
                    >{{ chunk.id }} · words {{ chunk.start + 1 }}–{{ chunk.end }}</span
                  >
                  @if (rank > 0) {
                    <span class="pill" [class.pill-good]="containsFact(chunk.text)">
                      rank {{ rank }}{{ containsFact(chunk.text) ? ' · contains the fact' : '' }}
                    </span>
                  }
                </div>
                <div class="small">{{ chunk.text }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .chunks {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 560px;
      overflow: auto;
      padding-right: 4px;
    }
    .chunk {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      background: var(--surface-2);
    }
    .chunk.hit {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 12%, var(--surface-2));
    }
    .chunk.second {
      border-color: color-mix(in srgb, var(--accent) 50%, transparent);
      background: color-mix(in srgb, var(--accent) 6%, var(--surface-2));
    }
    .chunk.fact {
      box-shadow: inset 3px 0 0 var(--success);
    }
  `,
})
export class ChunkLabEngine {
  readonly challenge = input.required<ChunkLabChallenge>();
  readonly completed = output<ChallengeResult>();

  readonly size = signal(60);
  readonly overlapPct = signal(15);
  readonly selected = signal(0);
  readonly starsForScore = starsForScore;

  readonly overlapWords = computed(() =>
    Math.min(this.size() - 1, Math.round((this.size() * this.overlapPct()) / 100)),
  );
  readonly report = computed(() =>
    evaluateChunking(
      this.challenge().document,
      this.challenge().questions,
      this.size(),
      this.overlapWords(),
    ),
  );
  readonly selectedResult = computed(() => this.report().results[this.selected()]);

  rankOf(chunkId: string): number {
    return this.selectedResult()?.retrieved.find((hit) => hit.id === chunkId)?.rank ?? 0;
  }

  containsFact(text: string): boolean {
    const keywords = this.selectedResult()?.question.keywords ?? [];
    const haystack = text.toLowerCase();
    return keywords.every((keyword) => haystack.includes(keyword.toLowerCase()));
  }

  submit(): void {
    const rep = this.report();
    this.completed.emit({
      scorePct: rep.score,
      summary: `${rep.hits} of ${rep.results.length} questions answerable with ${this.size()}-word chunks and ${this.overlapWords()} words of overlap`,
    });
  }
}
