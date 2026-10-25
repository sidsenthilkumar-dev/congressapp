import { useState } from "react";
import { exercises, exerciseById } from "../../domain/exercises";
import { parsePlan, type ClinicPlan } from "../../services/clinic";
export function ClinicPlanComposer({
  busy,
  onSend,
}: {
  busy: boolean;
  onSend: (plan: ClinicPlan["content"]) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [details, setDetails] = useState<
    Record<string, { note: string; reps: string }>
  >({});
  const [error, setError] = useState("");
  function update(id: string, change: Partial<{ note: string; reps: string }>) {
    setDetails((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { note: "", reps: "" }), ...change },
    }));
  }
  return (
    <form
      className="clinic-author"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        try {
          const content = parsePlan({
            title,
            notes,
            items: selected.map((exerciseId) => ({
              exerciseId,
              note:
                details[exerciseId]?.note ||
                "Follow the individual instructions above.",
              ...(details[exerciseId]?.reps
                ? { reps: Number(details[exerciseId].reps) }
                : {}),
            })),
          });
          await onSend(content);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Check the plan details.");
        }
      }}
    >
      <h3>Send an exercise plan</h3>
      <label>
        Plan title
        <input
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        Overall restrictions and progression
        <textarea
          required
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="clinic-exercise-choices">
        {exercises.map((ex) => (
          <label key={ex.id}>
            <input
              type="checkbox"
              checked={selected.includes(ex.id)}
              disabled={
                busy || (selected.length >= 12 && !selected.includes(ex.id))
              }
              onChange={(e) =>
                setSelected((current) =>
                  e.target.checked
                    ? [...current, ex.id]
                    : current.filter((id) => id !== ex.id),
                )
              }
            />
            {ex.name}
          </label>
        ))}
      </div>
      {selected.map((id) => (
        <div className="clinic-plan-item" key={id}>
          <strong>{exerciseById.get(id)?.name}</strong>
          <label>
            Individual range, equipment, and instructions
            <textarea
              required
              maxLength={1000}
              value={details[id]?.note || ""}
              onChange={(e) => update(id, { note: e.target.value })}
            />
          </label>
          <label>
            Rep target (optional)
            <input
              type="number"
              min="1"
              max="200"
              value={details[id]?.reps || ""}
              onChange={(e) => update(id, { reps: e.target.value })}
            />
          </label>
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
      <button className="dark" disabled={busy}>
        Send to selected patient
      </button>
    </form>
  );
}
