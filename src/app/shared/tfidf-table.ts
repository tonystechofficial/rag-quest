import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { inverseDocumentFrequency, normalizeText, tfidfVectors } from '../core/domain/tfidf';
import { RevealDoc } from '../core/models';

interface TfidfRow {
  term: string;
  df: number;
  idf: number;
  weights: number[];
  hot: boolean[];
}

@Component({
  selector: 'app-tfidf-table',
  imports: [DecimalPipe],
  template: `
    <div class="table-wrap">
      <table class="data mono small">
        <thead>
          <tr>
            <th>term</th>
            <th>df</th>
            <th>idf</th>
            @for (doc of docs(); track doc.label) {
              <th>tf·idf {{ doc.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.term) {
            <tr>
              <td>{{ row.term }}</td>
              <td>{{ row.df }}</td>
              <td [class.zero]="row.idf === 0">{{ row.idf | number: '1.2-2' }}</td>
              @for (weight of row.weights; track $index) {
                <td [class.hot]="row.hot[$index]" [class.zero]="weight === 0">
                  {{ weight | number: '1.2-2' }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
    <p class="small faint" style="margin-top: 8px">
      tf = term count ÷ document length · idf = ln(N ÷ df) · computed live from the documents,
      stopwords kept. Highlighted cells are the heaviest terms of each document.
    </p>
  `,
  styles: `
    .hot {
      color: var(--accent);
      font-weight: 800;
    }
    .zero {
      color: var(--text-faint);
    }
  `,
})
export class TfidfTable {
  readonly docs = input.required<RevealDoc[]>();

  readonly rows = computed<TfidfRow[]>(() => {
    const tokensPerDoc = this.docs().map((doc) => normalizeText(doc.text));
    const idf = inverseDocumentFrequency(tokensPerDoc);
    const vectors = tfidfVectors(tokensPerDoc);
    const df = new Map<string, number>();
    for (const tokens of tokensPerDoc) {
      for (const term of new Set(tokens)) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }
    const columnMax = vectors.map((vector) => Math.max(0, ...vector.values()));
    return [...idf.keys()]
      .map((term) => {
        const weights = vectors.map((vector) => vector.get(term) ?? 0);
        return {
          term,
          df: df.get(term) ?? 0,
          idf: idf.get(term) ?? 0,
          weights,
          hot: weights.map((weight, i) => weight > 0 && weight === columnMax[i]),
        };
      })
      .sort(
        (a, b) => Math.max(...b.weights) - Math.max(...a.weights) || a.term.localeCompare(b.term),
      );
  });
}
