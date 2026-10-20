export interface Quartiles {
  q1: number;
  median: number;
  q3: number;
}

export interface CellRef {
  row: number;
  col: number;
}

const MISSING_SENTINELS = new Set(['', 'null', 'none', 'nan', 'n/a', 'na', '-', '?', 'undefined']);

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) {
    return NaN;
  }
  const middle = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Tukey's hinges: quartiles are the medians of the lower and upper halves. */
export function quartiles(values: number[]): Quartiles {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const n = sorted.length;
  return {
    q1: median(sorted.slice(0, Math.floor(n / 2))),
    median: median(sorted),
    q3: median(sorted.slice(Math.ceil(n / 2))),
  };
}

/** Indices of values outside [Q1 - 1.5 IQR, Q3 + 1.5 IQR]; non-numeric values are ignored. */
export function iqrOutliers(values: number[]): number[] {
  const { q1, q3 } = quartiles(values);
  if (!Number.isFinite(q1) || !Number.isFinite(q3)) {
    return [];
  }
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  const outliers: number[] = [];
  values.forEach((value, index) => {
    if (Number.isFinite(value) && (value < low || value > high)) {
      outliers.push(index);
    }
  });
  return outliers;
}

/** Indices of rows that repeat an earlier row (compared on `columns`, or on every column). */
export function duplicateRowIndices(rows: string[][], columns?: number[]): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];
  rows.forEach((row, index) => {
    const key = JSON.stringify(columns ? columns.map((col) => row[col]) : row);
    if (seen.has(key)) {
      duplicates.push(index);
    } else {
      seen.add(key);
    }
  });
  return duplicates;
}

/** Cells that are empty or hold a common "missing" sentinel such as N/A or null. */
export function missingCells(rows: string[][]): CellRef[] {
  const cells: CellRef[] = [];
  rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (MISSING_SENTINELS.has(value.trim().toLowerCase())) {
        cells.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  return cells;
}
