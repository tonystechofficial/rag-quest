import { PercentPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { duplicateRowIndices, iqrOutliers, missingCells } from '../../../core/domain/data-quality';
import { precisionRecallF1, PrfMetrics } from '../../../core/domain/scoring';
import { ChallengeResult, DirtyDataChallenge } from '../../../core/models';

type CellStatus = 'none' | 'flagged' | 'correct' | 'wrong' | 'missed';

@Component({
  selector: 'app-dirty-data-engine',
  imports: [PercentPipe],
  template: `
    <div class="stack">
      @if (phase() === 'answer') {
        <p class="small muted">
          Click a cell to flag it, click again to unflag.
          <strong>{{ flags().length }}</strong> cells flagged.
        </p>
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>#</th>
              @for (column of challenge().columns; track column) {
                <th>{{ column }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of challenge().rows; track $index; let r = $index) {
              <tr>
                <td class="faint mono">{{ r + 1 }}</td>
                @for (cell of row; track $index; let c = $index) {
                  @let status = statusOf(r, c);
                  <td
                    class="cell"
                    [class.flagged]="status === 'flagged'"
                    [class.correct]="status === 'correct'"
                    [class.wrong]="status === 'wrong'"
                    [class.missed]="status === 'missed'"
                    [attr.role]="phase() === 'answer' ? 'button' : null"
                    [attr.tabindex]="phase() === 'answer' ? 0 : null"
                    [attr.aria-pressed]="phase() === 'answer' ? status === 'flagged' : null"
                    (click)="toggle(r, c)"
                    (keydown.enter)="toggle(r, c)"
                    (keydown.space)="toggle(r, c); $event.preventDefault()"
                  >
                    {{ cell === '' ? '∅' : cell }}
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (phase() === 'answer') {
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="flags.set([])">Clear</button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="flags().length === 0"
            (click)="check()"
          >
            Submit {{ flags().length }} flags
          </button>
        </div>
      } @else {
        @let m = metrics()!;
        <div
          class="feedback"
          [class.good]="score() >= 90"
          [class.info]="score() >= 60 && score() < 90"
          [class.bad]="score() < 60"
        >
          <div class="feedback-title">
            F1 {{ score() }}% — you found {{ m.tp }} of {{ challenge().issues.length }} issues
            (precision {{ m.precision | percent }}, recall {{ m.recall | percent }}),
            {{ m.fp }} false alarm{{ m.fp === 1 ? '' : 's' }}.
          </div>
          <p class="small">Green = found, dashed amber = missed, red = flagged but fine.</p>
        </div>
        <div class="grid grid-2">
          @for (issue of challenge().issues; track $index) {
            <div class="card-soft small">
              <div class="row row-between" style="gap: 8px">
                <strong
                  >Row {{ issue.row + 1
                  }}{{ issue.col === null ? '' : ' · ' + challenge().columns[issue.col] }}</strong
                >
                <span
                  class="pill"
                  [class.pill-good]="found(issue.row, issue.col)"
                  [class.pill-warn]="!found(issue.row, issue.col)"
                >
                  {{ issue.type }}
                </span>
              </div>
              <p style="margin-top: 6px">{{ issue.why }}</p>
            </div>
          }
        </div>
        <div class="card-soft small">
          <div class="eyebrow" style="margin-bottom: 6px">What automated checks would catch</div>
          <ul style="margin: 0; padding-left: 18px">
            <li>Duplicate rows: {{ autoDuplicates() }}</li>
            <li>Missing values &amp; sentinels: {{ autoMissing() }}</li>
            <li>IQR outliers in <code>age</code>: {{ autoOutliers() }}</li>
            <li>Format checks (email regex, ISO dates, canonical casing): the rest.</li>
          </ul>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="finish()">See results</button>
        </div>
      }
    </div>
  `,
  styles: `
    .cell {
      cursor: pointer;
      user-select: none;
      transition: background 0.1s ease;
    }
    .cell:hover {
      background: var(--surface-3);
    }
    .cell.flagged {
      background: color-mix(in srgb, var(--accent) 22%, transparent);
      box-shadow: inset 0 0 0 1px var(--accent);
    }
    .cell.correct {
      background: color-mix(in srgb, var(--success) 22%, transparent);
      box-shadow: inset 0 0 0 1px var(--success);
    }
    .cell.wrong {
      background: color-mix(in srgb, var(--danger) 22%, transparent);
      box-shadow: inset 0 0 0 1px var(--danger);
    }
    .cell.missed {
      background: color-mix(in srgb, var(--warning) 18%, transparent);
      box-shadow: inset 0 0 0 1px var(--warning);
    }
    tbody tr:hover td {
      background-color: color-mix(in srgb, var(--surface-3) 50%, transparent);
    }
  `,
})
export class DirtyDataEngine {
  readonly challenge = input.required<DirtyDataChallenge>();
  readonly completed = output<ChallengeResult>();

  readonly phase = signal<'answer' | 'feedback'>('answer');
  readonly flags = signal<string[]>([]);
  readonly metrics = signal<PrfMetrics | null>(null);
  readonly score = signal(0);
  private readonly matched = signal<Set<string>>(new Set());

  readonly autoDuplicates = computed(() => {
    const rows = duplicateRowIndices(this.challenge().rows);
    return rows.length ? rows.map((r) => `row ${r + 1}`).join(', ') : 'none';
  });
  readonly autoMissing = computed(() => {
    const cells = missingCells(this.challenge().rows);
    return cells.length
      ? cells
          .map((cell) => `row ${cell.row + 1} · ${this.challenge().columns[cell.col]}`)
          .join(', ')
      : 'none';
  });
  readonly autoOutliers = computed(() => {
    const col = this.challenge().columns.indexOf('age');
    if (col === -1) return 'n/a';
    const values = this.challenge().rows.map((row) => Number(row[col]));
    const outliers = iqrOutliers(values);
    return outliers.length ? outliers.map((r) => `${values[r]} (row ${r + 1})`).join(', ') : 'none';
  });

  toggle(row: number, col: number): void {
    if (this.phase() !== 'answer') {
      return;
    }
    const key = `${row}:${col}`;
    this.flags.update((flags) =>
      flags.includes(key) ? flags.filter((k) => k !== key) : [...flags, key],
    );
  }

  statusOf(row: number, col: number): CellStatus {
    const key = `${row}:${col}`;
    const flagged = this.flags().includes(key);
    if (this.phase() === 'answer') {
      return flagged ? 'flagged' : 'none';
    }
    if (flagged) {
      return this.matched().has(key) ? 'correct' : 'wrong';
    }
    return this.isIssueCell(row, col) && !this.found(row, this.issueColFor(row, col))
      ? 'missed'
      : 'none';
  }

  found(row: number, col: number | null): boolean {
    if (col === null) {
      return this.flags().some((key) => key.startsWith(`${row}:`));
    }
    return this.flags().includes(`${row}:${col}`);
  }

  check(): void {
    const flagged = new Set(this.flags());
    const matched = new Set<string>();
    let tp = 0;
    let fn = 0;
    for (const issue of this.challenge().issues) {
      if (issue.col === null) {
        const rowKeys = [...flagged].filter((key) => key.startsWith(`${issue.row}:`));
        if (rowKeys.length) {
          tp++;
          rowKeys.forEach((key) => matched.add(key));
        } else {
          fn++;
        }
      } else {
        const key = `${issue.row}:${issue.col}`;
        if (flagged.has(key)) {
          tp++;
          matched.add(key);
        } else {
          fn++;
        }
      }
    }
    const fp = [...flagged].filter((key) => !matched.has(key)).length;
    const metrics = precisionRecallF1(tp, fp, fn);
    this.matched.set(matched);
    this.metrics.set(metrics);
    this.score.set(Math.round(metrics.f1 * 100));
    this.phase.set('feedback');
  }

  finish(): void {
    const m = this.metrics();
    this.completed.emit({
      scorePct: this.score(),
      summary: m
        ? `${m.tp} of ${this.challenge().issues.length} issues found, ${m.fp} false alarms`
        : '',
    });
  }

  private isIssueCell(row: number, col: number): boolean {
    return this.challenge().issues.some(
      (issue) => issue.row === row && (issue.col === null || issue.col === col),
    );
  }

  private issueColFor(row: number, col: number): number | null {
    const issue = this.challenge().issues.find(
      (candidate) => candidate.row === row && (candidate.col === null || candidate.col === col),
    );
    return issue ? issue.col : col;
  }
}
