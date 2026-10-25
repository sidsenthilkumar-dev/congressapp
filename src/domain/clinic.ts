import { exerciseById } from "./exercises";
export type ClinicPlan = {
  id: string;
  connection_id: string;
  created_at: string;
  content: {
    title: string;
    notes: string;
    items: { exerciseId: string; note: string; reps?: number }[];
  };
};
export function parsePlan(input: unknown): ClinicPlan["content"] {
  const p = input as ClinicPlan["content"];
  if (
    !p ||
    typeof p.title !== "string" ||
    !p.title.trim() ||
    p.title.length > 100 ||
    typeof p.notes !== "string" ||
    p.notes.length > 2000 ||
    !Array.isArray(p.items) ||
    !p.items.length ||
    p.items.length > 12
  )
    throw Error(
      "A plan needs a title and 1–12 known exercises, with short notes.",
    );
  for (const i of p.items)
    if (
      !i ||
      !exerciseById.has(i.exerciseId) ||
      typeof i.note !== "string" ||
      i.note.length > 1000 ||
      (i.reps !== undefined &&
        (!Number.isInteger(i.reps) || i.reps < 1 || i.reps > 200))
    )
      throw Error(
        "Check the exercise, notes, and optional clinician-set rep target.",
      );
  if (new Set(p.items.map((i) => i.exerciseId)).size !== p.items.length)
    throw Error("Each exercise should appear once in a plan.");
  return {
    title: p.title.trim(),
    notes: p.notes,
    items: p.items.map((i) => ({
      exerciseId: i.exerciseId,
      note: i.note,
      ...(i.reps ? { reps: i.reps } : {}),
    })),
  };
}
