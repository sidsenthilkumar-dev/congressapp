import { useState, useEffect, lazy, Suspense } from "react";
import {
  ArrowRight,
  House,
  X,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { exercises, exerciseById } from "../domain/exercises";
import { AppShell } from "./AppShell";
import { RecoverySummary } from "../features/overview/RecoverySummary";
import { TodayHub } from "../features/overview/TodayHub";
import { usePageNavigation } from "../hooks/usePageNavigation";
import { routineProgress } from "../domain/dailyPlan";
import { useReminders } from "../hooks/useReminders";
import { RemindersPage } from "../features/reminders/RemindersPage";
import { CoachPage } from "../features/movement/CoachPage";
import { RecoveryPage } from "../features/recovery/RecoveryPage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { useRecoveryData } from "../hooks/useRecoveryData";
import {
  RecoveryProfileForm,
  DailyCheckInForm,
} from "../features/recovery/RecoveryForms";
import { ExerciseLibraryPage } from "../features/exercises/ExerciseLibraryPage";
import { RoutinesPage } from "../features/routines/RoutinesPage";
import type { Routine, SessionInstructions } from "../domain/types";
import { MovementSession } from "../features/movement/MovementSession";
import {
  RecoveryLibrary,
  SafetyCard,
} from "../features/recovery/RecoveryLibrary";
import { assessProfile } from "../domain/recovery";
import {useNativeHost} from "../services/nativeHost";
const AskPage = lazy(() =>
  import("../features/ask/AskPage").then((module) => ({
    default: module.AskPage,
  })),
);
const ClinicPage = lazy(() =>
  import("../features/clinic/ClinicPage").then((module) => ({
    default: module.ClinicPage,
  })),
);
import "../styles/care.css";
export function App() {
  const [page, setPage] = usePageNavigation();
  const [modal, setModal] = useState("");
  const {
    profile: injury,
    setProfile: setInjury,
    entries,
    setEntries,
    sessions,
    setSessions,
    cleared,
    setCleared,
    bookmarks,
    toggleBookmark,
    routines,
    saveRoutine,
    deleteRoutine,
    storageError,
  } = useRecoveryData();
  const [selected, setSelected] = useState(0);
  const [clinicInstructions, setClinicInstructions] =
    useState<SessionInstructions | null>(null);
  const [toast, setToast] = useState("");
  const [routineQueue, setRoutineQueue] = useState<string[]>([]);
  const [activeRun, setActiveRun] = useState<{
    routineId: string;
    runId: string;
  } | null>(null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = document.querySelector(".modal") as HTMLElement | null;
    const focusable = () =>
      Array.from(
        container?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, textarea, [tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal("");
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [modal, selected]);
  const checkToday = entries.some(
    (e) => new Date(e.date).toDateString() === new Date().toDateString(),
  );
  const safety = assessProfile(injury, entries.at(-1)?.pain);
  function selectCondition(area: string, condition: string) {
    setInjury({ ...injury, area, condition });
    setCleared(false);
    setModal("injury");
  }
  function openExercise(i: number) {
    setClinicInstructions(null);
    setRoutineQueue([]);
    setActiveRun(null);
    setSelected(i);
    setModal("exercise");
  }
  function openExerciseId(id: string) {
    const index = exercises.findIndex((e) => e.id === id);
    if (index >= 0) openExercise(index);
  }
  function startRoutine(routine: Routine) {
    setClinicInstructions(null);
    if (safety.blocked) {
      setToast(safety.title);
      return;
    }
    const progress = routineProgress(routine, sessions);
    const ids = (
      progress.complete ? routine.exerciseIds : progress.remaining
    ).filter((id) => exerciseById.has(id));
    if (!ids.length) return;
    setActiveRun({
      routineId: routine.id,
      runId: progress.runId || crypto.randomUUID(),
    });
    setRoutineQueue(ids.slice(1));
    setSelected(exercises.findIndex((e) => e.id === ids[0]));
    setModal("exercise");
  }
  const reminders = useReminders({
    routines,
    sessions,
    blocked: safety.blocked,
    onOpenRoutine: (routine) => {
      setPage("Overview");
      startRoutine(routine);
    },
  });
  useNativeHost({profile:injury,entries,sessions,routines,safety,modal,onOpen:openExerciseId,onStart:startRoutine,onNavigate:setPage,onCheckIn:()=>setModal("checkin"),onClose:()=>setModal("")});
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.data?.type === "OPEN_REMINDERS") setPage("Reminders");
    };
    navigator.serviceWorker?.addEventListener("message", receive);
    const open = () => setPage("Reminders");
    window.addEventListener("rebound:open-reminders", open);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", receive);
      window.removeEventListener("rebound:open-reminders", open);
    };
  }, [setPage]);
  return (
    <div className="app">
      <AppShell
        page={page}
        setPage={setPage}
        checkToday={checkToday}
        onDailyCheckIn={() => setModal("checkin")}
        onSettings={() => setModal("settings")}
        reminderCount={reminders.activeCount}
      >
        {page === "Ask Rebound" && (
          <Suspense fallback={<p role="status">Opening your check-in…</p>}>
            <AskPage onJournal={() => setModal("checkin")} />
          </Suspense>
        )}
        {page === "Clinic" && (
          <Suspense fallback={<p role="status">Opening your clinic…</p>}>
            <ClinicPage
              onOpen={(id, instructions) => {
                openExerciseId(id);
                setClinicInstructions(instructions);
              }}
              onImport={(plan) => {
                saveRoutine({
                  id: crypto.randomUUID(),
                  name: plan.title,
                  notes:
                    plan.notes +
                    "\n" +
                    plan.items
                      .map(
                        (i) =>
                          `${exerciseById.get(i.exerciseId)?.name}: ${i.note}${i.reps ? ` · ${i.reps} reps` : ""}`,
                      )
                      .join("\n"),
                  exerciseIds: plan.items.map((i) => i.exerciseId),
                  days: [],
                  createdAt: new Date().toISOString(),
                });
                setToast(
                  "Plan added to your routines. Safety holds remain in place.",
                );
              }}
            />
          </Suspense>
        )}
        {page === "My recovery" && (
          <RecoverySummary
            injury={injury}
            entries={entries}
            sessions={sessions}
            onEdit={() => setModal("injury")}
            onNavigate={setPage}
            onOpen={openExercise}
          />
        )}
        {(page === "My recovery" ||
          (page === "Overview" && safety.blocked)) && (
          <SafetyCard
            profile={injury}
            pain={entries.at(-1)?.pain}
            onEdit={() => setModal("injury")}
          />
        )}
        {page === "Injury library" && (
          <RecoveryLibrary profile={injury} onSelect={selectCondition} />
        )}
        {page === "Overview" && (
          <TodayHub
            profile={injury}
            routines={routines}
            sessions={sessions}
            entries={entries}
            onStart={startRoutine}
            onOpen={openExercise}
            onNavigate={setPage}
            onEdit={() => setModal("injury")}
            onCheckIn={() => setModal("checkin")}
            remindersEnabled={reminders.settings.enabled}
          />
        )}
        {page === "Reminders" && (
          <RemindersPage
            controller={reminders}
            routines={routines}
            blocked={safety.blocked}
            onPlan={() => setPage("My routines")}
          />
        )}
        {page === "My routines" && (
          <RoutinesPage
            routines={routines}
            bookmarks={bookmarks}
            sessions={sessions}
            onSave={(r) => {
              saveRoutine(r);
              setToast(
                "Your routine is saved. A small step, ready when you are.",
              );
            }}
            onDelete={(id) => {
              deleteRoutine(id);
              setToast("Routine removed.");
            }}
            onStart={startRoutine}
            onOpen={openExerciseId}
          />
        )}
        {storageError && (
          <div className="warning" role="alert">
            Your browser could not save the latest changes. Export your journal
            before closing this page.
          </div>
        )}
        {page === "Exercise library" && (
          <>
            <SafetyCard
              profile={injury}
              pain={entries.at(-1)?.pain}
              onEdit={() => setModal("injury")}
            />
            <ExerciseLibraryPage
              bookmarks={bookmarks}
              onBookmark={toggleBookmark}
              onOpen={openExerciseId}
              onRoutines={() => setPage("My routines")}
            />
            <div className="notice">
              <Info size={18} />
              <span>
                These are general movement examples, not a treatment plan. Only
                try movements a qualified clinician has cleared for your
                condition.
              </span>
            </div>
          </>
        )}
        {page === "AI movement coach" && (
          <CoachPage
            injury={injury}
            entries={entries}
            onEdit={() => setModal("injury")}
            onOpen={openExercise}
          />
        )}
        {page === "My recovery" && (
          <RecoveryPage
            injury={injury}
            entries={entries}
            onEdit={() => setModal("injury")}
            onCheckIn={() => setModal("checkin")}
            onNavigate={setPage}
          />
        )}
        {page === "My progress" && (
          <ProgressPage
            injury={injury}
            entries={entries}
            sessions={sessions}
            routines={routines}
            bookmarks={bookmarks}
            onNotice={setToast}
          />
        )}
      </AppShell>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal("")}>
          <div
            className={"modal " + (modal === "exercise" ? "wide" : "")}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "exercise"
                ? exercises[selected].name
                : modal === "injury"
                  ? "Recovery profile"
                  : modal === "checkin"
                    ? "Daily check-in"
                    : "Settings"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Close dialog"
              onClick={() => setModal("")}
            >
              <X size={20} />
            </button>
            {modal === "checkin" && (
              <DailyCheckInForm
                existing={entries.find(
                  (e) =>
                    new Date(e.date).toDateString() ===
                    new Date().toDateString(),
                )}
                onSave={(entry) => {
                  setEntries((items) => [
                    ...items.filter(
                      (e) =>
                        new Date(e.date).toDateString() !==
                        new Date().toDateString(),
                    ),
                    entry,
                  ]);
                  setModal("");
                  setToast(
                    "Check-in saved. A little self-awareness goes a long way.",
                  );
                }}
              />
            )}
            {modal === "injury" && (
              <RecoveryProfileForm
                profile={injury}
                pain={entries.at(-1)?.pain}
                onSave={(profile) => {
                  setInjury(profile);
                  setModal("");
                  setToast("Your recovery profile is updated.");
                }}
              />
            )}
            {modal === "settings" && (
              <>
                <span className="eyebrow">YOUR PERSONAL SPACE</span>
                <div className="install-note">
                  <House size={22} />
                  <div>
                    <h3>Keep Rebound on your home screen.</h3>
                    <p>A free web-app option, once hosted on HTTPS.</p>
                    <ol>
                      <li>
                        iPhone: open in Safari → Share → Add to Home Screen.
                      </li>
                      <li>
                        Android: open the browser menu → Install app / Add to
                        Home Screen.
                      </li>
                    </ol>
                  </div>
                </div>
                <h2>Simple. Private. Yours.</h2>
                <p>
                  Your profile and progress are stored in this browser. No
                  account is needed. Clearing browser data will remove your
                  journal.
                </p>
                <div className="notice">
                  <ShieldCheck size={22} />
                  <span>
                    Camera frames stay on your device. The local pose model
                    loads when you start the coach. Camera access requires HTTPS
                    or localhost.
                  </span>
                </div>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={cleared}
                    onChange={(e) => setCleared(e.target.checked)}
                  />
                  A healthcare professional has cleared me for these movements.
                </label>
                <button
                  className="outline full"
                  onClick={() => {
                    setModal("");
                    setPage("My progress");
                  }}
                >
                  View & export my journal <ArrowRight size={15} />
                </button>
              </>
            )}
            {modal === "exercise" && (
              <MovementSession
                key={exercises[selected].id}
                exercise={exercises[selected]}
                safetyBlocked={safety.blocked}
                safetyMessage={safety.message}
                instructions={
                  clinicInstructions ||
                  (activeRun
                    ? {
                        note:
                          routines.find((r) => r.id === activeRun.routineId)
                            ?.notes || "",
                        source: "Saved routine notes",
                      }
                    : undefined)
                }
                onSave={(reps, details) => {
                  setSessions((items) => [
                    ...items,
                    {
                      date: new Date().toISOString(),
                      name: exercises[selected].name,
                      reps,
                      exerciseId: exercises[selected].id,
                      ...(activeRun
                        ? {
                            ...activeRun,
                            routineFinished: routineQueue.length === 0,
                          }
                        : {}),
                      ...details,
                    },
                  ]);
                  if (routineQueue.length) {
                    setSelected(
                      exercises.findIndex((e) => e.id === routineQueue[0]),
                    );
                    setRoutineQueue(routineQueue.slice(1));
                    setToast("Session saved. Your next movement is ready.");
                  } else {
                    setModal("");
                    setActiveRun(null);
                    setToast("Session saved. That’s another step forward.");
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
