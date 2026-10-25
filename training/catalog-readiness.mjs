// This is a coverage inventory, not a training run or accuracy measurement.
import { writeFileSync } from "node:fs";
import { exercises } from "../src/domain/exercises.ts";
import { cameraProtocol } from "../src/domain/coaching.ts";
const report = {
  status: "experimental_not_clinically_validated",
  human_video_training_this_release: false,
  validated_accuracy: null,
  reason:
    "No permission-cleared, independently labelled human-video corpus has been supplied. Existing public-dataset rights and exercise mapping remain unresolved.",
  exercises: exercises.map((exercise) => {
    const protocol = cameraProtocol(exercise);
    return {
      id: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
      mode: protocol ? "experimental_pose_rules" : "mirror_manual",
      protocol: protocol?.movement ?? null,
      view: protocol?.view ?? "user_selected_mirror",
      observes: protocol?.observes ?? "User observes and counts manually",
      cannot_assess:
        protocol?.cannotObserve ?? "Automatic movement quality or rep count",
      source_reference_checked_on: exercise.source.verified,
      exercise_specific_video_model_trained: false,
      validated_rep_accuracy: null,
      validated_form_accuracy: null,
    };
  }),
};
writeFileSync(
  new URL("../docs/TRACKING-READINESS.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `Audited ${report.exercises.length} exercise guides. No model trained and no accuracy score invented.`,
);
