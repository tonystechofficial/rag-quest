export interface BudgetItem {
  id: string;
  cost: number;
  value: number;
}

export interface Selection {
  ids: string[];
  cost: number;
  value: number;
}

const MAX_ITEMS = 20;

/**
 * 0/1 knapsack by exhaustive search (the game never has more than a dozen chunks).
 * Ties are broken towards the cheaper, then the smaller, selection.
 */
export function bestSubsetUnderBudget(items: BudgetItem[], budget: number): Selection {
  if (items.length > MAX_ITEMS) {
    throw new RangeError(`exhaustive search supports at most ${MAX_ITEMS} items`);
  }
  let best: Selection = { ids: [], cost: 0, value: 0 };
  const n = items.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    let cost = 0;
    let value = 0;
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        cost += items[i].cost;
        value += items[i].value;
        ids.push(items[i].id);
      }
    }
    if (cost > budget) {
      continue;
    }
    const better =
      value > best.value ||
      (value === best.value &&
        (cost < best.cost || (cost === best.cost && ids.length < best.ids.length)));
    if (better) {
      best = { ids, cost, value };
    }
  }
  return best;
}

/** Value of the picked items over the optimal value, as a percentage; 0 when over budget. */
export function budgetScore(picked: string[], items: BudgetItem[], budget: number): number {
  const pickedSet = new Set(picked);
  const chosen = items.filter((item) => pickedSet.has(item.id));
  const cost = chosen.reduce((sum, item) => sum + item.cost, 0);
  if (cost > budget) {
    return 0;
  }
  const value = chosen.reduce((sum, item) => sum + item.value, 0);
  const optimum = bestSubsetUnderBudget(items, budget).value;
  if (optimum === 0) {
    return 100;
  }
  return Math.min(100, (value / optimum) * 100);
}
