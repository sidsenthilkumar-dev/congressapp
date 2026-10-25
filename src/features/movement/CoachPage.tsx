import { ShieldCheck } from "lucide-react";
import { exercises } from "../../domain/exercises";
import { ExerciseCard } from "../../components/ExerciseCard";
import { MotionGuide, CorrectionPreview } from "../movement/MotionGuide";
import { SafetyCard } from "../recovery/RecoveryLibrary";
import { type RecoveryProfile } from "../../domain/recovery";
import type { Entry } from "../../domain/types";
export function CoachPage({
  injury,
  entries,
  onEdit,
  onOpen,
}: {
  injury: RecoveryProfile;
  entries: Entry[];
  onEdit: () => void;
  onOpen: (index: number) => void;
}) {
  return (
    <>
      <SafetyCard
        profile={injury}
        pain={entries.at(-1)?.pain}
        onEdit={() => onEdit()}
      />
      <div className="ai-intro">
        <div>
          <span className="eyebrow">POWERED BY ON-DEVICE POSE DETECTION</span>
          <h2>
            Your camera.
            <br />
            Your personal movement mirror.
          </h2>
          <p>
            Choose a movement below. The coach tracks visible joint angles,
            counts completed reps, and offers simple movement cues. It cannot
            diagnose injuries or confirm that an exercise is medically safe.
          </p>
          <div className="privacy-note">
            <ShieldCheck size={19} />
            Your video is processed in your browser and is never recorded or
            uploaded.
          </div>
        </div>
        <div className="pose-illustration">
          <MotionGuide kind="shoulder" />
          <span>
            <span className="tiny-dot" />
            Ready when you are
          </span>
        </div>
      </div>
      <CorrectionPreview kind="curl" />
      <div className="library-grid">
        {exercises.slice(0, 3).map((e, i) => (
          <ExerciseCard key={e.name} exercise={e} onClick={() => onOpen(i)} />
        ))}
      </div>
    </>
  );
}
