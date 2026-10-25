export type CheckInAnswers = {
  onset: "" | "after" | "during" | "unknown";
  pain: number | null;
  function: "" | "normal" | "limited" | "unable";
  warning: "" | "none" | "urgent" | "emergency";
};
export const emptyAnswers: CheckInAnswers = {
  onset: "",
  pain: null,
  function: "",
  warning: "",
};
export type CheckInPlan = {
  level: "emergency" | "assessment" | "general";
  title: string;
  summary: string;
  steps: string[];
  questions: string[];
};
// This rule-based gate runs before any optional language-model request. Text is
// checked too, so a user cannot accidentally clear a concerning written symptom.
export function assessCheckIn(
  description: string,
  answers: CheckInAnswers,
): CheckInPlan | null {
  const text = description.toLowerCase();
  const emergencyText =
    /chest (?:pain|pressure)|can.?t breathe|cannot breathe|trouble breathing|shortness of breath|faint(?:ed|ing)|bladder|bowel|saddle numbness/.test(
      text,
    );
  const urgentText =
    /dark (?:urine|pee)|cola.colou?red|\bnumb(?:ness)?\b|\btingl|(?:sudden|sharp|severe) pain|(?:heard|felt) a pop|(?:can.?t|cannot|unable to) (?:walk|stand|bear weight)|\bred(?:ness)?\b|hot (?:joint|leg)|\bfever\b|one.sided.*(?:swelling|swollen)/.test(
      text,
    );
  if (answers.warning === "emergency" || emergencyText)
    return {
      level: "emergency",
      title: "Pause. Get emergency help.",
      summary:
        "These symptoms can need urgent emergency assessment. Do not exercise or wait for an AI reply.",
      steps: [
        "Contact your local emergency service now. In the US, call 911.",
        "If possible, ask someone nearby to stay with you.",
      ],
      questions: [],
    };
  if (
    answers.warning === "urgent" ||
    urgentText ||
    answers.function === "unable" ||
    (answers.pain !== null && answers.pain >= 7)
  )
    return {
      level: "assessment",
      title: "Get medical advice before a workout.",
      summary:
        "A check-in cannot establish the cause of these symptoms. Pause exercise and seek prompt medical assessment; severe or rapidly worsening symptoms need urgent care.",
      steps: [
        "Do not use a stretching or strengthening plan to test the symptoms.",
        "Tell the clinician when symptoms started, what changed, and whether you can use the area normally.",
      ],
      questions: [
        "Do these symptoms need an in-person assessment?",
        "What activity is safe while I wait?",
      ],
    };
  if (
    !description.trim() ||
    !answers.onset ||
    answers.pain === null ||
    !answers.function ||
    !answers.warning
  )
    return null;
  if (
    answers.onset !== "after" ||
    answers.function !== "normal" ||
    answers.pain > 3
  )
    return {
      level: "assessment",
      title: "Make room for an assessment.",
      summary:
        "Symptoms that start during activity, limit normal movement, are more than mild, or have an unclear onset deserve individual advice. This app cannot tell soreness from an injury.",
      steps: [
        "Pause the activity that brings on symptoms.",
        "Contact a qualified clinician before starting new exercises.",
        "Record changes and seek help sooner if symptoms worsen.",
      ],
      questions: [
        "Could this be an injury rather than ordinary soreness?",
        "Which movements, resistance, and dose are appropriate for me?",
      ],
    };
  return {
    level: "general",
    title: "An easier day, with a check-in later.",
    summary:
      "Mild symptoms after activity can have different causes. This is a general recovery-day draft, not a diagnosis or an injury treatment plan.",
    steps: [
      "Take a break from the workout that made the area sore.",
      "Keep usual light movement only if it is comfortable; do not force a stretch or add resistance.",
      "Make time for food, fluids, and your usual sleep routine.",
      "Check how you feel later. Seek professional advice if symptoms persist, worsen, or limit normal activity.",
    ],
    questions: [
      "When is it appropriate to return to my workout?",
      "Should I adjust my training load or get assessed?",
    ],
  };
}
