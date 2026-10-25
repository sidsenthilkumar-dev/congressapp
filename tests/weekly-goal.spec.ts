import { test, expect } from "@playwright/test";
import { weeklyGoal } from "../src/domain/weeklyGoal";
import type { Routine, Session } from "../src/domain/types";
const routine: Routine = {
  id: "plan",
  name: "Example schedule",
  days: [1, 3, 5],
  exerciseIds: ["knee-extension"],
  notes: "",
  createdAt: "2026-10-01T09:00:00",
};
const saved = (date: string, extra: Partial<Session> = {}): Session => ({
  date,
  name: "Example",
  reps: 5,
  routineId: "plan",
  routineFinished: true,
  ...extra,
});
test("weekly goal counts planned routines once, ignores partial, extra, future and unscheduled sessions", () => {
  const now = new Date("2026-10-23T12:00:00");
  const sessions = [
    saved("2026-10-19T10:00:00"),
    saved("2026-10-19T11:00:00"),
    saved("2026-10-21T10:00:00", { routineFinished: false }),
    saved("2026-10-20T10:00:00"),
    saved("2026-10-23T13:00:00"),
    saved("2026-10-12T10:00:00"),
  ];
  expect(weeklyGoal([routine], sessions, now)).toEqual({
    planned: 3,
    completed: 1,
    dueToday: 1,
    completedToday: 0,
  });
  sessions.push(saved("2026-10-23T11:00:00"));
  expect(weeklyGoal([routine], sessions, now).completedToday).toBe(1);
});
test("unscheduled routines do not silently become a seven-day goal; plans do not predate creation", () => {
  const now = new Date("2026-10-23T12:00:00");
  expect(weeklyGoal([{ ...routine, days: [] }], [], now).planned).toBe(0);
  expect(
    weeklyGoal([{ ...routine, createdAt: "2026-10-22T09:00:00" }], [], now)
      .planned,
  ).toBe(1);
});
test("week boundary uses calendar dates rather than fixed 24-hour days", () => {
  const now = new Date(2026, 10, 1, 12);
  const sunday = { ...routine, days: [0] };
  expect(
    weeklyGoal([sunday], [saved(new Date(2026, 10, 1, 9).toISOString())], now),
  ).toEqual({ planned: 1, completed: 1, dueToday: 1, completedToday: 1 });
  expect(weeklyGoal([sunday], [], new Date(2026, 10, 2, 9)).completed).toBe(0);
});
