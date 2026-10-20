import { bestSubsetUnderBudget, budgetScore } from './knapsack';

const items = [
  { id: 'a', cost: 180, value: 3 },
  { id: 'b', cost: 520, value: 3 },
  { id: 'c', cost: 90, value: 2 },
  { id: 'd', cost: 300, value: 0 },
  { id: 'f', cost: 120, value: 1 },
  { id: 'g', cost: 200, value: 2 },
];

describe('bestSubsetUnderBudget', () => {
  it('maximizes value within the budget', () => {
    const best = bestSubsetUnderBudget(items, 600);
    expect(best.value).toBe(8);
    expect([...best.ids].sort()).toEqual(['a', 'c', 'f', 'g']);
    expect(best.cost).toBe(590);
  });

  it('returns an empty selection when nothing fits', () => {
    expect(bestSubsetUnderBudget([{ id: 'a', cost: 10, value: 5 }], 5)).toEqual({
      ids: [],
      cost: 0,
      value: 0,
    });
  });

  it('prefers the cheaper selection on equal value', () => {
    const best = bestSubsetUnderBudget(
      [
        { id: 'a', cost: 10, value: 2 },
        { id: 'b', cost: 20, value: 2 },
      ],
      20,
    );
    expect(best.ids).toEqual(['a']);
  });
});

describe('budgetScore', () => {
  it('is the picked value over the optimum, as a percentage', () => {
    expect(budgetScore(['a', 'c'], items, 600)).toBeCloseTo((5 / 8) * 100);
    expect(budgetScore(['a', 'c', 'f', 'g'], items, 600)).toBe(100);
  });

  it('is 0 when the picks exceed the budget', () => {
    expect(budgetScore(['a', 'b'], items, 600)).toBe(0);
  });
});
