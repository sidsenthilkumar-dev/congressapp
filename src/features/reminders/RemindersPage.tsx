import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Download,
  Info,
  LockKeyhole,
  Pause,
  Play,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { Routine } from "../../domain/types";
import type { ReminderController } from "../../hooks/useReminders";
import { visibleReminders } from "../../domain/reminders";
import "./reminders.css";

type Props = {
  controller: ReminderController;
  routines: Routine[];
  blocked: boolean;
  onPlan: () => void;
};
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function RemindersPage({
  controller: c,
  routines,
  blocked,
  onPlan,
}: Props) {
  const scheduled = routines.filter((r) => r.days.length);
  const open = visibleReminders(c.inbox, c.now);
  const history = c.inbox.filter((i) => !open.some((o) => o.id === i.id));
  const permissionText =
    c.permission === "granted"
      ? "Permission granted"
      : c.permission === "denied"
        ? "Blocked in browser settings"
        : c.permission === "unsupported"
          ? "Not available in this browser"
          : "Permission not requested";
  return (
    <section className="reminders-page">
      <div className="reminder-hero">
        <div>
          <span className="eyebrow">
            A GENTLE NUDGE. A LITTLE MORE CONSISTENCY.
          </span>
          <h2>
            Make room for
            <br />
            your recovery.
          </h2>
          <p>
            Choose a time that fits your day. We’ll keep your plan close,
            without turning recovery into another thing to rush.
          </p>
          <div className="reminder-hero-points">
            <span>
              <LockKeyhole size={14} />
              Private alert text by default
            </span>
            <span>
              <CalendarDays size={14} />
              Your routine’s chosen days
            </span>
          </div>
        </div>
        <div className="reminder-next">
          <span className="reminder-next-icon">
            <BellRing size={23} />
          </span>
          <small>YOUR NEXT PLANNED REMINDER</small>
          <h3>
            {c.nextReminder
              ? c.nextReminder.date.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "At your own pace."}
          </h3>
          <p>
            {c.nextReminder
              ? c.nextReminder.date.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
              : scheduled.length
                ? "Switch on reminders to choose your rhythm."
                : "Add a routine and choose its weekdays to get started."}
          </p>
          <span className="reminder-next-status">
            <i />
            {c.settings.enabled
              ? "Reminder checks are on"
              : "Your schedule is paused"}
          </span>
        </div>
      </div>
      {c.persistenceError && (
        <div className="warning" role="alert">
          Your browser could not save reminder changes. Keep this page open and
          export a calendar copy before leaving.
        </div>
      )}
      <div className="reminder-layout">
        <section className="reminder-settings-card">
          <div className="reminder-card-heading">
            <div>
              <span className="label">YOUR RHYTHM</span>
              <h3>A time that feels right.</h3>
            </div>
            <Bell size={19} />
          </div>
          <div className="reminder-setting-line">
            <div>
              <strong>Exercise reminders</strong>
              <p>For saved routines with selected weekdays.</p>
            </div>
            <button
              type="button"
              className={
                "reminder-toggle " + (c.settings.enabled ? "enabled" : "")
              }
              role="switch"
              aria-checked={c.settings.enabled}
              aria-label="Exercise reminders"
              onClick={() =>
                c.setSettings({ ...c.settings, enabled: !c.settings.enabled })
              }
            >
              <span />
            </button>
          </div>
          <div className="reminder-controls">
            <label htmlFor="reminder-time">
              My reminder time
              <input
                id="reminder-time"
                aria-label="My reminder time"
                type="time"
                value={c.settings.time}
                onChange={(event) => {
                  if (event.target.value)
                    c.setSettings({ ...c.settings, time: event.target.value });
                }}
              />
            </label>
            <span>
              <Clock size={14} />
              Uses this device’s local time
            </span>
          </div>
          <div className="reminder-schedule">
            {scheduled.length ? (
              scheduled.map((r) => (
                <div key={r.id}>
                  <span>
                    <CalendarDays size={15} />
                  </span>
                  <div>
                    <strong>{r.name}</strong>
                    <p>
                      {[...r.days]
                        .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
                        .map((d) => weekdays[d])
                        .join(" · ")}
                    </p>
                  </div>
                  <span>{c.settings.time}</span>
                </div>
              ))
            ) : (
              <div className="reminder-no-plan">
                <CalendarDays size={22} />
                <p>
                  Your next step starts with a routine.
                  <br />
                  Choose its weekdays, then come back here.
                </p>
              </div>
            )}
          </div>
          <button className="reminder-text-button" onClick={onPlan}>
            Manage my routines <ChevronRight size={15} />
          </button>
          <div className="reminder-privacy-setting">
            <label>
              <input
                type="checkbox"
                checked={c.settings.showRoutineNames}
                onChange={(event) =>
                  c.setSettings({
                    ...c.settings,
                    showRoutineNames: event.target.checked,
                  })
                }
              />
              <span>
                Include routine names in browser alerts and calendar events
                <small>
                  Off by default, so personal details stay off your lock screen.
                </small>
              </span>
            </label>
          </div>
        </section>
        <div className="reminder-right">
          <section className="reminder-capability">
            <div className="reminder-card-heading">
              <div>
                <span className="label">BROWSER ALERTS</span>
                <h3>A nudge while Rebound is open.</h3>
              </div>
              <BellRing size={19} />
            </div>
            <p>
              Reminder checks run while this app is open and when you return.
              Browser alerts require permission, HTTPS, and a compatible
              browser.
            </p>
            <div
              className={
                "reminder-permission " +
                (c.permission === "granted" ? "granted" : "")
              }
            >
              <span />
              <strong>{permissionText}</strong>
            </div>
            <div className="reminder-alert-actions">
              <button
                className="dark"
                onClick={() => {
                  void c.enableNotifications();
                }}
                disabled={
                  c.permission === "granted" && c.settings.browserNotifications
                }
              >
                <Bell size={15} />
                {c.permission === "granted" && c.settings.browserNotifications
                  ? "Browser alerts enabled"
                  : "Enable browser alerts"}
              </button>
              <button
                className="outline"
                disabled={c.permission !== "granted"}
                onClick={() => {
                  void c.sendTest();
                }}
              >
                Send test alert
              </button>
            </div>
            {c.settings.browserNotifications && (
              <button
                className="reminder-text-button quiet"
                onClick={() =>
                  c.setSettings({ ...c.settings, browserNotifications: false })
                }
              >
                Pause browser alerts <Pause size={12} />
              </button>
            )}
            <div className="reminder-browser-note">
              <Info size={15} />
              <span>
                On iPhone, web notifications need a supported iOS version and an
                app added to the Home Screen. If alerts aren’t available, use a
                calendar reminder.
              </span>
            </div>
          </section>
          <section className="reminder-calendar">
            <span className="reminder-calendar-icon">
              <CalendarDays size={23} />
            </span>
            <div>
              <span className="label">FOR WHEN YOU CLOSE THE APP</span>
              <h3>Let your calendar keep the time.</h3>
              <p>
                Download your recurring reminder schedule and import it into
                Apple Calendar, Google Calendar, or another calendar app.
              </p>
              <button
                className="outline"
                disabled={!scheduled.length}
                onClick={c.exportCalendar}
              >
                <Download size={15} />
                Export calendar reminders
              </button>
              <small>
                Your calendar controls delivery and alert settings. Re-export
                after changing routine days or reminder time; remove or update
                the old events to avoid duplicates. Pausing reminders here does
                not remove imported calendar events.
              </small>
            </div>
          </section>
        </div>
      </div>
      {(c.status || c.error) && (
        <div
          className={"reminder-status " + (c.error ? "error" : "")}
          role={c.error ? "alert" : "status"}
        >
          {c.error ? <Info size={17} /> : <Check size={17} />}
          <p>{c.error || c.status}</p>
        </div>
      )}
      <section className="reminder-inbox">
        <div className="reminder-inbox-heading">
          <div>
            <span className="label">YOUR REMINDER INBOX</span>
            <h3>A little space to reset.</h3>
          </div>
          {c.inbox.length > 0 && (
            <button onClick={c.clearHistory}>
              <Trash2 size={14} />
              Clear inbox
            </button>
          )}
        </div>
        {blocked && (
          <div className="reminder-safety">
            <ShieldCheck size={18} />
            <span>
              Your profile has an exercise safety hold. Reminders invite you to
              review your symptoms; they do not clear you to exercise.
            </span>
          </div>
        )}
        {open.length ? (
          open.map((item) => {
            const routine = routines.find((r) => r.id === item.routineId);
            const snoozed =
              item.state === "snoozed" && new Date(item.dueAt) > c.now;
            return (
              <article
                className={"reminder-item " + (snoozed ? "snoozed" : "")}
                key={item.id}
              >
                <span className="reminder-item-icon">
                  {snoozed ? <Clock size={20} /> : <BellRing size={20} />}
                </span>
                <div>
                  <small>
                    {snoozed
                      ? "SNOOZED UNTIL " +
                        new Date(item.dueAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "A MOMENT FOR YOUR PLAN"}
                  </small>
                  <h4>{routine?.name || "Your recovery routine"}</h4>
                  <p>
                    {blocked
                      ? "Pause and review how you feel before considering movement."
                      : snoozed
                        ? "Your reminder will return while Rebound is open."
                        : "Check how you feel, then follow your clinician-cleared plan."}
                  </p>
                </div>
                <div className="reminder-item-actions">
                  <button
                    className="dark"
                    disabled={blocked || !routine}
                    onClick={() => c.openReminder(item.id)}
                  >
                    <Play size={13} />
                    Open routine
                  </button>
                  <button
                    className="outline"
                    disabled={snoozed}
                    onClick={() => c.snooze(item.id, 15)}
                  >
                    Snooze 15 min
                  </button>
                  <button
                    className="reminder-dismiss"
                    onClick={() => c.dismiss(item.id)}
                  >
                    Dismiss today
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="reminder-inbox-empty">
            <span>
              <Bell size={26} />
            </span>
            <h4>You’re all caught up.</h4>
            <p>
              Today’s reminders appear here around your chosen time.
              <br />
              When you reopen Rebound, we check reminders due within the last
              two hours.
            </p>
          </div>
        )}
        {history.length > 0 && (
          <details className="reminder-history">
            <summary>
              Earlier reminders <span>{history.length}</span>
            </summary>
            {history.slice(0, 10).map((item) => (
              <div key={item.id}>
                <Check size={14} />
                <span>
                  {routines.find((r) => r.id === item.routineId)?.name ||
                    "Recovery routine"}
                </span>
                <small>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  ·{" "}
                  {item.state === "dismissed"
                    ? "Dismissed or completed"
                    : "Earlier"}
                </small>
              </div>
            ))}
          </details>
        )}
      </section>
      <p className="reminder-footer-note">
        <ShieldCheck size={14} />A reminder is an invitation to check in. Your
        symptoms and clinician’s plan always come first.
      </p>
    </section>
  );
}
