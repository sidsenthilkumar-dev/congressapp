import { test, expect } from "@playwright/test";
import { parseSnapshot } from "../mobile/src/patient/snapshot";
import {
  nativePresentationScript,
  nativeActionScript,
} from "../mobile/src/patient/injected";
test("native recovery bridge exposes actual journal counts and opens focused guides", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__messages = [];
    window.ReactNativeWebView = {
      postMessage(raw: string) {
        (window as any).__messages.push(JSON.parse(raw));
      },
    };
  });
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).__messages.filter(
            (m: any) => m.type === "RECOVERY_SNAPSHOT",
          ).length,
      ),
    )
    .toBeGreaterThan(0);
  const snapshot = await page.evaluate(
    () =>
      (window as any).__messages
        .filter((m: any) => m.type === "RECOVERY_SNAPSHOT")
        .at(-1).snapshot,
  );
  expect(parseSnapshot(snapshot).stats.total).toBe(0);
  expect(snapshot.profile.area).toBeTruthy();
  expect(snapshot.profile).not.toHaveProperty("symptoms");
  await page.evaluate(nativePresentationScript);
  await expect(page.locator(".sidebar")).toBeHidden();
  await page.evaluate(
    nativeActionScript({ type: "exercise", id: "hip-march" }),
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(nativeActionScript({ type: "close" }));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(
    nativeActionScript({ type: "navigate", page: "My routines" }),
  );
  await expect(
    page.getByRole("button", { name: "Create a routine", exact: true }),
  ).toBeVisible();
  await page.evaluate(
    nativeActionScript({ type: "navigate", page: "https://untrusted.example" }),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).__messages
            .filter((m: any) => m.type === "NATIVE_ACTION_RESULT")
            .at(-1)?.accepted,
      ),
    )
    .toBe(false);
});
test("ordinary website has no native bridge output or injected presentation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".sidebar")).toBeVisible();
  await expect(page.locator("#rebound-native-presentation")).toHaveCount(0);
});
test("native snapshot parser rejects inconsistent session totals", () => {
  expect(() =>
    parseSnapshot({
      version: 1,
      profile: { area: "Knee", side: "Left", goal: "Walk" },
      safety: { blocked: false, title: "", message: "" },
      stats: { total: 1, today: 2, week: [0, 0, 0, 0, 0, 0, 0], pain: null },
      routines: [],
      updatedAt: new Date().toISOString(),
      modal: "",
    }),
  ).toThrow();
});

test("native weekly goal updates after a real scheduled routine is saved and survives reload", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-25T12:00:00Z"));
  await page.addInitScript(() => {
    (window as any).__latest = null;
    window.ReactNativeWebView = {
      postMessage(raw: string) {
        const message = JSON.parse(raw);
        if (message.type === "RECOVERY_SNAPSHOT")
          (window as any).__latest = message.snapshot;
      },
    };
  });
  await page.goto("/#routines");
  await page
    .getByRole("button", { name: "Create a routine", exact: true })
    .click();
  await page.getByLabel("Routine name").fill("Example Sunday plan");
  await page.getByLabel("Sunday", { exact: true }).click();
  await page.getByRole("checkbox", { name: /Seated hip march/ }).check();
  await page.getByRole("button", { name: "Save routine", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__latest?.weeklyGoal))
    .toEqual({ planned: 1, completed: 0, dueToday: 1, completedToday: 0 });
  expect(
    await page.evaluate(() => (window as any).__latest.routineDays),
  ).toEqual([0]);
  await page
    .getByRole("button", { name: "Begin routine", exact: true })
    .click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start guided session" }).click();
  await page.getByRole("button", { name: "Count a rep" }).click();
  await page.getByRole("button", { name: "Finish & save" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__latest?.weeklyGoal.completed),
    )
    .toBe(1);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => (window as any).__latest?.weeklyGoal))
    .toEqual({ planned: 1, completed: 1, dueToday: 1, completedToday: 1 });
});
