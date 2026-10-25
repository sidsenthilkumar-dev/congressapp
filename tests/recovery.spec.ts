import { testOrigin } from "./test-server";
import { test, expect } from "@playwright/test";
import {
  assessProfile,
  conditions,
  regions,
  type RecoveryProfile,
} from "../src/domain/recovery";
import {
  MotionTracker,
  jointAngle,
  type Landmark,
  type TrackedMovement,
} from "../src/domain/tracking";
const profile: RecoveryProfile = {
  area: "Knee",
  condition: "General stiffness / movement confidence",
  stage: "Ongoing / assessed",
  side: "Right",
  symptoms: ["Stiffness"],
  goal: "Move comfortably",
};
test("catalog covers every selectable region without duplicate conditions", () => {
  expect(conditions.length).toBeGreaterThan(75);
  for (const region of regions)
    expect(conditions.some((c) => c.area === region)).toBeTruthy();
  expect(new Set(conditions.map((c) => c.area + c.name)).size).toBe(
    conditions.length,
  );
});
test("safety holds override generic movement eligibility", () => {
  expect(assessProfile(profile).blocked).toBeFalsy();
  for (const condition of conditions.filter((c) => c.care !== "general"))
    expect(
      assessProfile({
        ...profile,
        area: condition.area,
        condition: condition.name,
      }).blocked,
      condition.name,
    ).toBeTruthy();
  for (const symptom of [
    "Swelling",
    "Weakness",
    "Numbness or tingling",
    "Cannot bear weight",
    "Hot or red joint",
    "Fever",
    "Severe sudden pain",
    "Chest pain / trouble breathing",
    "Bladder or bowel changes",
    "Head injury symptoms",
  ])
    expect(
      assessProfile({ ...profile, symptoms: [symptom] }).blocked,
      symptom,
    ).toBeTruthy();
  expect(
    assessProfile({ ...profile, stage: "New or worsening" }).blocked,
  ).toBeTruthy();
  expect(assessProfile(profile, 8).blocked).toBeTruthy();
  expect(
    assessProfile({ ...profile, condition: "Not diagnosed / unsure" }).blocked,
  ).toBeTruthy();
});
function points(type: TrackedMovement, angle: number): Landmark[] {
  const p = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.99,
  }));
  const aspect = 4 / 3;
  p[11] = { x: 0.5, y: 0.22, visibility: 0.99 };
  p[12] = { x: 0.52, y: 0.22, visibility: 0.99 };
  p[23] = { x: 0.5, y: 0.57, visibility: 0.99 };
  p[24] = { x: 0.52, y: 0.57, visibility: 0.99 };
  if (type === "curl") {
    p[13] = { x: 0.5, y: 0.42, visibility: 0.99 };
    p[15] = {
      x: 0.5 + (Math.sin((angle * Math.PI) / 180) * 0.17) / aspect,
      y: 0.42 - Math.cos((angle * Math.PI) / 180) * 0.17,
      visibility: 0.99,
    };
  }
  if (type === "knee") {
    p[25] = { x: 0.65, y: 0.57, visibility: 0.99 };
    p[27] = {
      x: 0.65 - (Math.cos((angle * Math.PI) / 180) * 0.19) / aspect,
      y: 0.57 + Math.sin((angle * Math.PI) / 180) * 0.19,
      visibility: 0.99,
    };
  }
  if (type === "shoulder") {
    p[11] = { x: 0.35, y: 0.22, visibility: 0.99 };
    p[12] = { x: 0.65, y: 0.22, visibility: 0.99 };
    p[23] = { x: 0.35, y: 0.57, visibility: 0.99 };
    p[13] = {
      x: 0.35 - (Math.sin((angle * Math.PI) / 180) * 0.15) / aspect,
      y: 0.22 + Math.cos((angle * Math.PI) / 180) * 0.15,
      visibility: 0.99,
    };
    p[15] = {
      x: 0.35 - (Math.sin((angle * Math.PI) / 180) * 0.29) / aspect,
      y: 0.22 + Math.cos((angle * Math.PI) / 180) * 0.29,
      visibility: 0.99,
    };
  }
  return p;
}
test("angle calculation respects image aspect ratio and rejects degenerate joints", () => {
  expect(
    jointAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, 2),
  ).toBeCloseTo(90);
  expect(jointAngle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
  expect(
    jointAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, 2),
  ).toBeCloseTo(63.4349, 3);
});
for (const type of ["knee", "curl", "shoulder"] as TrackedMovement[])
  test(
    type + ": calibration, full return, occlusion, and sustained hold",
    () => {
      const tracker = new MotionTracker();
      let now = 0,
        count = 0;
      const rest = type === "knee" ? 90 : type === "curl" ? 170 : 5,
        extended = type === "knee" ? 170 : type === "curl" ? 40 : 80;
      function feed(angle: number, frames: number) {
        let r;
        for (let i = 0; i < frames; i++) {
          r = tracker.update(points(type, angle), type, "Left", now, 4 / 3);
          now += 100;
          if (r.rep) count++;
        }
        return r!;
      }
      expect(feed(rest, 5).ready).toBeFalsy();
      expect(feed(rest, 15).ready).toBeTruthy();
      feed(extended, 20);
      expect(count).toBe(0);
      feed(rest, 20);
      expect(count).toBe(1);
      feed(rest, 20);
      expect(count).toBe(1);
      feed(extended, 20);
      const lost = tracker.update(undefined, type, "Left", now, 4 / 3);
      now += 100;
      expect(lost.ready).toBeFalsy();
      expect(lost.correction).toBe("visibility");
      feed(rest, 20);
      expect(count).toBe(1);
    },
  );
test("wrong view and upper-arm drift prevent camera counting", () => {
  const tracker = new MotionTracker();
  const p = points("curl", 170);
  p[12].x = 0.85;
  expect(tracker.update(p, "curl", "Left", 1000).correction).toBe("position");
  p[12].x = 0.52;
  p[13].x = 0.7;
  expect(tracker.update(p, "curl", "Left", 1100).correction).toBe("elbow");
});
test("injury search, safety hold, correction preview, and mobile library", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Injury library", exact: true })
    .click();
  await page.getByLabel("Search injuries").fill("ACL");
  await expect(page.locator(".condition-card")).toHaveCount(1);
  await page.locator(".condition-card").click();
  await expect(page.getByLabel("Injury or recovery topic")).toHaveValue(
    "ACL injury",
  );
  await page.getByRole("button", { name: "Save recovery profile" }).click();
  await page
    .getByRole("button", { name: "Exercise library", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Open Seated knee extension guide",
      exact: true,
    })
    .click();
  await expect(page.locator(".clinical-block")).toBeVisible();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Start guided session" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Enable AI camera" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Preview form guidance" }).click();
  await expect(page.getByLabel("Form correction preview")).toBeVisible();
  await expect(
    page.getByText("GUIDANCE PREVIEW · NOT A CAMERA FINDING"),
  ).toBeVisible();
  await expect(page.locator(".correcting-torso")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "More navigation" }).click();
  await page
    .getByRole("button", { name: "Injury library", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("sustained live misalignment opens an animated correction and does not count", async ({
  browser,
}) => {
  const { chromium } = await import("@playwright/test");
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  try {
    const context = await b.newContext({
      permissions: ["camera"],
      viewport: { width: 390, height: 844 },
    });
    const p = points("knee", 90);
    p[11].x = 0.3;
    p[12].x = 0.32;
    // Deterministic landmarks exercise the UI warning path; the separate camera test loads the real model.
    await context.addInitScript((landmarks) => {
      window.Pose = class {
        callback: any;
        setOptions() {}
        initialize() {
          return Promise.resolve();
        }
        onResults(cb: any) {
          this.callback = cb;
        }
        send() {
          this.callback({ poseLandmarks: landmarks });
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      } as any;
    }, p);
    const page = await context.newPage();
    await page.goto(testOrigin);
    await page.getByRole("button", { name: "Let’s get moving" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enable AI camera" }).click();
    await expect(
      page.getByLabel("Movement correction", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Stack your shoulders over your hips.",
      }),
    ).toBeVisible();
    await expect(page.locator(".session-metrics strong").first()).toHaveText(
      "00",
    );
    await expect(page.locator(".correcting-torso")).toBeVisible();
    const camera = page.getByRole("dialog", {
      name: "Full-screen movement camera",
    });
    await expect(
      camera.getByLabel("Movement correction", { exact: true }),
    ).toBeVisible();
    await camera.screenshot({ path: "artifacts/camera-correction-phone.png" });
    await page.getByRole("button", { name: "Dismiss correction" }).click();
    await expect(
      page.getByLabel("Movement correction", { exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Exit full-screen camera" }).click();
    await page.getByRole("button", { name: "Close dialog" }).click();
  } finally {
    await b.close();
  }
});
