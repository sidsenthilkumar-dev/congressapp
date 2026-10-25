import { localDay } from "./dailyPlan";
import type { Routine, Session } from "./types";

/** One completed routine per planned local date. Extra sets never earn extra credit. */
export function weeklyGoal(
  routines: Routine[],
  sessions: Session[],
  now = new Date(),
) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const today = localDay(now);
  const finished = new Set(
    sessions
      .filter(
        (s) =>
          s.routineFinished &&
          s.routineId &&
          new Date(s.date).getTime() <= now.getTime(),
      )
      .map((s) => `${s.routineId}:${localDay(s.date)}`),
  );
  let planned = 0,
    completed = 0,
    dueToday = 0,
    completedToday = 0;
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(start);
    date.setDate(date.getDate() + offset);
    const day = localDay(date);
    for (const routine of routines) {
      if (!routine.exerciseIds.length || !routine.days.includes(date.getDay()))
        continue;
      if (day < localDay(routine.createdAt)) continue;
      planned++;
      const done = day <= today && finished.has(`${routine.id}:${day}`);
      if (done) completed++;
      if (day === today) {
        dueToday++;
        if (done) completedToday++;
      }
    }
  }
  return { planned, completed, dueToday, completedToday };
}
