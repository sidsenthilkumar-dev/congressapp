import { test, expect, chromium } from "@playwright/test";
import { SessionPacing } from "../src/domain/sessionPacing";
import { MotionTracker, type Landmark } from "../src/domain/tracking";
import { testOrigin } from "./test-server";
test("stillness ignores angle jitter, cumulative slow motion resets the deadline, and resuming clears history", () => {
  const pace = new SessionPacing();
  pace.observe(90, true, 0);
  for (let now = 1000; now <= 7000; now += 1000)
    expect(pace.observe(90 + (now % 3), true, now).mode).toBe("active");
  expect(pace.observe(91, true, 8000).mode).toBe("paused");
  expect(pace.observe(120, true, 9000).mode).toBe("paused");
  pace.resume();
  expect(pace.observe(90, true, 10000).mode).toBe("active");
  for (let i = 1; i <= 20; i++)
    expect(pace.observe(90 + i, true, 10000 + i * 1000).mode).toBe("active");
});
test("lost tracking pauses, breaks use a deadline, and expiry waits for explicit resume", () => {
  const pace = new SessionPacing();
  pace.observe(90, true, 100);
  expect(pace.observe(null, false, 3100).mode).toBe("paused");
  expect(pace.rest(5000, 30).remaining).toBe(30);
  expect(pace.tick(34500).remaining).toBe(1);
  expect(pace.tick(35000).mode).toBe("ready");
  expect(pace.observe(140, true, 40000).mode).toBe("ready");
  expect(pace.resume().mode).toBe("active");
});
test("unexpected bending in a straight-arm guide blocks reps with a specific correction", () => {
  const p: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.99,
  }));
  p[11] = { x: 0.35, y: 0.2, visibility: 0.99 };
  p[12] = { x: 0.65, y: 0.2, visibility: 0.99 };
  p[23] = { x: 0.35, y: 0.57, visibility: 0.99 };
  p[13] = { x: 0.2, y: 0.3, visibility: 0.99 };
  p[15] = { x: 0.3, y: 0.25, visibility: 0.99 };
  const result = new MotionTracker().update(p, "shoulder", "Left", 100);
  expect(result.correction).toBe("limb");
  expect(result.rep).toBe(false);
  expect(result.ready).toBe(false);
  p[15].visibility = 0.1;
  expect(
    new MotionTracker().update(p, "shoulder", "Left", 100).correction,
  ).toBe("visibility");
});
test("a chosen set interval starts a break, freezes active time, and does not restart automatically", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(testOrigin);
  await page.getByRole("button", { name: "Let’s get moving" }).click();
  await page.getByLabel("Reps between breaks", { exact: true }).fill("2");
  await page.getByLabel("Set break length").selectOption("15");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start guided session" }).click();
  await page.getByRole("button", { name: "Count a rep", exact: true }).click();
  await page.getByRole("button", { name: "Count a rep", exact: true }).click();
  await expect(page.getByLabel("Set break", { exact: true })).toContainText(
    "Break · 15s",
  );
  await expect(
    page.getByRole("button", { name: "Count a rep", exact: true }),
  ).toBeDisabled();
  const elapsed = await page
    .locator(".session-metrics strong")
    .nth(1)
    .innerText();
  await page.clock.fastForward(15000);
  await expect(page.getByLabel("Set break", { exact: true })).toContainText(
    "Break finished",
  );
  await expect(
    page.getByRole("button", { name: "Count a rep", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".session-metrics strong").nth(1)).toHaveText(
    elapsed,
  );
  await page
    .getByRole("button", { name: "Resume movement", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Count a rep", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".session-metrics strong").first()).toHaveText(
    "02",
  );
});
test("stationary camera movement automatically pauses without adding reps", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  try {
    const context = await browser.newContext({
      permissions: ["camera"],
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(() => {
      const points = Array.from({ length: 33 }, () => ({
        x: 0.5,
        y: 0.5,
        visibility: 0.99,
      }));
      points[11] = { x: 0.5, y: 0.22, visibility: 0.99 };
      points[12] = { x: 0.52, y: 0.22, visibility: 0.99 };
      points[23] = { x: 0.5, y: 0.57, visibility: 0.99 };
      points[25] = { x: 0.65, y: 0.57, visibility: 0.99 };
      points[27] = { x: 0.65, y: 0.76, visibility: 0.99 };
      window.Pose = class {
        cb: any;
        setOptions() {}
        initialize() {
          return Promise.resolve();
        }
        onResults(cb: any) {
          this.cb = cb;
        }
        send() {
          this.cb({ poseLandmarks: points });
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      } as any;
    });
    const page = await context.newPage();
    await page.goto(testOrigin);
    await page.getByRole("button", { name: "Let’s get moving" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enable AI camera" }).click();
    await expect(
      page.getByText(
        "No clear movement for 8 seconds. Your session is paused.",
        { exact: true },
      ),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByLabel("Camera rep count", { exact: true }),
    ).toHaveText("00");
    await expect(
      page.getByRole("button", { name: "Resume movement", exact: true }),
    ).toBeEnabled();
    const elapsed = await page.locator(".camera-hud-count>span").textContent();
    await page.waitForTimeout(1200);
    await expect(page.locator(".camera-hud-count>span")).toHaveText(elapsed);
    await page
      .getByRole("button", { name: "Resume movement", exact: true })
      .click();
    await expect(
      page.getByText(
        "No clear movement for 8 seconds. Your session is paused.",
        { exact: true },
      ),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Exit full-screen camera" }).click();
    await expect(page.locator("video")).toHaveCount(0);
  } finally {
    await browser.close();
  }
});
