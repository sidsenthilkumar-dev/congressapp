import { useState } from "react";
import {
  CalendarDays,
  Plus,
  ArrowRight,
  Check,
  Bookmark,
  Trash2,
  FileText,
  ShieldCheck,
  ChevronRight,
  X,
} from "lucide-react";
import { exercises, exerciseById } from "../../domain/exercises";
import type { Routine, Session } from "../../domain/types";
import "./routines.css";
const days = [
  { day: 1, label: "M" },
  { day: 2, label: "T" },
  { day: 3, label: "W" },
  { day: 4, label: "T" },
  { day: 5, label: "F" },
  { day: 6, label: "S" },
  { day: 0, label: "S" },
];
const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
type Props = {
  routines: Routine[];
  bookmarks: string[];
  sessions: Session[];
  onSave: (routine: Routine) => void;
  onDelete: (id: string) => void;
  onStart: (routine: Routine) => void;
  onOpen: (id: string) => void;
};
export function RoutinesPage({
  routines,
  bookmarks,
  sessions,
  onSave,
  onDelete,
  onStart,
  onOpen,
}: Props) {
  const [editing, setEditing] = useState<Routine | null>(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [schedule, setSchedule] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");
  const [tab, setTab] = useState<"routines" | "saved">("routines");
  function edit(r?: Routine) {
    setEditing(
      r || {
        id: crypto.randomUUID(),
        name: "",
        exerciseIds: [],
        notes: "",
        days: [],
        createdAt: new Date().toISOString(),
      },
    );
    setName(r?.name || "");
    setSelected(r?.exerciseIds || []);
    setNotes(r?.notes || "");
    setSchedule(r?.days || []);
    setError("");
  }
  function save() {
    if (!name.trim()) {
      setError("Give your routine a name.");
      return;
    }
    if (!selected.length) {
      setError("Choose at least one movement.");
      return;
    }
    onSave({
      ...editing!,
      name: name.trim(),
      exerciseIds: selected,
      notes,
      days: schedule,
    });
    setEditing(null);
  }
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekly = sessions.filter((s) => new Date(s.date) >= weekStart).length;
  return (
    <section className="routines-page">
      <div className="routine-hero">
        <div>
          <span className="eyebrow">CONSISTENCY STARTS WITH A LITTLE PLAN</span>
          <h2>
            Your pace.
            <br />
            Your own small ritual.
          </h2>
          <p>
            Keep your clinician-cleared movements, notes, and weekly intentions
            together. A plan you can come back to.
          </p>
          <button className="dark" onClick={() => edit()}>
            <Plus size={15} />
            Create a routine
          </button>
        </div>
        <div className="routine-week">
          <div>
            <CalendarDays size={18} />
            <span>THIS WEEK, AT YOUR PACE</span>
          </div>
          <div className="routine-week-days">
            {days.map(({ day, label }) => (
              <span
                className={new Date().getDay() === day ? "today" : ""}
                key={day}
              >
                <small>{label}</small>
                <b>
                  {routines.some((r) => r.days.includes(day)) ? (
                    <Check size={15} />
                  ) : (
                    <span />
                  )}
                </b>
              </span>
            ))}
          </div>
          <p>
            {weekly} session{weekly !== 1 ? "s" : ""} logged this week{" "}
            <span>·</span> {routines.length} personal routine
            {routines.length !== 1 ? "s" : ""}
          </p>
          <div className="routine-week-bottom">
            <span />
            Showing up is a small win.
          </div>
        </div>
      </div>
      <div className="routine-section-heading">
        <div className="library-tabs">
          <button
            className={tab === "routines" ? "selected" : ""}
            onClick={() => setTab("routines")}
          >
            <CalendarDays size={15} />
            My routines <span>{routines.length}</span>
          </button>
          <button
            className={tab === "saved" ? "selected" : ""}
            onClick={() => setTab("saved")}
          >
            <Bookmark size={15} />
            Saved movements <span>{bookmarks.length}</span>
          </button>
        </div>
        <span>Stored on this device</span>
      </div>
      {editing && (
        <section className="routine-editor">
          <div className="section-heading">
            <h2>
              {routines.some((r) => r.id === editing.id)
                ? "Edit your routine"
                : "Make a little room for movement."}
            </h2>
            <button
              aria-label="Close routine editor"
              onClick={() => setEditing(null)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="routine-editor-grid">
            <div>
              <label htmlFor="routine-name">Routine name</label>
              <input
                id="routine-name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My afternoon reset"
              />
              <label>
                Days I’d like to show up <span>(optional)</span>
              </label>
              <div className="schedule-buttons">
                {days.map(({ day, label }) => (
                  <button
                    key={day}
                    aria-label={dayNames[day]}
                    aria-pressed={schedule.includes(day)}
                    className={schedule.includes(day) ? "selected" : ""}
                    onClick={() =>
                      setSchedule(
                        schedule.includes(day)
                          ? schedule.filter((d) => d !== day)
                          : [...schedule, day],
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label htmlFor="clinician-notes">
                Notes from my clinician <span>(optional)</span>
              </label>
              <textarea
                id="clinician-notes"
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your prescribed range, dose, restrictions, or questions for your next appointment."
              />
              <p className="routine-note">
                <ShieldCheck size={14} />
                This organizes your plan. It does not create a treatment
                prescription.
              </p>
            </div>
            <fieldset>
              <legend>
                Choose your movements <span>{selected.length} selected</span>
              </legend>
              <div className="movement-picker">
                {exercises.map((e) => (
                  <label
                    key={e.id}
                    className={selected.includes(e.id) ? "picked" : ""}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(e.id)}
                      onChange={() =>
                        setSelected(
                          selected.includes(e.id)
                            ? selected.filter((id) => id !== e.id)
                            : [...selected, e.id],
                        )
                      }
                    />
                    <span>
                      <strong>{e.name}</strong>
                      <small>
                        {e.area} ·{" "}
                        {e.camera ? "Camera or manual" : "Manual guide"}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          {error && (
            <p className="routine-error" role="alert">
              {error}
            </p>
          )}
          <div className="routine-editor-actions">
            <span>
              {selected.length} movement{selected.length !== 1 ? "s" : ""} · No
              automatic dosing
            </span>
            <button className="outline" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="dark" onClick={save}>
              Save routine <Check size={15} />
            </button>
          </div>
        </section>
      )}
      {tab === "routines" ? (
        <div className="routine-grid">
          {routines.map((r) => (
            <article className="routine-card" key={r.id}>
              <div className="routine-card-top">
                <span>
                  <CalendarDays size={17} />
                </span>
                <button
                  aria-label={"Delete " + r.name}
                  onClick={() => setDeleting(deleting === r.id ? "" : r.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <h3>{r.name}</h3>
              <p className="routine-days">
                {r.days.length
                  ? r.days.map((d) => dayNames[d].slice(0, 3)).join(" · ")
                  : "On your own schedule"}
              </p>
              <div className="routine-movements">
                {r.exerciseIds.map((id, i) => (
                  <button key={id} onClick={() => onOpen(id)}>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <span>
                      {exerciseById.get(id)?.name || "Unavailable movement"}
                    </span>
                    <ChevronRight size={13} />
                  </button>
                ))}
              </div>
              {r.notes && (
                <div className="clinician-note">
                  <FileText size={13} />
                  <p>{r.notes}</p>
                </div>
              )}
              {deleting === r.id ? (
                <div className="delete-confirm">
                  <span>Remove this routine?</span>
                  <button onClick={() => setDeleting("")}>Keep</button>
                  <button
                    onClick={() => {
                      onDelete(r.id);
                      setDeleting("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="routine-card-actions">
                  <button onClick={() => edit(r)}>Edit routine</button>
                  <button className="dark" onClick={() => onStart(r)}>
                    Begin routine <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </article>
          ))}
          {routines.length === 0 && !editing && (
            <div className="routine-empty">
              <span>
                <CalendarDays size={27} />
              </span>
              <h3>Build a routine that feels like you.</h3>
              <p>
                Add your cleared movements and clinician notes.
                <br />
                Your next small step will be waiting here.
              </p>
              <button className="outline" onClick={() => edit()}>
                Create my first routine <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="saved-movements-list">
          {bookmarks.map((id) => {
            const e = exerciseById.get(id);
            return (
              e && (
                <button key={id} onClick={() => onOpen(id)}>
                  <span className="saved-movement-icon">
                    <Bookmark size={17} />
                  </span>
                  <div>
                    <h3>{e.name}</h3>
                    <p>
                      {e.area} · {e.equipment}
                    </p>
                  </div>
                  <ArrowRight size={17} />
                </button>
              )
            );
          })}
          {!bookmarks.length && (
            <div className="empty">
              <Bookmark />
              <p>Save movements from the exercise library to find them here.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
export function TodayRoutine({
  routines,
  onOpen,
}: {
  routines: Routine[];
  onOpen: () => void;
}) {
  const today = routines.filter((r) => r.days.includes(new Date().getDay()));
  return (
    <button className="today-routine" onClick={onOpen}>
      <span className="today-routine-icon">
        <CalendarDays size={20} />
      </span>
      <div>
        <small>A LITTLE PLAN FOR TODAY</small>
        <h3>
          {today.length
            ? today[0].name
            : "Make space for your next small step."}
        </h3>
        <p>
          {today.length
            ? today[0].exerciseIds.length +
              " movements · Your clinician’s plan, at your pace."
            : "Save your cleared movements in a personal routine."}
        </p>
      </div>
      <ArrowRight size={18} />
    </button>
  );
}
