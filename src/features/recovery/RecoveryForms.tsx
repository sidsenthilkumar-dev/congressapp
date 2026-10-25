import { useState } from "react";
import { Check, Info, ShieldCheck } from "lucide-react";
import {
  regions,
  conditions,
  stages,
  symptomOptions,
  assessProfile,
  type RecoveryProfile,
} from "../../domain/recovery";
import type { Entry } from "../../domain/types";
export function RecoveryProfileForm({
  profile,
  pain,
  onSave,
}: {
  profile: RecoveryProfile;
  pain?: number;
  onSave: (profile: RecoveryProfile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const safety = assessProfile(draft, pain);
  return (
    <>
      <span className="eyebrow">
        YOUR RECOVERY PROFILE · {conditions.length} TOPICS
      </span>
      <h2>Let’s make this yours.</h2>
      <p>
        Record an assessed condition or choose “Not diagnosed / unsure.” This
        journal does not diagnose your symptoms.
      </p>
      <label htmlFor="area">Recovery area</label>
      <select
        id="area"
        value={draft.area}
        onChange={(e) =>
          setDraft({
            ...draft,
            area: e.target.value,
            condition: "Not diagnosed / unsure",
          })
        }
      >
        {regions.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <label htmlFor="condition">Injury or recovery topic</label>
      <select
        id="condition"
        value={draft.condition || "General stiffness / movement confidence"}
        onChange={(e) => setDraft({ ...draft, condition: e.target.value })}
      >
        <option>Not diagnosed / unsure</option>
        {conditions
          .filter(
            (c) => c.area === draft.area && c.name !== "Not diagnosed / unsure",
          )
          .map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
      </select>
      <label htmlFor="stage">Where are you in recovery?</label>
      <select
        id="stage"
        value={draft.stage || "Ongoing / assessed"}
        onChange={(e) => setDraft({ ...draft, stage: e.target.value })}
      >
        {stages.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <label htmlFor="side">Side</label>
      <select
        id="side"
        value={draft.side}
        onChange={(e) => setDraft({ ...draft, side: e.target.value })}
      >
        {["Right", "Left", "Both", "Not applicable"].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <label>What are you noticing?</label>
      <div className="energy-options wrap">
        {symptomOptions.map((x) => (
          <button
            key={x}
            className={draft.symptoms.includes(x) ? "selected" : ""}
            aria-pressed={draft.symptoms.includes(x)}
            onClick={() =>
              setDraft({
                ...draft,
                symptoms: draft.symptoms.includes(x)
                  ? draft.symptoms.filter((s) => s !== x)
                  : [...draft.symptoms, x],
              })
            }
          >
            {x}
          </button>
        ))}
      </div>
      <div className={"profile-safety " + safety.level}>
        <ShieldCheck size={18} />
        <div>
          <strong>{safety.title}</strong>
          <p>{safety.message}</p>
        </div>
      </div>
      <label htmlFor="goal">My goal</label>
      <select
        id="goal"
        value={draft.goal}
        onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
      >
        {[
          "Move comfortably",
          "Return to my sport",
          "Build daily confidence",
          "Stay active",
        ].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <div className="notice">
        <Info size={17} />
        <span>
          New swelling, worsening pain, or unexplained weakness should be
          assessed by a healthcare professional.
        </span>
      </div>
      <button className="dark full" onClick={() => onSave(draft)}>
        Save recovery profile <Check size={16} />
      </button>
    </>
  );
}
export function DailyCheckInForm({
  existing,
  onSave,
}: {
  existing?: Entry;
  onSave: (entry: Entry) => void;
}) {
  const [pain, setPain] = useState(existing?.pain ?? 3);
  const [energy, setEnergy] = useState(existing?.energy ?? "Okay");
  const [note, setNote] = useState(existing?.note ?? "");
  return (
    <>
      <span className="eyebrow">A MOMENT FOR YOU</span>
      <h2>How are you feeling today?</h2>
      <p>There’s no right answer. Just listen to your body.</p>
      <label>
        Discomfort level <strong>{pain}/10</strong>
      </label>
      <input
        aria-label="Discomfort level"
        type="range"
        min="0"
        max="10"
        value={pain}
        onChange={(e) => setPain(+e.target.value)}
      />
      <div className="range-labels">
        <span>No discomfort</span>
        <span>Severe discomfort</span>
      </div>
      {pain >= 7 && (
        <div className="warning">
          Pause exercise and contact a healthcare professional. Seek urgent care
          for severe sudden pain, new numbness or weakness, chest pain, or
          trouble breathing.
        </div>
      )}
      <label>How’s your energy?</label>
      <div className="energy-options">
        {["Low", "Okay", "Good", "Great"].map((x) => (
          <button
            className={energy === x ? "selected" : ""}
            key={x}
            aria-pressed={energy === x}
            onClick={() => setEnergy(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <label htmlFor="note">
        Anything you want to remember? <small>(optional)</small>
      </label>
      <textarea
        id="note"
        maxLength={2000}
        placeholder="What felt better? What felt different?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        className="dark full"
        onClick={() =>
          onSave({ date: new Date().toISOString(), pain, energy, note })
        }
      >
        Save my check-in <Check size={16} />
      </button>
    </>
  );
}
