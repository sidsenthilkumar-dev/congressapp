import { ArrowRight } from "lucide-react";
import { exerciseById } from "../../domain/exercises";
import type { SessionInstructions } from "../../domain/types";
import type { ClinicPlan } from "../../services/clinic";
export function ClinicPlanCard({
  plan,
  verified,
  onOpen,
  onImport,
}: {
  plan: ClinicPlan["content"];
  verified: boolean;
  onOpen: (id: string, instructions: SessionInstructions) => void;
  onImport: (plan: ClinicPlan["content"]) => void;
}) {
  return (
    <article className="clinic-plan">
      <span className="eyebrow">
        {verified
          ? "FROM YOUR CONNECTED CLINICIAN"
          : "IMPORTED FILE · AUTHOR NOT VERIFIED"}
      </span>
      <h3>{plan.title}</h3>
      <p>{plan.notes}</p>
      <ul>
        {plan.items.map((item) => (
          <li key={item.exerciseId}>
            <div>
              <strong>{exerciseById.get(item.exerciseId)?.name}</strong>
              <p>{item.note}</p>
              {item.reps && (
                <small>Clinician-entered target: {item.reps} reps</small>
              )}
            </div>
            <button
              className="outline"
              onClick={() =>
                onOpen(item.exerciseId, {
                  note: plan.notes + "\n" + item.note,
                  reps: item.reps,
                  source: verified
                    ? "Connected clinician plan"
                    : "Imported plan · author not verified",
                })
              }
            >
              Open guide <ArrowRight size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button className="dark" onClick={() => onImport(plan)}>
        Add to my routines
      </button>
      <small>
        Importing never overrides an existing safety hold. Review restrictions
        with your clinician.
      </small>
    </article>
  );
}
