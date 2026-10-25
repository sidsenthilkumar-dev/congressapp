import { test, expect } from "@playwright/test";
import {
  MotionTracker,
  type Landmark,
  type TrackedMovement,
} from "../src/domain/tracking";
import { SessionPacing } from "../src/domain/sessionPacing";
function pose(type: TrackedMovement, angle: number): Landmark[] {
  const p = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.99,
  }));
  const a = (angle * Math.PI) / 180,
    aspect = 4 / 3;
  p[11] = { x: 0.5, y: 0.22, visibility: 0.99 };
  p[12] = { x: 0.52, y: 0.22, visibility: 0.99 };
  p[23] = { x: 0.5, y: 0.57, visibility: 0.99 };
  p[24] = { x: 0.52, y: 0.57, visibility: 0.99 };
  if (type === "curl") {
    p[13] = { x: 0.5, y: 0.42, visibility: 0.99 };
    p[15] = {
      x: 0.5 + (Math.sin(a) * 0.17) / aspect,
      y: 0.42 - Math.cos(a) * 0.17,
      visibility: 0.99,
    };
    p[14] = { ...p[13], x: 0.52 };
    p[16] = { ...p[15], x: p[15].x + 0.02 };
  }
  if (type === "knee") {
    p[25] = { x: 0.65, y: 0.57, visibility: 0.99 };
    p[27] = {
      x: 0.65 - (Math.cos(a) * 0.19) / aspect,
      y: 0.57 + Math.sin(a) * 0.19,
      visibility: 0.99,
    };
  }
  if (type === "shoulder") {
    p[11].x = 0.35;
    p[12].x = 0.65;
    p[23].x = 0.35;
    p[13] = {
      x: 0.35 - (Math.sin(a) * 0.15) / aspect,
      y: 0.22 + Math.cos(a) * 0.15,
      visibility: 0.99,
    };
    p[15] = {
      x: 0.35 - (Math.sin(a) * 0.29) / aspect,
      y: 0.22 + Math.cos(a) * 0.29,
      visibility: 0.99,
    };
  }
  return p;
}
for (const type of ["knee", "curl", "shoulder"] as const)
  test(`${type}: continuous slow cycles count without artificial endpoint holds`, () => {
    const tracker = new MotionTracker();
    let reps = 0,
      now = 0;
    const rest = type === "knee" ? 90 : type === "curl" ? 170 : 5,
      end = type === "knee" ? 170 : type === "curl" ? 40 : 80;
    function feed(angle: number) {
      if (
        tracker.update(
          pose(type, angle),
          type,
          "Left",
          now,
          4 / 3,
          reps < 2 ? 3000 : 1200,
        ).rep
      )
        reps++;
      now += 100;
    }
    for (let i = 0; i < 20; i++) feed(rest);
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let step = 0; step <= 42; step++)
        feed(rest + (end - rest) * Math.sin((Math.PI * step) / 42) ** 2);
      for (let i = 0; i < 5; i++) feed(rest);
    }
    expect(reps).toBe(3);
  });
test("slower valid camera frames can finish calibration", () => {
  const tracker = new MotionTracker();
  let result;
  for (let now = 100; now <= 2900; now += 700)
    result = tracker.update(pose("curl", 170), "curl", "Left", now);
  expect(result?.ready).toBe(true);
});
test("small automatic-side confidence changes do not restart calibration forever", () => {
  const tracker = new MotionTracker();
  let result;
  for (let now = 0; now <= 2000; now += 100) {
    const p = pose("curl", 170);
    for (const i of [11, 13, 15, 23])
      p[i].visibility = now % 200 === 0 ? 0.98 : 0.96;
    for (const i of [12, 14, 16, 24]) p[i].visibility = 0.97;
    result = tracker.update(p, "curl", "Automatic", now);
  }
  expect(result?.ready).toBe(true);
});
test("tracking pauses recover only after sustained valid observations; breaks remain manual", () => {
  const pacing = new SessionPacing();
  pacing.observe(90, true, 0);
  expect(pacing.tick(3000).mode).toBe("paused");
  expect(pacing.observe(90, true, 3100).mode).toBe("paused");
  expect(pacing.observe(90, true, 3600).mode).toBe("paused");
  expect(pacing.observe(90, true, 4100).mode).toBe("active");
  pacing.rest(4200, 15);
  pacing.tick(20000);
  expect(pacing.observe(100, true, 21000).mode).toBe("ready");
});

test("waiting at rest cannot make a rapid cycle pass the slow-practice timer", () => {
  const tracker = new MotionTracker();
  let reps = 0,
    now = 0;
  const feed = (angle: number) => {
    if (
      tracker.update(pose("knee", angle), "knee", "Left", now, 4 / 3, 3000).rep
    )
      reps++;
    now += 100;
  };
  for (let i = 0; i < 100; i++) feed(90);
  for (let i = 0; i <= 8; i++) feed(90 + 80 * Math.sin((Math.PI * i) / 8) ** 2);
  for (let i = 0; i < 20; i++) feed(90);
  expect(reps).toBe(0);
});

test("camera recovers from unclear tracking, counts a continuous rep, and does not mistake a form warning for lost tracking", async () => {
  const { chromium } = await import("@playwright/test");
  const { testOrigin } = await import("./test-server");
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
      viewport: { width: 390, height: 844 },
      permissions: ["camera"],
    });
    await context.addInitScript(() => {
      window.Pose = class {
        setOptions() {}
        initialize() {
          return Promise.resolve();
        }
        onResults(cb: any) {
          (window as any).__deliver = cb;
        }
        send() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      } as any;
    });
    const page = await context.newPage();
    await page.clock.install();
    await page.goto(testOrigin);
    await page.getByRole("button", { name: "Let’s get moving" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enable AI camera" }).click();
    await expect(page.locator(".camera-loading")).toHaveCount(0);
    const feed = async (points: Landmark[] | undefined, frames: number) => {
      for (let i = 0; i < frames; i++) {
        await page.clock.runFor(100);
        await page.evaluate(
          (p) => (window as any).__deliver({ poseLandmarks: p }),
          points,
        );
      }
    };
    await feed(pose("knee", 90), 20);
    await feed(pose("knee", 170), 15);
    await feed([], 32);
    await expect(page.locator(".tracking-badge")).toContainText(
      "Session paused",
    );
    await feed(pose("knee", 90), 24);
    await expect(page.locator(".tracking-badge")).toContainText("Tracking");
    await expect(
      page.getByLabel("Camera rep count", { exact: true }),
    ).toHaveText("00");
    for (let i = 0; i <= 42; i++)
      await feed(pose("knee", 90 + 80 * Math.sin((Math.PI * i) / 42) ** 2), 1);
    await feed(pose("knee", 90), 5);
    await expect(
      page.getByLabel("Camera rep count", { exact: true }),
    ).toHaveText("01");
    const leaning = pose("knee", 90);
    leaning[11].x = 0.3;
    leaning[12].x = 0.32;
    await feed(leaning, 40);
    await expect(
      page.getByRole("heading", {
        name: "Stack your shoulders over your hips.",
      }),
    ).toBeVisible();
    await expect(page.locator(".tracking-badge")).not.toContainText(
      "Session paused",
    );
    await expect(
      page.getByLabel("Camera rep count", { exact: true }),
    ).toHaveText("01");
    await page
      .getByLabel("Camera tracked side", { exact: true })
      .selectOption("Right");
    await expect(
      page.getByLabel("Camera rep count", { exact: true }),
    ).toHaveText("01");
    await page.getByRole("button", { name: "Exit full-screen camera" }).click();
  } finally {
    await browser.close();
  }
});

test("automatic selection prefers a fully framed limb over a clipped high-confidence limb", () => {
  const tracker = new MotionTracker();
  let result;
  for (let now = 0; now <= 2000; now += 100) {
    const p = pose("curl", 170);
    p[15].x = 0.99;
    result = tracker.update(p, "curl", "Automatic", now);
  }
  expect(result?.ready).toBe(true);
  expect(result?.side).toBe("Right");
});
