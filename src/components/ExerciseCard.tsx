import { Play, Clock, ArrowUpRight } from "lucide-react";
import type { Exercise } from "../domain/exercises";
import { ExerciseDemo } from "./ExerciseDemo";
export function ExerciseCard({
  exercise: e,
  onClick,
}: {
  exercise: Exercise;
  onClick: () => void;
}) {
  return (
    <button
      className="exercise-card"
      aria-label={"Open " + e.name + " guide"}
      onClick={onClick}
    >
      <div className="exercise-art" style={{ background: e.color }}>
        <span className="exercise-category">{e.level}</span>
        <ExerciseDemo exercise={e} compact />
        <span className="play-circle">
          <Play size={17} fill="currentColor" />
        </span>
      </div>
      <div className="exercise-info">
        <div className="exercise-area">{e.area.toUpperCase()} MOBILITY</div>
        <h3>{e.name}</h3>
        <div className="exercise-meta">
          <span>
            <Clock size={13} />
            {e.duration}
          </span>
          <i /> <span>{e.sets}</span>
          <ArrowUpRight size={16} />
        </div>
      </div>
    </button>
  );
}
