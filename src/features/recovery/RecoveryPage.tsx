import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { Empty } from "../../components/ui";
import { type RecoveryProfile } from "../../domain/recovery";
import type { Entry } from "../../domain/types";
export function RecoveryPage({
  injury,
  entries,
  onEdit,
  onCheckIn,
  onNavigate,
}: {
  injury: RecoveryProfile;
  entries: Entry[];
  onEdit: () => void;
  onCheckIn: () => void;
  onNavigate: (page: string) => void;
}) {
  return (
    <div className="recovery-detail">
      <section className="panel">
        <div className="section-heading">
          <h2>Your recovery profile</h2>
          <button onClick={() => onEdit()}>
            Edit profile <ArrowUpRight size={15} />
          </button>
        </div>
        <h3>
          {injury.side} {injury.area.toLowerCase()}
        </h3>
        <p>Goal: {injury.goal}</p>
        <p>
          {injury.condition || "General movement"} ·{" "}
          {injury.stage || "Ongoing / assessed"}
        </p>
        <button
          className="text-button"
          onClick={() => onNavigate("Injury library")}
        >
          Explore all recovery topics <ArrowRight size={14} />
        </button>
        <div className="symptom-tags">
          {injury.symptoms.map((s: string) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <div className="notice">
          <ShieldCheck size={20} />
          <span>
            Injury selection keeps your journal organized. It does not diagnose
            you or prescribe exercises. Consult a physical therapist before
            starting a new routine.
          </span>
        </div>
        <button className="dark" onClick={() => onCheckIn()}>
          Log how you feel <Plus size={15} />
        </button>
      </section>
      <section className="panel">
        <h2>Your recent check-ins</h2>
        {entries.length === 0 ? (
          <Empty icon={<Heart />} text="Your story starts with a check-in." />
        ) : (
          entries
            .slice()
            .reverse()
            .slice(0, 5)
            .map((e, i) => (
              <div className="history-row" key={i}>
                <span className="history-icon">
                  <Heart size={17} />
                </span>
                <div>
                  <strong>
                    {new Date(e.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {e.energy}
                  </strong>
                  <p>{e.note || "You took a moment for yourself."}</p>
                </div>
                <b>{e.pain}/10</b>
              </div>
            ))
        )}
      </section>
    </div>
  );
}
