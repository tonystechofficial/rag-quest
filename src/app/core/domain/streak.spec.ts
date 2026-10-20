import { advanceStreak, dayKey, displayedStreak } from './streak';

describe('dayKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 9, 20, 23, 30))).toBe('2026-10-20');
    expect(dayKey(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });
});

describe('advanceStreak', () => {
  it('starts at one on the first day played', () => {
    expect(advanceStreak({ lastDay: null, days: 0 }, '2026-10-20')).toEqual({
      lastDay: '2026-10-20',
      days: 1,
    });
  });

  it('does not change within the same day', () => {
    expect(advanceStreak({ lastDay: '2026-10-20', days: 3 }, '2026-10-20')).toEqual({
      lastDay: '2026-10-20',
      days: 3,
    });
  });

  it('grows on consecutive days, across month boundaries too', () => {
    expect(advanceStreak({ lastDay: '2026-10-19', days: 3 }, '2026-10-20').days).toBe(4);
    expect(advanceStreak({ lastDay: '2026-09-30', days: 1 }, '2026-10-01').days).toBe(2);
  });

  it('resets after a missed day', () => {
    expect(advanceStreak({ lastDay: '2026-10-17', days: 3 }, '2026-10-20')).toEqual({
      lastDay: '2026-10-20',
      days: 1,
    });
  });
});

describe('displayedStreak', () => {
  it('shows the streak while it can still be continued (played today or yesterday)', () => {
    expect(displayedStreak({ lastDay: '2026-10-20', days: 4 }, '2026-10-20')).toBe(4);
    expect(displayedStreak({ lastDay: '2026-10-19', days: 4 }, '2026-10-20')).toBe(4);
  });

  it('shows zero once the streak is broken', () => {
    expect(displayedStreak({ lastDay: '2026-10-18', days: 4 }, '2026-10-20')).toBe(0);
    expect(displayedStreak({ lastDay: null, days: 0 }, '2026-10-20')).toBe(0);
  });
});
