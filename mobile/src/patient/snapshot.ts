export type NativeRoutine = {
  id: string;
  name: string;
  exerciseIds: string[];
  remaining: string[];
  complete: boolean;
  completedMovements: number;
};
export type RecoverySnapshot = {
  version: 1;
  profile: { area: string; side: string; goal: string };
  safety: { blocked: boolean; title: string; message: string };
  stats: { total: number; today: number; week: number[]; pain: number | null };
  routines: NativeRoutine[];
  routineDays?: number[];
  weeklyGoal?: {
    planned: number;
    completed: number;
    dueToday: number;
    completedToday: number;
  };
  updatedAt: string;
  modal: string;
};
export function parseSnapshot(value: unknown): RecoverySnapshot {
  const s = value as RecoverySnapshot;
  const text = (v: unknown, max = 500) =>
    typeof v === "string" && v.length <= max;
  const count = (v: unknown) =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 1000000;
  if (
    !s ||
    s.version !== 1 ||
    !s.profile ||
    ![s.profile.area, s.profile.side, s.profile.goal].every((v) => text(v)) ||
    !s.safety ||
    typeof s.safety.blocked !== "boolean" ||
    ![s.safety.title, s.safety.message].every((v) => text(v, 3000)) ||
    !s.stats ||
    !count(s.stats.total) ||
    !count(s.stats.today) ||
    s.stats.today > s.stats.total ||
    !Array.isArray(s.stats.week) ||
    s.stats.week.length !== 7 ||
    !s.stats.week.every(count) ||
    (s.stats.pain !== null &&
      (!Number.isFinite(s.stats.pain) ||
        s.stats.pain < 0 ||
        s.stats.pain > 10)) ||
    !Array.isArray(s.routines) ||
    s.routines.length > 100 ||
    !text(s.updatedAt) ||
    !Number.isFinite(Date.parse(s.updatedAt)) ||
    !text(s.modal, 30)
  )
    throw Error("Invalid recovery snapshot.");
  for (const r of s.routines)
    if (
      !r ||
      !text(r.id, 100) ||
      !text(r.name, 100) ||
      typeof r.complete !== "boolean" ||
      !count(r.completedMovements) ||
      ![r.exerciseIds, r.remaining].every(
        (a) =>
          Array.isArray(a) && a.length <= 100 && a.every((id) => text(id, 100)),
      )
    )
      throw Error("Invalid routine snapshot.");
  if (
    s.routineDays !== undefined &&
    (!Array.isArray(s.routineDays) ||
      s.routineDays.length > 7 ||
      s.routineDays.some((d) => !Number.isInteger(d) || d < 0 || d > 6))
  )
    throw Error("Invalid routine days.");
  if (s.weeklyGoal !== undefined) {
    const g = s.weeklyGoal;
    if (
      !g ||
      typeof g !== "object" ||
      ![g.planned, g.completed, g.dueToday, g.completedToday].every(count) ||
      g.completed > g.planned ||
      g.completedToday > g.dueToday ||
      g.dueToday > g.planned ||
      g.completedToday > g.completed
    )
      throw Error("Invalid weekly goal.");
  }
  return s;
}
