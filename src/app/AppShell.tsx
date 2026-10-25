import { type ReactNode } from "react";
import {
  Activity,
  ChevronRight,
  Plus,
  Camera,
  Heart,
  House,
  BookOpen,
  ChartNoAxesCombined,
  Settings,
  Bell,
  ShieldCheck,
  Leaf,
  Sun,
  CalendarDays,
} from "lucide-react";
type Props = {
  page: string;
  setPage: (page: string) => void;
  checkToday: boolean;
  onDailyCheckIn: () => void;
  onSettings: () => void;
  children: ReactNode;
  reminderCount?: number;
};
export function AppShell({
  page,
  setPage,
  checkToday,
  onDailyCheckIn,
  onSettings,
  children,
  reminderCount = 0,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Overview");
          }}
        >
          <span className="brandmark">
            <Activity size={24} />
          </span>
          rebound<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">YOUR RECOVERY SPACE</div>
        <nav>
          {[
            { name: "Overview", icon: House },
            { name: "My recovery", icon: Heart },
            { name: "Injury library", icon: ShieldCheck },
            { name: "Exercise library", icon: BookOpen },
            { name: "AI movement coach", icon: Camera },
            { name: "My routines", icon: CalendarDays },
            { name: "My progress", icon: ChartNoAxesCombined },
            { name: "Reminders", icon: Bell },
          ].map(({ name, icon: Icon }) => (
            <button
              className={page === name ? "nav-item active" : "nav-item"}
              key={name}
              aria-label={name}
              aria-current={page === name ? "page" : undefined}
              onClick={() => setPage(name)}
            >
              <Icon size={19} />
              <span
                className="nav-label"
                data-short-label={
                  (
                    {
                      Overview: "Today",
                      "My recovery": "Recovery",
                      "Injury library": "Injuries",
                      "Exercise library": "Exercises",
                      "AI movement coach": "Coach",
                      "My routines": "Routines",
                      "My progress": "Progress",
                      Reminders: "Remind",
                    } as Record<string, string>
                  )[name]
                }
              >
                {name}
              </span>
              {name === "AI movement coach" && (
                <span className="ai-tag">AI</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="little-note">
            <span className="little-leaf">
              <Leaf size={19} />
            </span>
            <strong>Progress, at your pace.</strong>
            <p>
              Small steps today.
              <br />
              Stronger tomorrows.
            </p>
            <span className="note-line" />
          </div>
          <button className="nav-item" onClick={() => onSettings()}>
            <Settings size={19} />
            Settings & preferences
          </button>
          <div className="profile">
            <div className="avatar">
              Y<span />
            </div>
            <div>
              <strong>Your recovery</strong>
              <small>Personal space</small>
            </div>
            <button aria-label="Open preferences" onClick={() => onSettings()}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="shell">
        <header>
          <div className="breadcrumb">
            My space <ChevronRight size={13} />
            <span>{page}</span>
          </div>
          <div className="header-right">
            <span className="private">
              <span />
              {checkToday
                ? "Check-in saved · Private space"
                : "Your progress is personal"}
            </span>
            <button
              className="bell"
              aria-label="Notifications"
              onClick={() => setPage("Reminders")}
            >
              <Bell size={19} />
              {reminderCount > 0 && (
                <i className="notification-count" aria-hidden="true" />
              )}
            </button>
            <div className="avatar small">Y</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <Sun size={14} />
                {today}
              </div>
              <h1>
                {page === "Reminders"
                  ? "A gentle nudge. On your terms."
                  : page === "My routines"
                    ? "Make a little room for you."
                    : page === "Overview"
                      ? "A little stronger, every day."
                      : page === "Injury library"
                        ? "Understand your recovery."
                        : page === "My recovery"
                          ? "Your recovery, your pace."
                          : page === "Exercise library"
                            ? "Find your next small step."
                            : page === "AI movement coach"
                              ? "Good movement starts here."
                              : "See how far you’ve come."}
              </h1>
              <p>
                {page === "Overview"
                  ? "Listen to your body. Celebrate the small wins. Let’s keep moving."
                  : page === "Exercise library"
                    ? "Simple, guided movements to support your recovery journey."
                    : page === "AI movement coach"
                      ? "Real-time feedback. More confidence in every movement."
                      : page === "My progress"
                        ? "Every check-in and every session is a step forward."
                        : "A space to understand your body and build healthy habits."}
              </p>
            </div>
            <button
              className="outline checkin-top"
              onClick={() => onDailyCheckIn()}
            >
              <Plus size={16} />
              Daily check-in
            </button>
          </div>
          <div className="page-content" key={page}>
            {children}
          </div>
          <footer>
            <span>
              <Activity size={14} /> Small steps. Stronger you.
            </span>
            <span>
              Made for your comeback <span className="footer-dot">✳</span>
            </span>
          </footer>
        </main>
      </div>
    </>
  );
}
