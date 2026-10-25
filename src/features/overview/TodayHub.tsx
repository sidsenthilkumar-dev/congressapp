import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Heart,
  Leaf,
  Plus,
  ShieldCheck,
  Flame,
} from "lucide-react";
import type { Routine, Session, Entry } from "../../domain/types";
import { type RecoveryProfile, assessProfile } from "../../domain/recovery";
import {
  dailyRoutines,
  routineProgress,
  weekActivity,
} from "../../domain/dailyPlan";
import { exercises } from "../../domain/exercises";
import { Stat } from "../../components/ui";
type Props = {
  profile: RecoveryProfile;
  routines: Routine[];
  sessions: Session[];
  entries: Entry[];
  onStart: (routine: Routine) => void;
  onOpen: (index: number) => void;
  onNavigate: (page: string) => void;
  onEdit: () => void;
  onCheckIn: () => void;
  remindersEnabled: boolean;
};
export function TodayHub({
  profile,
  routines,
  sessions,
  entries,
  onStart,
  onOpen,
  onNavigate,
  onEdit,
  onCheckIn,
  remindersEnabled,
}: Props) {
  const now = new Date(),
    planned = dailyRoutines(routines, now),
    weekly = weekActivity(sessions, now);
  const plannedDone = planned.filter(
    (r) => routineProgress(r, sessions, now).complete,
  ).length;
  const next = planned.find((r) => !routineProgress(r, sessions, now).complete);
  const checkToday = entries.some(
    (e) => new Date(e.date).toDateString() === now.toDateString(),
  );
  const safety = assessProfile(profile, entries.at(-1)?.pain);
  const recommended = exercises.findIndex((e) => e.area === profile.area);
  const primary = () => {
    if (safety.blocked) onEdit();
    else if (next) onStart(next);
    else if (planned.length || recommended < 0) onNavigate("My routines");
    else onOpen(recommended);
  };
  const label = safety.blocked
    ? "Review my recovery"
    : next
      ? routineProgress(next, sessions).completedMovements
        ? "Continue my routine"
        : "Begin my routine"
      : planned.length
        ? "Today’s plan is complete"
        : recommended < 0
          ? "Plan my next step"
          : "Let’s get moving";
  return (
    <section className="today-hub">
      <div className="today-hero">
        <div>
          <span className="today-overline">
            <span /> YOUR DAY, WITH A LITTLE MORE CLARITY
          </span>
          <h2>
            Your recovery.
            <br />
            One thoughtful step at a time.
          </h2>
          <p>
            {safety.blocked
              ? "Today starts with listening to your body. Review your symptoms before choosing movement."
              : planned.length
                ? `${planned.length} routine${planned.length !== 1 ? "s" : ""} in your plan. Move at your own pace and follow your clinician’s guidance.`
                : "Keep your plan, check-ins, and reminders in one calm place. Build a routine from the movements cleared for you."}
          </p>
          <div className="today-actions">
            <button className="dark" onClick={primary}>
              {label}
              <ArrowUpRight size={17} />
            </button>
            <button
              className="today-reminder-link"
              onClick={() => onNavigate("Reminders")}
            >
              <Bell size={15} />
              {remindersEnabled ? "Manage reminders" : "Set a gentle reminder"}
            </button>
          </div>
          <span className="today-privacy">
            <ShieldCheck size={13} />
            Private by default. Your video stays on your device.
          </span>
        </div>
        <div className="today-profile-card">
          <div>
            <span>YOUR RECOVERY</span>
            <button aria-label="Edit recovery profile" onClick={onEdit}>
              <ArrowUpRight size={18} />
            </button>
          </div>
          <span className="today-profile-icon">
            <Leaf size={25} />
          </span>
          <h3>{profile.area} recovery</h3>
          <p>{profile.goal}</p>
          <div className="symptom-tags">
            {profile.symptoms.slice(0, 3).map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <button onClick={() => onNavigate("My recovery")}>
            View my recovery <ArrowRight size={14} />
          </button>
        </div>
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
              ? "Your effort, recorded"
              : "Your first session starts with you"
          }
        />
        <Stat
          icon={<Heart size={20} />}
          value={entries.length ? entries.at(-1)!.pain + "/10" : "—"}
          title="Latest discomfort"
          sub={
            entries.length
              ? "From your most recent check-in"
              : "Check in to know your baseline"
          }
        />
      </div>
      <div className="today-grid">
        <section className="today-side-card">
          <div className="section-heading">
            <h2>
              <CalendarDays size={17} />
              Your plan for today
            </h2>
            <button onClick={() => onNavigate("My routines")}>
              Edit plan <ArrowRight size={14} />
            </button>
          </div>
          {planned.length ? (
            <>
              <div className="today-plan-list">
                {planned.map((r, i) => {
                  const progress = routineProgress(r, sessions);
                  return (
                    <div
                      className={
                        "today-plan-item " +
                        (progress.complete ? "is-complete" : "")
                      }
                      key={r.id}
                    >
                      <span className="today-plan-index">
                        {progress.complete ? (
                          <Check size={16} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      <div>
                        <h3>{r.name}</h3>
                        <p>
                          {progress.complete
                            ? "Completed today"
                            : progress.completedMovements
                              ? `${progress.completedMovements} of ${r.exerciseIds.length} movements logged · Ready to continue`
                              : `${r.exerciseIds.length} movements · Your clinician sets the dose`}
                        </p>
                      </div>
                      <button
                        className="outline"
                        onClick={() =>
                          progress.complete
                            ? onNavigate("My progress")
                            : onStart(r)
                        }
                      >
                        {progress.complete
                          ? "View"
                          : progress.completedMovements
                            ? "Continue"
                            : "Begin"}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="today-progress">
                <span>
                  {plannedDone} of {planned.length} routines completed
                </span>
                <div>
                  <i
                    style={{
                      width: `${(plannedDone / planned.length) * 100}%`,
                    }}
                  />
                </div>
                <small>
                  Rest and adjustments are part of recovery. No streak to
                  protect.
                </small>
              </div>
            </>
          ) : (
            <div className="today-empty">
              <CalendarDays size={25} />
              <h3>
                {routines.length
                  ? "A little room to breathe."
                  : "A plan that works for you."}
              </h3>
              <p>
                {routines.length
                  ? "Nothing is scheduled today. Follow your clinician’s plan and take rest when you need it."
                  : "Save your cleared movements in a routine, then choose the days that suit your plan."}
              </p>
              <button
                className="outline"
                onClick={() => onNavigate("My routines")}
              >
                {routines.length ? "See my routines" : "Build my routine"}
                <Plus size={14} />
              </button>
            </div>
          )}
        </section>
        <section className="today-side-card today-checkin">
          <span className="today-overline">LISTEN BEFORE YOU MOVE</span>
          <span className="today-checkin-icon">
            <Heart size={24} />
          </span>
          <h2>
            {checkToday
              ? "You checked in with yourself."
              : "How does your body feel today?"}
          </h2>
          <p>
            {checkToday
              ? "Your note is saved. You can return to it any time or update how you feel."
              : "A quick discomfort and energy check helps you notice changes to discuss with your clinician."}
          </p>
          <button className="outline" onClick={onCheckIn}>
            {checkToday ? "Review today’s check-in" : "Take a daily check-in"}
            <ArrowRight size={14} />
          </button>
          <button
            className="today-report-link"
            onClick={() => onNavigate("My progress")}
          >
            Prepare for my next appointment <ArrowUpRight size={13} />
          </button>
        </section>
      </div>
      <section className="today-week">
        <div>
          <span className="today-overline">YOUR WEEK IN MOTION</span>
          <h3>
            {weekly.reduce((n, d) => n + d.sessions, 0)} sessions logged this
            week.
          </h3>
          <p>Real activity, at your pace. Rest days belong here too.</p>
        </div>
        <div className="today-week-days">
          {weekly.map((d) => (
            <div className={d.today ? "is-today" : ""} key={d.date}>
              <small>{d.label}</small>
              <span className={d.sessions ? "has-activity" : ""}>
                {d.sessions ? (
                  <Check size={16} />
                ) : (
                  new Date(d.date + "T12:00:00").getDate()
                )}
              </span>
              <i>
                {d.today ? "Today" : d.sessions ? `${d.sessions} logged` : ""}
              </i>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
