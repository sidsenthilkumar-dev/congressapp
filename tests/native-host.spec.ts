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
