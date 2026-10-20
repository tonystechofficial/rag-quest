export interface Streak {
  /** Local calendar day (YYYY-MM-DD) of the last completed quest, or null. */
  lastDay: string | null;
  days: number;
}

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Whole days between two YYYY-MM-DD keys, computed in UTC so daylight-saving shifts never matter. */
function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function advanceStreak(streak: Streak, today: string): Streak {
  if (streak.lastDay === today) {
    return { ...streak };
  }
  if (streak.lastDay && daysBetween(streak.lastDay, today) === 1) {
    return { lastDay: today, days: streak.days + 1 };
  }
  return { lastDay: today, days: 1 };
}

/** The streak as shown to the player: still alive if the last play was today or yesterday. */
export function displayedStreak(streak: Streak, today: string): number {
  if (!streak.lastDay) {
    return 0;
  }
  return daysBetween(streak.lastDay, today) <= 1 ? streak.days : 0;
}
