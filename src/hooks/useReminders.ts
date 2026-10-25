import { useCallback, useEffect, useRef, useState } from "react";
import type { Routine, Session } from "../domain/types";
import {
  REMINDER_STORAGE_KEY,
  initialReminderState,
  isReminderState,
  isReminderSettings,
  dueRoutines,
  activeReminders,
  reminderId,
  localDay,
  timeOnDate,
  nextRoutineReminder,
  reminderCopy,
  routineCompletedForReminder,
  routineScheduledForReminder,
  reminderNeedsDelivery,
  buildReminderCalendar,
  type ReminderState,
  type ReminderSettings,
  type ReminderItem,
} from "../domain/reminders";

type Options = {
  routines: Routine[];
  sessions: Session[];
  blocked: boolean;
  onOpenRoutine: (routine: Routine) => void;
};
function readState(
  fallback: ReminderState = initialReminderState,
): ReminderState {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(REMINDER_STORAGE_KEY) || "null",
    );
    return isReminderState(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
function capability() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "Notification" in window
  );
}
async function activeWorker() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register(
    "/notification-worker.js",
    { updateViaCache: "none" },
  );
  if (registration.active) return registration;
  const worker = registration.installing || registration.waiting;
  if (!worker) return null;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.removeEventListener("statechange", changed);
      reject(
        new Error(
          "Notification support is still preparing. Try the test again shortly.",
        ),
      );
    }, 8000);
    function changed() {
      if (worker!.state === "activated") {
        clearTimeout(timeout);
        worker!.removeEventListener("statechange", changed);
        resolve();
      } else if (worker!.state === "redundant") {
        clearTimeout(timeout);
        worker!.removeEventListener("statechange", changed);
        reject(
          new Error(
            "Browser notifications could not initialize. Calendar reminders remain available.",
          ),
        );
      }
    }
    worker.addEventListener("statechange", changed);
    changed();
  });
  return registration;
}
export function useReminders(options: Options) {
  const [state, setState] = useState<ReminderState>(() => readState());
  const stateRef = useRef(state);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => (capability() ? Notification.permission : "unsupported"));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [persistenceError, setPersistenceError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const mounted = useRef(true);
  const storageFailed = useRef(false);
  const commit = useCallback(
    (update: (latest: ReminderState) => ReminderState) => {
      const latest = storageFailed.current
        ? stateRef.current
        : readState(stateRef.current);
      const next = update(latest);
      stateRef.current = next;
      try {
        localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(next));
        storageFailed.current = false;
        if (mounted.current) setPersistenceError(false);
      } catch {
        storageFailed.current = true;
        if (mounted.current) setPersistenceError(true);
      }
      if (mounted.current) setState(next);
      return next;
    },
    [],
  );
  const deliver = useCallback(
    async (item: ReminderItem, settings: ReminderSettings) => {
      if (
        !settings.browserNotifications ||
        !capability() ||
        Notification.permission !== "granted"
      )
        return;
      try {
        const registration = await activeWorker();
        const current = stateRef.current;
        const claimed = current.inbox.find((i) => i.id === item.id);
        if (
          !mounted.current ||
          !current.settings.enabled ||
          !current.settings.browserNotifications ||
          !claimed ||
          claimed.state === "dismissed" ||
          new Date(claimed.dueAt) > new Date()
        )
          return;
        const currentOptions = optionsRef.current;
        const routine = currentOptions.routines.find(
          (r) => r.id === item.routineId,
        );
        if (
          !routine ||
          !routineScheduledForReminder(routine, claimed) ||
          routineCompletedForReminder(routine, currentOptions.sessions, claimed)
        )
          return;
        const copy = reminderCopy(
          routine,
          current.settings,
          currentOptions.blocked,
        );
        if (registration) {
          await registration.showNotification(copy.title, {
            body: copy.body,
            icon: "/icons/rebound-192.png",
            tag: "rebound-" + item.id,
            data: { route: "reminders" },
          });
        } else {
          const notification = new Notification(copy.title, {
            body: copy.body,
            icon: "/icons/rebound-192.png",
            tag: "rebound-" + item.id,
          });
          notification.onclick = () => {
            window.focus();
            window.dispatchEvent(new CustomEvent("rebound:open-reminders"));
            notification.close();
          };
        }
        commit((latest) => ({
          ...latest,
          inbox: latest.inbox.map((i) =>
            i.id === item.id ? { ...i, delivery: "browser" } : i,
          ),
        }));
      } catch {
        commit((latest) => ({
          ...latest,
          inbox: latest.inbox.map((i) =>
            i.id === item.id ? { ...i, delivery: "failed" } : i,
          ),
        }));
        if (mounted.current)
          setError(
            "This browser could not show an alert. Your in-app reminder is saved; a calendar reminder is another option.",
          );
      }
    },
    [commit],
  );
  const tick = useCallback(async () => {
    const process = () => {
      if (!mounted.current) return;
      const clock = new Date();
      if (mounted.current) {
        setNow(clock);
        setPermission(capability() ? Notification.permission : "unsupported");
      }
      const { routines, sessions } = optionsRef.current;
      const notifications: ReminderItem[] = [];
      const latest = storageFailed.current
        ? stateRef.current
        : readState(stateRef.current);
      if (!latest.settings.enabled) return;
      const cutoff = new Date(clock);
      cutoff.setDate(cutoff.getDate() - 14);
      const cutoffDay = localDay(cutoff);
      const fresh = dueRoutines(
        routines,
        latest.settings,
        sessions,
        clock,
      ).filter((r) => !latest.seen.includes(reminderId(r.id, clock)));
      const existing = latest.inbox.map((item) => {
        const routine = routines.find((r) => r.id === item.routineId);
        if (
          !routine ||
          !routineScheduledForReminder(routine, item) ||
          routineCompletedForReminder(routine, sessions, item)
        )
          return { ...item, state: "dismissed" as const };
        return item;
      });
      const created: ReminderItem[] = fresh.map((r) => ({
        id: reminderId(r.id, clock),
        routineId: r.id,
        day: localDay(clock),
        createdAt: clock.toISOString(),
        dueAt: timeOnDate(clock, latest.settings.time).toISOString(),
        state: "due",
      }));
      const inbox = [...created, ...existing]
        .filter((i) => i.day >= cutoffDay)
        .slice(0, 250)
        .map((item) => {
          if (reminderNeedsDelivery(item, clock)) {
            const due = {
              ...item,
              state: "due" as const,
              notifiedAt: clock.toISOString(),
              delivery: "in-app" as const,
            };
            notifications.push(due);
            return due;
          }
          return item;
        });
      const next: ReminderState = {
        ...latest,
        inbox,
        seen: [
          ...created.map((i) => i.id),
          ...latest.seen.filter((id) => id.slice(0, 10) >= cutoffDay),
        ].slice(0, 2000),
      };
      if (JSON.stringify(next) !== JSON.stringify(latest)) commit(() => next);
      notifications.forEach((item) => {
        void deliver(item, next.settings);
      });
    };
    if (navigator.locks) {
      try {
        await navigator.locks.request("rebound-reminder-check", process);
      } catch {
        process();
      }
    } else process();
  }, [commit, deliver]);
  useEffect(() => {
    mounted.current = true;
    void tick();
    const timer = setInterval(() => {
      void tick();
    }, 15000);
    const resume = () => {
      if (document.visibilityState === "visible") void tick();
    };
    const sync = (event: StorageEvent) => {
      if (event.key === REMINDER_STORAGE_KEY) {
        const next = readState(stateRef.current);
        stateRef.current = next;
        setState(next);
        void tick();
      }
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("storage", sync);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("storage", sync);
    };
  }, [tick]);
  useEffect(() => {
    void tick();
  }, [options.routines, options.sessions, options.blocked, tick]);
  const setSettings = useCallback(
    (settings: ReminderSettings) => {
      if (!isReminderSettings(settings)) return;
      setError("");
      commit((latest) => ({
        ...latest,
        settings: {
          ...settings,
          browserNotifications:
            settings.browserNotifications &&
            capability() &&
            Notification.permission === "granted",
        },
      }));
      void tick();
    },
    [commit, tick],
  );
  const enableNotifications = async () => {
    setError("");
    if (!capability()) {
      setError(
        "Browser alerts need HTTPS and a compatible browser. You can still use the in-app inbox or calendar export.",
      );
      return;
    }
    try {
      const result =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      setPermission(result);
      if (result !== "granted") {
        setError(
          result === "denied"
            ? "Browser alerts are blocked. You can change this in your browser’s site settings, or use calendar reminders."
            : "Permission was not granted. Your in-app reminders still work.",
        );
        return;
      }
      await activeWorker();
      commit((latest) => ({
        ...latest,
        settings: { ...latest.settings, browserNotifications: true },
      }));
      setStatus(
        "Browser alerts enabled. Keep Rebound open for its reminder checks.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Browser alerts could not be enabled. Try calendar reminders.",
      );
    }
  };
  const sendTest = async () => {
    setError("");
    if (!capability() || Notification.permission !== "granted") {
      setError("Enable browser alerts before sending a test.");
      return;
    }
    try {
      const registration = await activeWorker();
      const copy = {
        title: "Your Rebound reminder is ready",
        body: "This is a test alert. Scheduled checks run while Rebound is open; imported calendar alerts are managed by your calendar.",
      };
      if (registration)
        await registration.showNotification(copy.title, {
          body: copy.body,
          icon: "/icons/rebound-192.png",
          tag: "rebound-test",
          data: { route: "reminders" },
        });
      else
        new Notification(copy.title, { body: copy.body, tag: "rebound-test" });
      setStatus(
        "A test alert was sent to your browser. Your operating system may silence it.",
      );
    } catch {
      setError(
        "The test could not be shown in this browser. Try calendar reminders instead.",
      );
    }
  };
  const snooze = (id: string, minutes = 15) => {
    const until = new Date(Date.now() + minutes * 60_000);
    commit((latest) => ({
      ...latest,
      inbox: latest.inbox.map((i) =>
        i.id === id
          ? {
              ...i,
              state: "snoozed",
              dueAt: until.toISOString(),
              notifiedAt: undefined,
              delivery: undefined,
            }
          : i,
      ),
    }));
    setStatus(
      "Reminder snoozed for " +
        minutes +
        " minutes. Keep Rebound open for its checks.",
    );
    void tick();
  };
  const dismiss = (id: string) => {
    commit((latest) => ({
      ...latest,
      inbox: latest.inbox.map((i) =>
        i.id === id ? { ...i, state: "dismissed" } : i,
      ),
    }));
    setStatus("Reminder dismissed for today.");
  };
  const clearHistory = () => {
    commit((latest) => ({ ...latest, inbox: [] }));
    setStatus(
      "Inbox cleared. Today’s delivered reminders will not be repeated.",
    );
  };
  const openReminder = (id: string) => {
    const item = stateRef.current.inbox.find((i) => i.id === id);
    const routine = optionsRef.current.routines.find(
      (r) => r.id === item?.routineId,
    );
    if (!routine) return;
    if (optionsRef.current.blocked) {
      setError(
        "Exercise is on hold. Review your symptoms and care advice before starting.",
      );
      return;
    }
    dismiss(id);
    optionsRef.current.onOpenRoutine(routine);
  };
  const exportCalendar = () => {
    const schedules = optionsRef.current.routines.filter((r) => r.days.length);
    if (!schedules.length) {
      setError(
        "Add weekdays to a saved routine before exporting calendar reminders.",
      );
      return;
    }
    const content = buildReminderCalendar(schedules, stateRef.current.settings);
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/calendar;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "rebound-reminders.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(
      "Calendar file downloaded. Import it into your calendar and check that alerts are enabled there.",
    );
  };
  return {
    settings: state.settings,
    setSettings,
    inbox: state.inbox,
    activeCount: activeReminders(state.inbox, now).length,
    nextReminder: nextRoutineReminder(
      options.routines,
      state.settings,
      options.sessions,
      now,
    ),
    permission,
    supported: capability(),
    error,
    status,
    persistenceError,
    enableNotifications,
    sendTest,
    snooze,
    dismiss,
    clearHistory,
    openReminder,
    exportCalendar,
    now,
  };
}
export type ReminderController = ReturnType<typeof useReminders>;
