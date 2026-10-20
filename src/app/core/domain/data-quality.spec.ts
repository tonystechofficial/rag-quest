import { duplicateRowIndices, iqrOutliers, missingCells, quartiles } from './data-quality';

describe('quartiles', () => {
  it('uses the medians of the lower and upper halves', () => {
    expect(quartiles([10, 11, 11, 12, 12, 13, 250])).toEqual({ q1: 11, median: 12, q3: 13 });
    expect(quartiles([1, 2, 3, 4])).toEqual({ q1: 1.5, median: 2.5, q3: 3.5 });
  });
});

describe('iqrOutliers', () => {
  it('flags values beyond 1.5 IQR from the quartiles', () => {
    expect(iqrOutliers([10, 12, 11, 13, 12, 11, 250])).toEqual([6]);
  });

  it('flags nothing on a tight distribution', () => {
    expect(iqrOutliers([1, 2, 3, 4, 5])).toEqual([]);
  });

  it('ignores non-numeric values and still flags low outliers', () => {
    expect(iqrOutliers([10, NaN, 12, 11, 12, 11, -500])).toEqual([6]);
  });
});

describe('duplicateRowIndices', () => {
  it('returns the indices of rows repeating an earlier row', () => {
    expect(
      duplicateRowIndices([
        ['a', '1'],
        ['b', '2'],
        ['a', '1'],
      ]),
    ).toEqual([2]);
  });

  it('can compare on selected columns only', () => {
    expect(
      duplicateRowIndices(
        [
          ['a', '1'],
          ['a', '2'],
        ],
        [0],
      ),
    ).toEqual([1]);
  });
});

describe('missingCells', () => {
  it('finds empty cells and common sentinel values', () => {
    expect(
      missingCells([
        ['a', ''],
        ['N/A', 'b'],
        ['c', 'null'],
        ['d', ' '],
      ]),
    ).toEqual([
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 2, col: 1 },
      { row: 3, col: 1 },
    ]);
  });
});
