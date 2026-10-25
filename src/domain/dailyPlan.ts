import type { Routine, Session } from "./types";
export function localDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function routineProgress(
  routine: Routine,
  sessions: Session[],
  now = new Date(),
) {
  const today = sessions.filter(
    (s) => s.routineId === routine.id && localDay(s.date) === localDay(now),
  );
  const complete = today.some((s) => s.routineFinished);
  const latest = today.at(-1);
  const runId = latest?.runId;
  const run = runId ? today.filter((s) => s.runId === runId) : [];
  const done = new Set(
    run.map((s) => s.exerciseId).filter((id): id is string => !!id),
  );
  const remaining = routine.exerciseIds.filter((id) => !done.has(id));
  return {
    complete,
    completedMovements: routine.exerciseIds.length - remaining.length,
    remaining,
    runId: complete ? undefined : runId,
  };
}
export function dailyRoutines(routines: Routine[], now = new Date()) {
  return routines.filter(
    (r) => r.days.includes(now.getDay()) || r.days.length === 0,
  );
}
export function weekActivity(sessions: Session[], now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + index);
    return {
      date: localDay(day),
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      sessions: sessions.filter((s) => localDay(s.date) === localDay(day))
        .length,
      today: localDay(day) === localDay(now),
      future: day.getTime() > now.getTime(),
    };
  });
}
