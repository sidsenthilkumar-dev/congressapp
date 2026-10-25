import { useEffect, useRef } from "react";
import { useLocalStorage } from "./storage";
import type { Entry, Routine, Session } from "../domain/types";
import { type RecoveryProfile, regions } from "../domain/recovery";
import { exerciseById } from "../domain/exercises";
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const stringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const isProfile = (v: unknown): v is RecoveryProfile =>
  record(v) &&
  typeof v.area === "string" &&
  regions.includes(v.area) &&
  typeof v.side === "string" &&
  stringArray(v.symptoms) &&
  typeof v.goal === "string" &&
  (v.condition === undefined || typeof v.condition === "string") &&
  (v.stage === undefined || typeof v.stage === "string");
const isDate = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
const isEntries = (v: unknown): v is Entry[] =>
  Array.isArray(v) &&
  v.every(
    (e) =>
      record(e) &&
      isDate(e.date) &&
      typeof e.pain === "number" &&
      e.pain >= 0 &&
      e.pain <= 10 &&
      typeof e.energy === "string" &&
      typeof e.note === "string",
  );
const isSessions = (v: unknown): v is Session[] =>
  Array.isArray(v) &&
  v.every(
    (s) =>
      record(s) &&
      isDate(s.date) &&
      typeof s.name === "string" &&
      typeof s.reps === "number" &&
      Number.isInteger(s.reps) &&
      s.reps >= 0 &&
      (s.exerciseId === undefined || typeof s.exerciseId === "string") &&
      (s.routineId === undefined || typeof s.routineId === "string") &&
      (s.runId === undefined || typeof s.runId === "string") &&
      (s.routineFinished === undefined ||
        typeof s.routineFinished === "boolean") &&
      (s.durationSeconds === undefined ||
        (typeof s.durationSeconds === "number" &&
          Number.isFinite(s.durationSeconds) &&
          s.durationSeconds >= 0)) &&
      (s.target === undefined ||
        (typeof s.target === "number" &&
          Number.isFinite(s.target) &&
          s.target > 0)),
  );
const isBookmarks = (v: unknown): v is string[] =>
  stringArray(v) && v.every((id) => exerciseById.has(id));
const isRoutines = (v: unknown): v is Routine[] =>
  Array.isArray(v) &&
  v.every(
    (r) =>
      record(r) &&
      typeof r.id === "string" &&
      typeof r.name === "string" &&
      isBookmarks(r.exerciseIds) &&
      typeof r.notes === "string" &&
      Array.isArray(r.days) &&
      r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
      isDate(r.createdAt),
  );
const defaultProfile: RecoveryProfile = {
  area: "Knee",
  side: "Right",
  symptoms: ["Stiffness"],
  goal: "Move comfortably",
  condition: "General stiffness / movement confidence",
  stage: "Ongoing / assessed",
};
export function useRecoveryData() {
  const profile = useLocalStorage("rebound-injury", defaultProfile, isProfile);
  const entries = useLocalStorage<Entry[]>("rebound-entries", [], isEntries);
  const sessions = useLocalStorage<Session[]>(
    "rebound-sessions",
    [],
    isSessions,
  );
  const cleared = useLocalStorage<boolean>(
    "rebound-cleared",
    false,
    (v): v is boolean => typeof v === "boolean",
  );
  const bookmarks = useLocalStorage<string[]>(
    "rebound-bookmarks",
    [],
    isBookmarks,
  );
  const routines = useLocalStorage<Routine[]>(
    "rebound-routines",
    [],
    isRoutines,
  );
  const previous = useRef(JSON.stringify(profile.value));
  useEffect(() => {
    const next = JSON.stringify(profile.value);
    if (next !== previous.current) {
      cleared.setValue(false);
      previous.current = next;
    }
  }, [profile.value, cleared.setValue]);
  return {
    profile: profile.value,
    setProfile: profile.setValue,
    entries: entries.value,
    setEntries: entries.setValue,
    sessions: sessions.value,
    setSessions: sessions.setValue,
    cleared: cleared.value,
    setCleared: cleared.setValue,
    bookmarks: bookmarks.value,
    routines: routines.value,
    toggleBookmark: (id: string) => {
      if (exerciseById.has(id))
        bookmarks.setValue((items) =>
          items.includes(id) ? items.filter((x) => x !== id) : [...items, id],
        );
    },
    saveRoutine: (routine: Routine) =>
      routines.setValue((items) =>
        items.some((r) => r.id === routine.id)
          ? items.map((r) => (r.id === routine.id ? routine : r))
          : [...items, routine],
      ),
    deleteRoutine: (id: string) =>
      routines.setValue((items) => items.filter((r) => r.id !== id)),
    storageError: [
      profile,
      entries,
      sessions,
      cleared,
      bookmarks,
      routines,
    ].some((s) => s.storageError),
  };
}
