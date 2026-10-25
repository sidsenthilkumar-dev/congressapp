import { useEffect, useRef } from "react";
import {
  dailyRoutines,
  routineProgress,
  weekActivity,
  localDay,
} from "../domain/dailyPlan";
import type { Entry, Routine, Session } from "../domain/types";
import type { RecoveryProfile } from "../domain/recovery";
import { exerciseById } from "../domain/exercises";
import { weeklyGoal } from "../domain/weeklyGoal";
type Host = {
  profile: RecoveryProfile;
  entries: Entry[];
  routines: Routine[];
  sessions: Session[];
  safety: { blocked: boolean; title: string; message: string };
  modal: string;
  onOpen: (id: string) => void;
  onStart: (routine: Routine) => void;
  onNavigate: (page: string) => void;
  onCheckIn: () => void;
  onClose: () => void;
};
// This bridge is inactive in ordinary browsers. Website rendering is unchanged.
export function useNativeHost(host: Host) {
  const current = useRef(host);
  current.current = host;
  function send() {
    if (!window.ReactNativeWebView) return;
    const h = current.current,
      now = new Date();
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "RECOVERY_SNAPSHOT",
        snapshot: {
          version: 1,
          profile: {
            area: h.profile.area,
            side: h.profile.side,
            goal: h.profile.goal,
          },
          safety: h.safety,
          weeklyGoal: weeklyGoal(h.routines, h.sessions, now),
          routineDays: [...new Set(h.routines.flatMap((r) => r.days))].sort(),
          stats: {
            total: h.sessions.length,
            today: h.sessions.filter((s) => localDay(s.date) === localDay(now))
              .length,
            week: weekActivity(h.sessions, now).map((d) => d.sessions),
            pain: h.entries.at(-1)?.pain ?? null,
          },
          routines: dailyRoutines(h.routines, now)
            .sort(
              (a, b) => Number(b.days.length > 0) - Number(a.days.length > 0),
            )
            .slice(0, 100)
            .map((r) => ({
              id: r.id,
              name: r.name,
              exerciseIds: r.exerciseIds,
              ...routineProgress(r, h.sessions, now),
            })),
          updatedAt: now.toISOString(),
          modal: h.modal,
        },
      }),
    );
  }
  useEffect(() => {
    send();
  }, [
    host.profile,
    host.entries,
    host.sessions,
    host.routines,
    host.safety.blocked,
    host.modal,
  ]);
  useEffect(() => {
    if (!window.ReactNativeWebView) return;
    const receive = (event: Event) => {
      const action = (event as CustomEvent).detail;
      if (!action || typeof action.type !== "string") return;
      const h = current.current;
      let accepted = true;
      if (action.type === "sync") {
        send();
        return;
      }
      if (action.type === "exercise" && exerciseById.has(action.id))
        h.onOpen(action.id);
      else if (action.type === "routine") {
        const routine = h.routines.find((r) => r.id === action.id);
        if (!routine || h.safety.blocked) accepted = false;
        else h.onStart(routine);
      } else if (action.type === "checkin") h.onCheckIn();
      else if (action.type === "close") h.onClose();
      else if (
        action.type === "navigate" &&
        [
          "My recovery",
          "My routines",
          "My progress",
          "Clinic",
          "Ask Rebound",
          "Exercise library",
          "Reminders",
        ].includes(action.page)
      )
        h.onNavigate(action.page);
      else accepted = false;
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: "NATIVE_ACTION_RESULT",
          requestId: action.requestId,
          accepted,
          reason: accepted
            ? ""
            : "Review your recovery profile before starting this routine.",
        }),
      );
    };
    window.addEventListener("rebound:native-action", receive);
    return () => window.removeEventListener("rebound:native-action", receive);
  }, []);
}
