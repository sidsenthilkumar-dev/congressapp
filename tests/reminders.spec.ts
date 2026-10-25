import { test, expect, type Page } from "@playwright/test";
import type { Routine, Session } from "../src/domain/types";
import {
  defaultReminderSettings,
  initialReminderState,
  isReminderSettings,
  isReminderState,
  dueRoutines,
  nextRoutineReminder,
  localDay,
  reminderId,
  buildReminderCalendar,
  escapeCalendarText,
  reminderCopy,
  visibleReminders,
  activeReminders,
  reminderNeedsDelivery,
  routineScheduledForReminder,
  routineCompletedForReminder,
  type ReminderItem,
  type ReminderSettings,
} from "../src/domain/reminders";
const routine: Routine = {
  id: "routine-one",
  name: "A private shoulder routine",
  exerciseIds: ["bicep-curl"],
  notes: "Private clinician instructions",
  days: [1, 3, 5],
  createdAt: "2026-10-20T12:00:00Z",
};
const settings: ReminderSettings = {
  ...defaultReminderSettings,
  enabled: true,
  time: "18:00",
};
test("reminder eligibility respects local weekdays, catch-up boundaries, and completed routine runs", () => {
  const monday = new Date(2026, 9, 26, 18, 0);
  expect(dueRoutines([routine], settings, [], monday)).toEqual([routine]);
  expect(
    dueRoutines([routine], settings, [], new Date(2026, 9, 26, 17, 59)),
  ).toEqual([]);
  expect(
    dueRoutines([routine], settings, [], new Date(2026, 9, 26, 20, 1)),
  ).toEqual([]);
  expect(
    dueRoutines([routine], settings, [], new Date(2026, 9, 27, 18, 0)),
  ).toEqual([]);
  expect(
    dueRoutines([routine], { ...settings, enabled: false }, [], monday),
  ).toEqual([]);
  const completed: Session = {
    date: monday.toISOString(),
    name: "Standing bicep curl",
    reps: 3,
    routineId: routine.id,
    routineFinished: true,
  };
  expect(dueRoutines([routine], settings, [completed], monday)).toEqual([]);
  expect(
    dueRoutines(
      [routine],
      settings,
      [{ ...completed, routineFinished: false }],
      monday,
    ),
  ).toEqual([routine]);
  expect(
    dueRoutines(
      [routine],
      settings,
      [{ ...completed, routineId: undefined }],
      monday,
    ),
  ).toEqual([routine]);
  expect(localDay(monday)).toBe("2026-10-26");
  expect(reminderId(routine.id, monday)).toBe("2026-10-26:routine-one");
});
test("next reminder finds a future occurrence and malformed persisted schedules are rejected", () => {
  expect(
    nextRoutineReminder(
      [routine],
      settings,
      [],
      new Date(2026, 9, 26, 17, 0),
    )?.date.getDay(),
  ).toBe(1);
  expect(
    nextRoutineReminder(
      [routine],
      settings,
      [],
      new Date(2026, 9, 26, 19, 0),
    )?.date.getDay(),
  ).toBe(3);
  expect(
    nextRoutineReminder(
      [routine],
      { ...settings, enabled: false },
      [],
      new Date(),
    ),
  ).toBeNull();
  expect(isReminderSettings({ ...settings, time: "25:18" })).toBeFalsy();
  expect(isReminderSettings({ ...settings, time: "18:99" })).toBeFalsy();
  expect(isReminderSettings(settings)).toBeTruthy();
  expect(isReminderState(initialReminderState)).toBeTruthy();
  expect(
    isReminderState({ ...initialReminderState, inbox: [{ id: "bad" }] }),
  ).toBeFalsy();
});
test("calendar export uses stable local weekly events, alarms, escaping, and private defaults", () => {
  const now = new Date(2026, 9, 26, 17, 0);
  const content = buildReminderCalendar([routine], settings, now);
  expect(content).toContain("DTSTART:20261026T180000\r\n");
  expect(content).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;WKST=MO");
  expect(content).toContain("BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:PT0M");
  expect(content).not.toContain(routine.name);
  expect(content).not.toContain(routine.notes);
  expect(content).toContain("SUMMARY:Your Rebound movement time");
  expect(
    buildReminderCalendar([routine], settings, new Date(2026, 9, 27)).match(
      /UID:.+\r\n/,
    )?.[0],
  ).toBe(content.match(/UID:.+\r\n/)?.[0]);
  expect(escapeCalendarText("A; B, C\\ D\nSUMMARY:fake")).toBe(
    "A\\; B\\, C\\\\ D\\nSUMMARY:fake",
  );
  const visible = buildReminderCalendar(
    [{ ...routine, name: "A; B, C\nSUMMARY:fake " + "🪴".repeat(50) }],
    { ...settings, showRoutineNames: true },
    now,
  );
  expect(visible).toContain("SUMMARY:A\\; B\\, C\\nSUMMARY:fake");
  for (const line of visible.split("\r\n"))
    expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  expect(visible).toContain("\r\n ");
  expect(reminderCopy(routine, settings, false).body).not.toContain(
    routine.name,
  );
  expect(
    reminderCopy(routine, { ...settings, showRoutineNames: true }, false).body,
  ).toContain(routine.name);
  expect(
    reminderCopy(routine, { ...settings, showRoutineNames: true }, true).title,
  ).toBe("A moment to check in");
});
async function seeded(
  page: Page,
  {
    completed = false,
    denied = false,
    at = "2026-10-26T18:00:00Z",
    time = "18:00",
  } = {},
) {
  await page.clock.install({ time: new Date(at) });
  await page.addInitScript(
    ({ plan, preferences, done, deny }) => {
      if (!sessionStorage.getItem("reminder-seed")) {
        localStorage.clear();
        localStorage.setItem("rebound-routines", JSON.stringify([plan]));
        localStorage.setItem(
          "rebound-reminders-v1",
          JSON.stringify(preferences),
        );
        if (done)
          localStorage.setItem(
            "rebound-sessions",
            JSON.stringify([
              {
                date: "2026-10-26T18:00:00Z",
                name: "Standing bicep curl",
                reps: 2,
                routineId: plan.id,
                routineFinished: true,
              },
            ]),
          );
        sessionStorage.setItem("reminder-seed", "yes");
      }
      if (deny) {
        Object.defineProperty(window, "Notification", {
          configurable: true,
          value: class {
            static permission = "denied";
            static requestPermission() {
              throw new Error("Permission should not be requested again");
            }
          },
        });
      }
    },
    {
      plan: routine,
      preferences: { ...initialReminderState, settings: { ...settings, time } },
      done: completed,
      deny: denied,
    },
  );
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
}
test("due reminders persist, snooze, return once, and stay dismissed after reload", async ({
  page,
}) => {
  await seeded(page);
  await expect(page.locator(".reminder-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Snooze 15 min", exact: true })
    .click();
  await expect(page.locator(".reminder-item")).toHaveClass(/snoozed/);
  await page.clock.fastForward(15 * 60_000 + 16000);
  await expect(page.locator(".reminder-item")).not.toHaveClass(/snoozed/);
  await page
    .getByRole("button", { name: "Dismiss today", exact: true })
    .click();
  await expect(page.locator(".reminder-item")).toHaveCount(0);
  await page.reload();
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
  await expect(page.locator(".reminder-item")).toHaveCount(0);
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rebound-reminders-v1") || "null"),
  );
  expect(state.inbox).toHaveLength(1);
  expect(state.seen).toHaveLength(1);
});
test("completed routine suppresses its due reminder and calendar export remains available", async ({
  page,
}) => {
  await seeded(page, { completed: true });
  await expect(page.locator(".reminder-item")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export calendar reminders", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("rebound-reminders.ics");
  await expect(
    page.getByText("Calendar file downloaded.", { exact: false }),
  ).toBeVisible();
});
test("denied notification permission is explained without repeated requests", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seeded(page, { denied: true });
  await expect(
    page.getByText("Blocked in browser settings", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enable browser alerts", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Browser alerts are blocked",
  );
  await expect(
    page.getByRole("button", { name: "Send test alert" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("paused reminder schedule and cleared inbox do not recreate delivered reminders", async ({
  page,
}) => {
  await seeded(page);
  await page.getByRole("button", { name: "Clear inbox", exact: true }).click();
  await page.clock.fastForward(30_000);
  await expect(page.locator(".reminder-item")).toHaveCount(0);
  await page
    .getByRole("switch", { name: "Exercise reminders", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Exercise reminders", exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Exercise reminders", exact: true }),
  ).not.toBeChecked();
  await expect(page.locator(".reminder-item")).toHaveCount(0);
});
test("reminder layout works on a phone and private titles are the default", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seeded(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    page.getByRole("checkbox", { name: /Include routine names/ }),
  ).not.toBeChecked();
  await expect(page.getByText(/FOR WHEN YOU CLOSE THE APP/)).toBeVisible();
});
test("alerts are opt-in, use the worker, stay private, and deduplicate after reload", async ({
  page,
}) => {
  await mockedBrowserAlerts(page);
  await seeded(page);
  expect(
    await page.evaluate(
      () => (window as unknown as { reminderCalls: string[] }).reminderCalls,
    ),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Enable browser alerts", exact: true })
    .click();
  await expect(
    page.getByText("Permission granted", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await page.evaluate(
        () => (window as unknown as { reminderCalls: string[] }).reminderCalls,
      )
    ).slice(0, 2),
  ).toEqual(["permission", "register"]);
  await page
    .getByRole("button", { name: "Send test alert", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { reminderAlerts: unknown[] }).reminderAlerts
            .length,
      ),
    )
    .toBe(1);
  await page.clock.fastForward(2 * 24 * 60 * 60_000);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { reminderAlerts: unknown[] }).reminderAlerts
            .length,
      ),
    )
    .toBe(2);
  const alerts = await page.evaluate(
    () =>
      (window as unknown as { reminderAlerts: { body: string }[] })
        .reminderAlerts,
  );
  expect(alerts[1].body).not.toContain(routine.name);
  expect(alerts[1].body).not.toContain(routine.notes);
  await page.reload();
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
  await page.clock.fastForward(30_000);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { reminderAlerts: unknown[] }).reminderAlerts
          .length,
    ),
  ).toBe(0);
});
test("a storage-write failure keeps a paused schedule paused for this open app", async ({
  page,
}) => {
  await seeded(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "rebound-reminders-v1")
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("switch", { name: "Exercise reminders", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "could not save reminder changes",
  );
  await page.clock.fastForward(2 * 24 * 60 * 60_000);
  await expect(
    page.getByRole("switch", { name: "Exercise reminders", exact: true }),
  ).not.toBeChecked();
  await expect(page.locator(".reminder-item")).toHaveCount(0);
});
test("removing today from a routine retires its pending reminder", async ({
  page,
}) => {
  await seeded(page);
  await expect(page.locator(".reminder-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Manage my routines", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit routine", exact: true }).click();
  await page.getByLabel("Monday", { exact: true }).click();
  await page.getByRole("button", { name: "Save routine", exact: true }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
  await expect(page.locator(".reminder-item")).toHaveCount(0);
});

async function mockedBrowserAlerts(page: Page, granted = false) {
  await page.addInitScript((granted) => {
    const observer = window as unknown as {
      reminderAlerts: { title: string; body: string; tag: string }[];
      reminderCalls: string[];
    };
    observer.reminderAlerts = [];
    observer.reminderCalls = [];
    const notifications = {
      get permission() {
        return (
          sessionStorage.getItem("mock-notification-permission") ||
          (granted ? "granted" : "default")
        );
      },
      async requestPermission() {
        observer.reminderCalls.push("permission");
        sessionStorage.setItem("mock-notification-permission", "granted");
        return "granted";
      },
    };
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: notifications,
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        async register() {
          observer.reminderCalls.push("register");
          return {
            active: {},
            async showNotification(
              title: string,
              options: { body: string; tag: string },
            ) {
              observer.reminderAlerts.push({
                title,
                body: options.body,
                tag: options.tag,
              });
            },
          };
        },
        addEventListener() {},
        removeEventListener() {},
      },
    });
  }, granted);
}
test("a cross-midnight snooze keeps its occurrence ID, becomes active on its due day, and leaves old backlog quiet", () => {
  const original: ReminderItem = {
    id: "2026-10-26:routine-one",
    routineId: routine.id,
    day: "2026-10-26",
    createdAt: new Date(2026, 9, 26, 23, 55).toISOString(),
    dueAt: new Date(2026, 9, 26, 23, 55).toISOString(),
    state: "due",
  };
  const snoozed: ReminderItem = {
    ...original,
    state: "snoozed",
    dueAt: new Date(2026, 9, 27, 0, 10).toISOString(),
  };
  const before = new Date(2026, 9, 26, 23, 59),
    after = new Date(2026, 9, 27, 0, 10);
  expect(visibleReminders([snoozed], before)).toEqual([snoozed]);
  expect(activeReminders([snoozed], before)).toEqual([]);
  expect(reminderNeedsDelivery(snoozed, before)).toBeFalsy();
  expect(activeReminders([snoozed], after)).toEqual([snoozed]);
  expect(reminderNeedsDelivery(snoozed, after)).toBeTruthy();
  expect(routineScheduledForReminder(routine, snoozed)).toBeTruthy();
  expect(routine.days).not.toContain(after.getDay());
  const activated: ReminderItem = {
    ...snoozed,
    state: "due",
    notifiedAt: after.toISOString(),
  };
  expect(activeReminders([activated], after)).toEqual([activated]);
  expect(reminderNeedsDelivery(activated, after)).toBeFalsy();
  expect(visibleReminders([original], after)).toEqual([]);
  expect(activeReminders([original], after)).toEqual([]);
  expect(reminderNeedsDelivery(original, after)).toBeFalsy();
  expect(
    reminderNeedsDelivery(snoozed, new Date(2026, 9, 27, 2, 11)),
  ).toBeFalsy();
  const finished: Session = {
    date: new Date(2026, 9, 26, 23, 58).toISOString(),
    name: "Standing bicep curl",
    reps: 2,
    routineId: routine.id,
    routineFinished: true,
  };
  expect(
    routineCompletedForReminder(routine, [finished], snoozed),
  ).toBeTruthy();
});
test("a 23:55 reminder snoozed fifteen minutes returns after midnight with one private browser alert", async ({
  page,
}) => {
  await mockedBrowserAlerts(page, true);
  await seeded(page, { at: "2026-10-26T23:55:00Z", time: "23:55" });
  await expect(page.locator(".reminder-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Enable browser alerts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Snooze 15 min", exact: true })
    .click();
  await expect(page.locator(".reminder-item")).toHaveClass(/snoozed/);
  const snoozedDueAt = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("rebound-reminders-v1") || "null")
        .inbox[0].dueAt as string,
  );
  expect(snoozedDueAt).toMatch(/^2026-10-27T00:10:/);
  await page.clock.fastForward(15 * 60_000 + 16_000);
  await expect(page.locator(".reminder-item")).toHaveCount(1);
  await expect(page.locator(".reminder-item")).not.toHaveClass(/snoozed/);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { reminderAlerts: unknown[] }).reminderAlerts
            .length,
      ),
    )
    .toBe(1);
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rebound-reminders-v1") || "null"),
  );
  expect(state.inbox).toHaveLength(1);
  expect(state.inbox[0].id).toBe("2026-10-26:routine-one");
  expect(state.inbox[0].day).toBe("2026-10-26");
  expect(state.inbox[0].dueAt).toBe(snoozedDueAt);
  expect(state.seen).toEqual(["2026-10-26:routine-one"]);
  expect(state.inbox[0].delivery).toBe("browser");
  await page.reload();
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
  await page.clock.fastForward(30_000);
  await expect(page.locator(".reminder-item")).toHaveCount(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { reminderAlerts: unknown[] }).reminderAlerts
          .length,
    ),
  ).toBe(0);
});
