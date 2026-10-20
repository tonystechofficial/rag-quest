import {
  bonusXp,
  closenessScore,
  pickScore,
  placementScore,
  playerRank,
  precisionRecallF1,
  setF1,
  starsForScore,
  xpForResult,
} from './scoring';

describe('bonusXp', () => {
  it('gives a first-try bonus for three stars on the first attempt', () => {
    expect(bonusXp({ scorePct: 92, attempts: 1, flawless: false, hinted: false })).toEqual({
      firstTry: 10,
      flawless: 0,
      total: 10,
    });
  });

  it('gives a flawless bonus when every round scored 90+ without a hint', () => {
    expect(bonusXp({ scorePct: 95, attempts: 2, flawless: true, hinted: false })).toEqual({
      firstTry: 0,
      flawless: 20,
      total: 20,
    });
  });

  it('a hint cancels the flawless bonus but not the first-try bonus', () => {
    expect(bonusXp({ scorePct: 95, attempts: 1, flawless: true, hinted: true })).toEqual({
      firstTry: 10,
      flawless: 0,
      total: 10,
    });
  });

  it('gives nothing below three stars on a first try', () => {
    expect(bonusXp({ scorePct: 80, attempts: 1, flawless: false, hinted: false }).total).toBe(0);
  });
});

describe('placementScore', () => {
  it('is 100 anywhere inside the tolerance radius', () => {
    expect(placementScore(0)).toBe(100);
    expect(placementScore(0.12)).toBe(100);
  });

  it('decays linearly to 0 at tolerance + 0.7', () => {
    expect(placementScore(0.47)).toBe(50);
    expect(placementScore(0.82)).toBe(0);
    expect(placementScore(2)).toBe(0);
  });
});

describe('starsForScore', () => {
  it.each([
    [100, 3],
    [90, 3],
    [89, 2],
    [60, 2],
    [59, 1],
    [30, 1],
    [29, 0],
    [0, 0],
  ])('%i%% gives %i stars', (pct, stars) => {
    expect(starsForScore(pct)).toBe(stars);
  });
});

describe('xpForResult', () => {
  it('awards the full xp for three stars and a proportional share otherwise', () => {
    expect(xpForResult(100, 95)).toBe(100);
    expect(xpForResult(100, 60)).toBe(67);
    expect(xpForResult(100, 30)).toBe(33);
    expect(xpForResult(100, 10)).toBe(0);
  });
});

describe('playerRank', () => {
  it('starts as a Data Novice', () => {
    expect(playerRank(0).title).toBe('Data Novice');
  });

  it('climbs with xp', () => {
    expect(playerRank(100).title).toBe('Token Apprentice');
    expect(playerRank(300).title).toBe('Vector Analyst');
    expect(playerRank(1500).title).toBe('RAG Grandmaster');
  });

  it('exposes progress towards the next rank', () => {
    const rank = playerRank(150);
    expect(rank.next?.title).toBe('Vector Analyst');
    expect(rank.next?.minXp).toBe(300);
    expect(rank.progress).toBeCloseTo(50 / 200);
  });

  it('tops out with no next rank and full progress', () => {
    const rank = playerRank(99999);
    expect(rank.next).toBeNull();
    expect(rank.progress).toBe(1);
  });
});

describe('precisionRecallF1', () => {
  it('computes the three metrics from counts', () => {
    const m = precisionRecallF1(3, 1, 1);
    expect(m.precision).toBeCloseTo(0.75);
    expect(m.recall).toBeCloseTo(0.75);
    expect(m.f1).toBeCloseTo(0.75);
  });

  it('is 0 when nothing was predicted but something was expected', () => {
    expect(precisionRecallF1(0, 0, 2).f1).toBe(0);
  });

  it('is 1 when nothing was expected and nothing predicted', () => {
    expect(precisionRecallF1(0, 0, 0).f1).toBe(1);
  });
});

describe('setF1', () => {
  it('compares a predicted set of keys with the expected set', () => {
    const m = setF1(['a', 'b', 'x'], ['a', 'b', 'c']);
    expect(m.tp).toBe(2);
    expect(m.fp).toBe(1);
    expect(m.fn).toBe(1);
    expect(m.f1).toBeCloseTo(2 / 3);
  });
});

describe('closenessScore', () => {
  it('is 100 for an exact guess', () => {
    expect(closenessScore(7, 7)).toBe(100);
  });

  it('drops linearly with the relative error', () => {
    expect(closenessScore(8, 10)).toBe(80);
    expect(closenessScore(12, 10)).toBe(80);
  });

  it('never goes below zero', () => {
    expect(closenessScore(30, 10)).toBe(0);
  });

  it('handles an actual value of zero', () => {
    expect(closenessScore(0, 0)).toBe(100);
    expect(closenessScore(3, 0)).toBe(0);
  });
});

describe('pickScore', () => {
  const items = [
    { id: 'a', relevance: 3 },
    { id: 'b', relevance: 2 },
    { id: 'c', relevance: 0 },
    { id: 'd', relevance: 2 },
  ];

  it('is the picked relevance over the best achievable with k picks', () => {
    expect(pickScore(['a', 'c', 'd'], items, 3)).toBeCloseTo((5 / 7) * 100);
  });

  it('is 100 for an optimal pick', () => {
    expect(pickScore(['a', 'b', 'd'], items, 3)).toBe(100);
  });

  it('is 0 when nothing relevant was picked', () => {
    expect(pickScore(['c'], items, 3)).toBe(0);
  });
});
