import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Flame,
  Heart,
  CheckCircle2,
  Leaf,
  Footprints,
} from "lucide-react";
import { exercises } from "../../domain/exercises";
import { Stat } from "../../components/ui";
import { assessProfile, type RecoveryProfile } from "../../domain/recovery";
import type { Entry, Session } from "../../domain/types";
export function RecoverySummary({
  injury,
  entries,
  sessions,
  onEdit,
  onNavigate,
  onOpen,
}: {
  injury: RecoveryProfile;
  entries: Entry[];
  sessions: Session[];
  onEdit: () => void;
  onNavigate: (page: string) => void;
  onOpen: (index: number) => void;
}) {
  const safety = assessProfile(injury, entries.at(-1)?.pain);
  const recommended = exercises.findIndex((e) => e.area === injury.area);
  const current = Math.max(0, recommended);
  return (
    <>
      <div className="dashboard-top">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-label">
              <span />
              YOUR NEXT CHAPTER STARTS HERE
            </div>
            <h2>
              Get back to
              <br />
              what moves you.
            </h2>
            <p>
              A stronger you starts with a small step.
              <br />
              Your recovery journey is yours to own.
            </p>
            <button
              className="dark"
              onClick={() =>
                safety.blocked || recommended < 0
                  ? onNavigate("Injury library")
                  : onOpen(current)
              }
            >
              {safety.blocked || recommended < 0
                ? "Explore my next step"
                : "Let’s get moving"}{" "}
              <ArrowUpRight size={17} />
            </button>
            <div className="hero-bottom">
              <span className="mini-avatars">
                <b>J</b>
                <b>M</b>
                <b>A</b>
              </span>
              <span>Built for the everyday comeback.</span>
            </div>
          </div>
          <div className="hero-photo" />
          <span className="hero-pill">
            <Leaf size={14} />A little progress is still progress.
          </span>
        </section>
        <section className="recovery-card">
          <div className="card-heading">
            <span className="label">MY RECOVERY</span>
            <button aria-label="Edit recovery profile" onClick={() => onEdit()}>
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="injury-icon">
            <Footprints size={27} />
          </div>
          <h3>{injury.area} recovery</h3>
          <p>
            {injury.side} side <span>·</span> {injury.goal}
          </p>
          <div className="symptom-tags">
            {injury.symptoms.map((s: string) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <div className="recovery-separator" />
          <div className="recovery-bottom">
            <div>
              <small>One day at a time</small>
              <strong>Your comeback is in motion.</strong>
            </div>
            <button
              aria-label="View recovery"
              onClick={() => onNavigate("My recovery")}
            >
              <ArrowRight size={18} />
            </button>
          </div>
          <button className="text-button" onClick={() => onEdit()}>
            Update injury & symptoms <Plus size={13} />
          </button>
        </section>
      </div>
      <div className="stats-row">
        <Stat
          icon={<Flame size={20} />}
          value={String(
            new Set(sessions.map((s) => new Date(s.date).toDateString())).size,
          )}
          title="Active days"
          sub="Every day you show up counts"
        />
        <Stat
          icon={<CheckCircle2 size={20} />}
          value={String(sessions.length)}
          title="Sessions completed"
          sub={
            sessions.length
              ? "Building your momentum"
              : "Your first step is waiting"
          }
        />
        <Stat
          icon={<Heart size={20} />}
          value={
            entries.length
              ? String(entries[entries.length - 1].pain) + "/10"
              : "—"
          }
          title="Latest discomfort"
          sub={
            entries.length
              ? "From your most recent check-in"
              : "Check in to know your baseline"
          }
        />
      </div>
    </>
  );
}
