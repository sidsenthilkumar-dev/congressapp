import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Camera,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { exercises } from "../../domain/exercises";
import { ExerciseCard } from "../../components/ExerciseCard";
import { assessProfile, type RecoveryProfile } from "../../domain/recovery";
import type { Entry, Session } from "../../domain/types";
export function OverviewDetails({
  injury,
  entries,
  sessions,
  onNavigate,
  onOpen,
  onCheckIn,
}: {
  injury: RecoveryProfile;
  entries: Entry[];
  sessions: Session[];
  onNavigate: (page: string) => void;
  onOpen: (index: number) => void;
  onCheckIn: () => void;
}) {
  const recommended = exercises.findIndex((e) => e.area === injury.area);
  const current = Math.max(0, recommended);
  const safety = assessProfile(injury, entries.at(-1)?.pain);
  const checkToday = entries.some(
    (e) => new Date(e.date).toDateString() === new Date().toDateString(),
  );
  return (
    <>
      <div className="middle-grid">
        <section>
          <div className="section-heading">
            <h2>
              Movement ideas to discuss{" "}
              <span className="subtle-badge">A gentle start</span>
            </h2>
            <button onClick={() => onNavigate("Exercise library")}>
              View all exercises <ArrowRight size={15} />
            </button>
          </div>
          {safety.blocked || recommended < 0 ? (
            <div className="movement-paused">
              <ShieldCheck size={27} />
              <h3>Your recovery deserves an individual plan.</h3>
              <p>
                {recommended < 0 && !safety.blocked
                  ? "We have no exercise example for this body area yet. Your journal and clinician’s plan are your next steps."
                  : safety.message}
              </p>
              <button
                className="outline"
                onClick={() => onNavigate("Injury library")}
              >
                Explore injury & recovery topics <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="exercise-grid">
              {[
                current,
                ...exercises.map((_, i) => i).filter((i) => i !== current),
              ]
                .slice(0, 2)
                .map((i) => (
                  <ExerciseCard
                    key={i}
                    exercise={exercises[i]}
                    onClick={() => onOpen(i)}
                  />
                ))}
            </div>
          )}
        </section>
        <section className="coach-card">
          <div className="coach-top">
            <span className="coach-icon">
              <Camera size={20} />
            </span>
            <span className="new-badge">MEET YOUR COACH</span>
          </div>
          <h2>
            A little guidance.
            <br />A lot more confidence.
          </h2>
          <p>
            Move with real-time form feedback
            <br />
            and automatic rep counting.
          </p>
          <div className="coach-points">
            <span>
              <Check size={13} />
              Camera-based guidance
            </span>
            <span>
              <ShieldCheck size={13} />
              Video stays on your device
            </span>
          </div>
          <button onClick={() => onNavigate("AI movement coach")}>
            Try the AI coach <ArrowUpRight size={17} />
          </button>
        </section>
      </div>{" "}
      <div className="bottom-grid">
        <section className="week-card">
          <div className="section-heading">
            <h2>Your week in motion</h2>
            <span>This week</span>
          </div>
          <div className="week-days">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + i);
              const completed = sessions.some(
                (s) => new Date(s.date).toDateString() === date.toDateString(),
              );
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div
                  className={isToday ? "week-day today" : "week-day"}
                  key={i}
                >
                  <small>{["M", "T", "W", "T", "F", "S", "S"][i]}</small>
                  <span className={completed ? "complete" : ""}>
                    {completed ? <Check size={17} /> : date.getDate()}
                  </span>
                  <i className={isToday ? "visible" : ""} />
                </div>
              );
            })}
          </div>
          <p>
            <span className="tiny-dot" />A little consistency goes a long way.
            You’ve got this.
          </p>
        </section>
        <section className="checkin-card">
          <span className="circle-heart">
            <Heart size={23} />
          </span>
          <div>
            <h3>How is your body feeling?</h3>
            <p>
              {checkToday
                ? "Your check-in is saved. Thanks for showing up."
                : "A quick check-in helps you notice what’s changing."}
            </p>
            <button onClick={() => onCheckIn()}>
              {checkToday
                ? "Update today’s check-in"
                : "Take a moment to check in"}{" "}
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
