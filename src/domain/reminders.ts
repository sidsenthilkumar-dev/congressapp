import type { Routine, Session } from "./types";

export type ReminderSettings = {
  enabled: boolean;
  time: string;
  browserNotifications: boolean;
  showRoutineNames: boolean;
};
export type ReminderItem = {
  id: string;
  routineId: string;
  day: string;
  createdAt: string;
  dueAt: string;
  state: "due" | "snoozed" | "dismissed";
  notifiedAt?: string;
  delivery?: "browser" | "in-app" | "failed";
};
export type ReminderState = {
  version: 1;
  settings: ReminderSettings;
  inbox: ReminderItem[];
  seen: string[];
};
export const defaultReminderSettings: ReminderSettings = {
  enabled: false,
  time: "18:00",
  browserNotifications: false,
  showRoutineNames: false,
};
export const initialReminderState: ReminderState = {
  version: 1,
  settings: defaultReminderSettings,
  inbox: [],
  seen: [],
};
export const REMINDER_STORAGE_KEY = "rebound-reminders-v1";
export const catchUpMinutes = 120;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
export const validTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
export function isReminderSettings(value: unknown): value is ReminderSettings {
  return (
    isRecord(value) &&
    typeof value.enabled === "boolean" &&
    validTime(value.time) &&
    typeof value.browserNotifications === "boolean" &&
    typeof value.showRoutineNames === "boolean"
  );
}
export function isReminderState(value: unknown): value is ReminderState {
  return (
    isRecord(value) &&
    value.version === 1 &&
    isReminderSettings(value.settings) &&
    Array.isArray(value.seen) &&
    value.seen.every((id) => typeof id === "string") &&
    Array.isArray(value.inbox) &&
    value.inbox.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.routineId === "string" &&
        typeof item.day === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.day) &&
        validDate(item.createdAt) &&
        validDate(item.dueAt) &&
        ["due", "snoozed", "dismissed"].includes(String(item.state)) &&
        (item.notifiedAt === undefined || validDate(item.notifiedAt)) &&
        (item.delivery === undefined ||
          ["browser", "in-app", "failed"].includes(String(item.delivery))),
    )
  );
}
export function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function timeOnDate(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
export function reminderId(routineId: string, date: Date) {
  return `${localDay(date)}:${routineId}`;
}
export function routineCompletedToday(
  routine: Routine,
  sessions: Session[],
  now: Date,
) {
  return sessions.some(
    (session) =>
      session.routineId === routine.id &&
      session.routineFinished === true &&
      localDay(new Date(session.date)) === localDay(now),
  );
}
export function dueRoutines(
  routines: Routine[],
  settings: ReminderSettings,
  sessions: Session[],
  now: Date,
) {
  if (!settings.enabled || !validTime(settings.time)) return [];
  const dueAt = timeOnDate(now, settings.time);
  const elapsed = now.getTime() - dueAt.getTime();
  if (elapsed < 0 || elapsed > catchUpMinutes * 60_000) return [];
  return routines.filter(
    (routine) =>
      routine.days.includes(now.getDay()) &&
      !routineCompletedToday(routine, sessions, now),
  );
}
export function nextRoutineReminder(
  routines: Routine[],
  settings: ReminderSettings,
  sessions: Session[],
  now: Date,
): { routine: Routine; date: Date } | null {
  if (!settings.enabled || !validTime(settings.time)) return null;
  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const date = timeOnDate(day, settings.time);
    const eligible = routines.find(
      (routine) =>
        routine.days.includes(day.getDay()) &&
        date > now &&
        (offset !== 0 || !routineCompletedToday(routine, sessions, now)),
    );
    if (eligible) return { routine: eligible, date };
  }
  return null;
}
export function reminderCopy(
  routine: Routine | undefined,
  settings: ReminderSettings,
  blocked: boolean,
) {
  if (blocked)
    return {
      title: "A moment to check in",
      body: "Pause exercise and review how you feel. Follow the care advice in Rebound.",
    };
  return {
    title: "A little time for your recovery",
    body:
      settings.showRoutineNames && routine
        ? `${routine.name} is on your plan. Open Rebound and check how you feel before moving.`
        : "Your planned movement time is here. Open Rebound and check how you feel before moving.",
  };
}
// The original day/id identifies the scheduled occurrence. A snooze changes only
// dueAt, so an explicit 23:55 → 00:10 snooze remains actionable the next day.
export function reminderOriginDate(item: ReminderItem) {
  const [year, month, day] = item.day.split("-").map(Number);
  return new Date(year, month - 1, day);
}
export function routineScheduledForReminder(
  routine: Routine,
  item: ReminderItem,
) {
  return routine.days.includes(reminderOriginDate(item).getDay());
}
export function routineCompletedForReminder(
  routine: Routine,
  sessions: Session[],
  item: ReminderItem,
) {
  return (
    routineCompletedToday(routine, sessions, reminderOriginDate(item)) ||
    routineCompletedToday(routine, sessions, new Date(item.dueAt))
  );
}
export function visibleReminders(items: ReminderItem[], now: Date) {
  return items.filter(
    (item) =>
      item.state !== "dismissed" &&
      (localDay(new Date(item.dueAt)) === localDay(now) ||
        (item.state === "snoozed" &&
          item.day === localDay(now) &&
          new Date(item.dueAt) > now)),
  );
}
export function activeReminders(items: ReminderItem[], now: Date) {
  return visibleReminders(items, now).filter(
    (item) => new Date(item.dueAt) <= now,
  );
}
export function reminderNeedsDelivery(item: ReminderItem, now: Date) {
  const elapsed = now.getTime() - new Date(item.dueAt).getTime();
  return (
    item.state !== "dismissed" &&
    !item.notifiedAt &&
    localDay(new Date(item.dueAt)) === localDay(now) &&
    elapsed >= 0 &&
    elapsed <= catchUpMinutes * 60_000
  );
}

// RFC 5545 text values must not be able to introduce additional calendar properties.
export function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
function calendarDate(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}00`;
}
function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  let current = "";
  let bytes = 0;
  const lines: string[] = [];
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) {
      lines.push(current);
      current = " ";
      bytes = 1;
    }
    current += character;
    bytes += length;
  }
  lines.push(current);
  return lines.join("\r\n");
}
export function buildReminderCalendar(
  routines: Routine[],
  settings: ReminderSettings,
  now = new Date(),
) {
  const weekdayCodes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rebound//Personal movement reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Rebound reminders",
  ];
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  for (const routine of routines.filter((r) => r.days.length)) {
    let start: Date | null = null;
    for (let offset = 0; offset < 8; offset++) {
      const day = new Date(now);
      day.setDate(day.getDate() + offset);
      const candidate = timeOnDate(day, settings.time);
      if (routine.days.includes(day.getDay()) && candidate > now) {
        start = candidate;
        break;
      }
    }
    if (!start) continue;
    const title = settings.showRoutineNames
      ? routine.name
      : "Your Rebound movement time";
    const weekdays = [...new Set(routine.days)]
      .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
      .map((day) => weekdayCodes[day])
      .join(",");
    lines.push(
      "BEGIN:VEVENT",
      `UID:rebound-${Array.from(new TextEncoder().encode(routine.id))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")}@rebound.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${calendarDate(start)}`,
      "DURATION:PT10M",
      `RRULE:FREQ=WEEKLY;BYDAY=${weekdays};WKST=MO`,
      `SUMMARY:${escapeCalendarText(title)}`,
      "DESCRIPTION:Open Rebound and check how you feel. Follow only your clinician-cleared plan. The calendar schedules a check-in; it does not prescribe exercise.",
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:PT0M",
      `DESCRIPTION:${escapeCalendarText(title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldCalendarLine).join("\r\n") + "\r\n";
}
