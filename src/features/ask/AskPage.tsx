import { useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, RotateCcw } from "lucide-react";
import {
  assessCheckIn,
  emptyAnswers,
  type CheckInAnswers,
} from "../../domain/checkIn";
import { clinic } from "../../services/clinic";

export function AskPage({ onJournal }: { onJournal: () => void }) {
  const [description, setDescription] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<CheckInAnswers>({ ...emptyAnswers });
  const [consent, setConsent] = useState(false);
  const [ai, setAi] = useState<{ summary: string; questions: string[] } | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const plan = started ? assessCheckIn(description, answers) : null;
  const update = (change: Partial<CheckInAnswers>) => {
    setAnswers((a) => ({ ...a, ...change }));
    setAi(null);
    setError("");
  };
  async function explain() {
    if (!clinic || !consent || plan?.level !== "general") return;
    setPending(true);
    setError("");
    try {
      const { data, error } = await clinic.functions.invoke(
        "recovery-assistant",
        { body: { description, answers } },
      );
      if (error) throw error;
      if (
        !data ||
        typeof data.summary !== "string" ||
        !Array.isArray(data.questions) ||
        data.questions.some((q: unknown) => typeof q !== "string")
      )
        throw Error("The assistant returned an invalid response.");
      setAi(data);
    } catch {
      setError(
        "The AI service is unavailable or you are not signed in. Your local check-in draft is still available.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="ask-layout">
      <section className="ask-main feature-card">
        <span className="eyebrow">
          <Sparkles size={15} /> ASK REBOUND
        </span>
        <h2>Start with how you feel.</h2>
        <p>
          Describe what happened. A few follow-up questions help you decide on a
          sensible next step. This check-in does not diagnose an injury.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (description.trim()) {
              setStarted(true);
              setAi(null);
            }
          }}
        >
          <label htmlFor="ask-description">What’s on your mind?</label>
          <textarea
            id="ask-description"
            maxLength={2000}
            required
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setStarted(false);
              setAi(null);
              setAnswers({ ...emptyAnswers });
            }}
            placeholder="I just finished working out and my hamstrings feel sore…"
          />
          <button className="dark" type="submit">
            Explore next steps <ArrowRight size={16} />
          </button>
        </form>
        {!started && (
          <button
            className="example-prompt"
            onClick={() => {
              setDescription(
                "I finished working out yesterday and my hamstrings feel sore.",
              );
              setStarted(true);
            }}
          >
            Try a post-workout soreness check-in
          </button>
        )}
        {started && plan?.level !== "emergency" && (
          <div className="follow-up">
            <h3>A little more context</h3>
            <fieldset>
              <legend>When did it start?</legend>
              {[
                ["after", "After activity"],
                ["during", "During activity / a sudden event"],
                ["unknown", "I’m unsure"],
              ].map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={answers.onset === value}
                  onClick={() =>
                    update({ onset: value as CheckInAnswers["onset"] })
                  }
                >
                  {text}
                </button>
              ))}
            </fieldset>
            <label htmlFor="ask-pain">
              Discomfort right now · {answers.pain ?? "not selected"} / 10
            </label>
            <input
              id="ask-pain"
              type="range"
              min="0"
              max="10"
              value={answers.pain ?? 0}
              onChange={(e) => update({ pain: Number(e.target.value) })}
            />
            <button className="text-button" onClick={() => update({ pain: 0 })}>
              No discomfort (0)
            </button>
            <fieldset>
              <legend>Can you move and use the area normally?</legend>
              {[
                ["normal", "Yes, as usual"],
                ["limited", "It’s limited"],
                ["unable", "I can’t use it / bear weight"],
              ].map(([value, text]) => (
                <button
                  key={value}
                  aria-pressed={answers.function === value}
                  onClick={() =>
                    update({ function: value as CheckInAnswers["function"] })
                  }
                >
                  {text}
                </button>
              ))}
            </fieldset>
            <label htmlFor="ask-warning">Any concerning changes?</label>
            <select
              id="ask-warning"
              value={answers.warning}
              onChange={(e) =>
                update({ warning: e.target.value as CheckInAnswers["warning"] })
              }
            >
              <option value="">Select an answer</option>
              <option value="none">None of the symptoms below</option>
              <option value="urgent">
                Sharp / sudden pain, swelling, weakness, numbness, fever, or
                dark urine
              </option>
              <option value="emergency">
                Chest pain, breathing trouble, fainting, or new bladder / bowel
                changes
              </option>
            </select>
          </div>
        )}
        {plan && (
          <section className={`checkin-plan ${plan.level}`} aria-live="polite">
            <span className="eyebrow">
              {plan.level === "general"
                ? "GENERAL RECOVERY-DAY DRAFT"
                : "PAUSE EXERCISE"}
            </span>
            <h3>{plan.title}</h3>
            <p>{plan.summary}</p>
            <ol>
              {plan.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {plan.questions.length > 0 && (
              <>
                <h4>Questions for your clinician</h4>
                <ul>
                  {plan.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </>
            )}
            <button className="outline" onClick={onJournal}>
              Save how you feel in your journal
            </button>
          </section>
        )}
        {plan?.level === "general" && (
          <section className="assistant-option">
            <h3>Optional AI explanation</h3>
            <p>
              The draft above uses local rules. When AI explanations are
              available, you can ask for help understanding it and preparing
              questions for your clinician. It does not prescribe exercises.
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Send only this description and these answers to OpenAI through
              my clinic service. My journal and video are not included.
            </label>
            <button
              className="outline"
              disabled={!clinic || !consent || pending}
              onClick={explain}
            >
              {pending
                ? "Preparing an explanation…"
                : "Ask for an AI explanation"}
            </button>
            {!clinic && (
              <small>AI explanations aren’t available here yet. Your local check-in still works.</small>
            )}
            {error && <p role="alert">{error}</p>}
            {ai && (
              <div className="ai-explanation">
                <strong>
                  AI-generated explanation · check with your clinician
                </strong>
                <p>{ai.summary}</p>
                <ul>
                  {ai.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        {started && (
          <button
            className="text-button"
            onClick={() => {
              setStarted(false);
              setAnswers({ ...emptyAnswers });
              setAi(null);
            }}
          >
            <RotateCcw size={14} /> Start over
          </button>
        )}
      </section>
      <aside className="ask-aside feature-card">
        <ShieldCheck size={26} />
        <h3>Helpful starts with careful.</h3>
        <p>
          No symptom search can confirm that exercise is safe. We ask about
          onset, discomfort, normal function, and warning signs before showing a
          general draft.
        </p>
        <p>
          New injuries, more than mild symptoms, and concerning changes pause
          exercise suggestions.
        </p>
        <a
          href="https://www.nhs.uk/conditions/sprains-and-strains/"
          target="_blank"
          rel="noreferrer"
        >
          NHS · When to get help
        </a>
        <small>
          Your check-in stays on this page unless you explicitly request an AI
          explanation.
        </small>
      </aside>
    </div>
  );
}
