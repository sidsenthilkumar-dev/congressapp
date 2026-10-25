import {
  Activity,
  ArrowUpRight,
  Check,
  Target,
  TrendingUp,
  Heart,
  BookOpen,
} from "lucide-react";
import { Stat, Empty } from "../../components/ui";
import { type RecoveryProfile } from "../../domain/recovery";
import type { Entry, Session, Routine } from "../../domain/types";
import { VisitSummary } from "./VisitSummary";
import { downloadFile } from "../../domain/visitReport";
export function ProgressPage({
  injury,
  entries,
  sessions,
  routines,
  bookmarks,
  onNotice: setToast,
}: {
  injury: RecoveryProfile;
  entries: Entry[];
  sessions: Session[];
  routines: Routine[];
  bookmarks: string[];
  onNotice: (text: string) => void;
}) {
  return (
    <>
      <div className="stats-row">
        <Stat
          icon={<Target />}
          value={String(sessions.length)}
          title="Total sessions"
          sub="One small win at a time"
        />
        <Stat
          icon={<Activity />}
          value={String(sessions.reduce((n, s) => n + s.reps, 0))}
          title="Reps completed"
          sub="Moving with intention"
        />
        <Stat
          icon={<Heart />}
          value={String(entries.length)}
          title="Body check-ins"
          sub="Listening is progress, too"
        />
      </div>
      <div className="recovery-detail">
        <section className="panel">
          <div className="section-heading">
            <h2>Discomfort over time</h2>
            <span>Self-reported · 0–10</span>
          </div>
          {entries.length < 2 ? (
            <Empty
              icon={<TrendingUp />}
              text="Log at least two check-ins to see your trend."
            />
          ) : (
            <div className="chart">
              <div className="chart-bars">
                {entries.slice(-10).map((e, i) => (
                  <div key={i}>
                    <span>{e.pain}</span>
                    <i
                      style={{
                        height: `${Math.max(e.pain * 15, 5)}px`,
                      }}
                    />
                    <small>
                      {new Date(e.date).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </small>
                  </div>
                ))}
              </div>
              <p>
                Lower scores mean less reported discomfort. Recovery isn’t
                always a straight line.
              </p>
            </div>
          )}
        </section>
        <section className="panel">
          <h2>Your movement journal</h2>
          {sessions.length === 0 ? (
            <Empty
              icon={<BookOpen />}
              text="Your completed sessions will live here."
            />
          ) : (
            sessions
              .slice()
              .reverse()
              .slice(0, 8)
              .map((s, i) => (
                <div className="history-row" key={i}>
                  <span className="history-icon">
                    <Check size={17} />
                  </span>
                  <div>
                    <strong>{s.name}</strong>
                    <p>
                      {new Date(s.date).toLocaleDateString()} · {s.reps} reps
                    </p>
                  </div>
                </div>
              ))
          )}
        </section>
      </div>
      <VisitSummary
        profile={injury}
        entries={entries}
        sessions={sessions}
        routines={routines}
      />
      <button
        className="outline"
        onClick={() => {
          downloadFile(
            JSON.stringify(
              { injury, entries, sessions, routines, bookmarks },
              null,
              2,
            ),
            "rebound-recovery-journal.json",
            "application/json",
          );
          setToast(
            "Your journal is prepared. Choose where to save or share the exported file.",
          );
        }}
      >
        Export my recovery journal <ArrowUpRight size={15} />
      </button>
    </>
  );
}
