import { testOrigin } from "./test-server";
import { test, expect } from "@playwright/test";
import { assessCheckIn, emptyAnswers } from "../src/domain/checkIn";
import { exercises } from "../src/domain/exercises";
import { cameraProtocol, trackingCoverage } from "../src/domain/coaching";
import {
  MotionTracker,
  jointAngle,
  type Landmark,
  type TrackedMovement,
} from "../src/domain/tracking";
import {
  validateAppUrl,
  validReminderSchedule,
  nativeClipFormat,
} from "../mobile/src/config";
import { parsePlan } from "../src/domain/clinic";
test("camera setup can be canceled while the pose model is still loading", async () => {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  try {
    const context = await browser.newContext({ permissions: ["camera"] });
    await context.addInitScript(() => {
      window.Pose = class {
        setOptions() {}
        onResults() {}
        initialize() {
          return new Promise<void>(() => {});
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
      page.getByRole("button", { name: "Cancel camera setup" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel camera setup" }).click();
    await expect(page.locator("video")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Start guided session" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Start guided session" }).click();
    await expect(
      page.getByRole("button", { name: "Count a rep" }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});
test("check-in gates concerning descriptions and answers before a general draft", () => {
  const mild = {
    onset: "after" as const,
    pain: 2,
    function: "normal" as const,
    warning: "none" as const,
  };
  expect(
    assessCheckIn(
      "My hamstrings feel sore after yesterday’s workout",
      emptyAnswers,
    ),
  ).toBeNull();
  expect(assessCheckIn("My hamstrings feel sore", mild)?.level).toBe("general");
  expect(
    assessCheckIn("My hamstrings feel tired after yesterday’s workout", mild)
      ?.level,
  ).toBe("general");
  expect(assessCheckIn("I have chest pain", mild)?.level).toBe("emergency");
  expect(
    assessCheckIn("My urine is dark urine after exercise", mild)?.level,
  ).toBe("assessment");
  for (const answer of [
    { onset: "during" as const },
    { pain: 8 },
    { function: "limited" as const },
    { warning: "urgent" as const },
  ])
    expect(assessCheckIn("My leg is sore", { ...mild, ...answer })?.level).toBe(
      "assessment",
    );
});
test("every exercise has an explicit coverage boundary and equipment guides never claim source review", () => {
  for (const e of exercises) {
    expect(Boolean(cameraProtocol(e))).toBe(e.camera);
    expect(trackingCoverage(e).detail).toBeTruthy();
  }
  for (const id of [
    "band-curl",
    "band-row",
    "dowel-flexion",
    "seated-hamstring",
  ]) {
    const e = exercises.find((e) => e.id === id)!;
    expect(e.source.verified).toBeNull();
    expect(e.stopIf).toBeTruthy();
  }
  expect(
    trackingCoverage(exercises.find((e) => e.id === "neck-turn")!).mode,
  ).toBe("manual");
});
test("native client rejects unsafe app origins and malformed notification schedules", () => {
  expect(nativeClipFormat("file:///clip.mov").mimeType).toBe("video/quicktime");
  expect(nativeClipFormat("file:///clip.mp4").mimeType).toBe("video/mp4");
  expect(validateAppUrl("https://rebound.example")).toBe(
    "https://rebound.example",
  );
  expect(validateAppUrl("http://192.168.1.10:5173", true)).toBe(
    "http://192.168.1.10:5173",
  );
  for (const url of [
    "javascript:alert(1)",
    "http://public.example",
    "https://user:pass@example.com",
    "https://example.com/path",
    "https://example.com/?key=secret",
  ])
    expect(() => validateAppUrl(url, true)).toThrow();
  expect(() => validateAppUrl("http://192.168.1.10:5173", false)).toThrow();
  expect(
    validReminderSchedule({ days: [1, 1, 3], hour: 18, minute: 30 }).days,
  ).toEqual([1, 3]);
  for (const value of [
    { days: [], hour: 10, minute: 0 },
    { days: [8], hour: 10, minute: 0 },
    { days: [1], hour: 24, minute: 0 },
    { days: [1], hour: 10, minute: NaN },
  ])
    expect(() => validReminderSchedule(value)).toThrow();
});
function frame(type: TrackedMovement, angle: number): Landmark[] {
  const p: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.99,
  }));
  const aspect = 4 / 3,
    rad = (angle * Math.PI) / 180;
  p[11] = { x: 0.5, y: 0.2, visibility: 0.99 };
  p[12] = { x: 0.52, y: 0.2, visibility: 0.99 };
  p[23] = { x: 0.5, y: 0.5, visibility: 0.99 };
  p[24] = { x: 0.52, y: 0.5, visibility: 0.99 };
  if (type === "squat" || type === "sit-stand") {
    p[25] = { x: 0.62, y: 0.63, visibility: 0.99 };
    const dir = Math.atan2(0.5 - 0.63, (0.5 - 0.62) * aspect) + rad;
    p[27] = {
      x: 0.62 + (Math.cos(dir) * 0.2) / aspect,
      y: 0.63 + Math.sin(dir) * 0.2,
      visibility: 0.99,
    };
  } else if (type === "wall-press") {
    p[13] = { x: 0.5, y: 0.36, visibility: 0.99 };
    p[15] = {
      x: 0.5 + (Math.sin(rad) * 0.2) / aspect,
      y: 0.36 - Math.cos(rad) * 0.2,
      visibility: 0.99,
    };
    p[27] = { x: 0.5, y: 0.85, visibility: 0.99 };
  } else if (type === "hip-abduction") {
    p[11].x = 0.35;
    p[12].x = 0.65;
    p[23].x = 0.35;
    p[25] = {
      x: 0.35 + (Math.sin(rad) * 0.2) / aspect,
      y: 0.5 - Math.cos(rad) * 0.2,
      visibility: 0.99,
    };
    p[27] = {
      x: 0.35 + (Math.sin(rad) * 0.4) / aspect,
      y: 0.5 - Math.cos(rad) * 0.4,
      visibility: 0.99,
    };
  } else {
    p[13] = {
      x: 0.5 + (Math.sin(rad) * 0.16) / aspect,
      y: 0.2 + Math.cos(rad) * 0.16,
      visibility: 0.99,
    };
    p[15] = {
      x: 0.5 + (Math.sin(rad) * 0.3) / aspect,
      y: 0.2 + Math.cos(rad) * 0.3,
      visibility: 0.99,
    };
  }
  return p;
}
for (const type of [
  "squat",
  "sit-stand",
  "hip-abduction",
  "wall-press",
  "flexion",
] as TrackedMovement[])
  test(`${type}: counts a full cycle, rejects occlusion and non-finite inputs`, () => {
    const tracker = new MotionTracker();
    let now = 100,
      count = 0;
    const rest = type === "sit-stand" ? 90 : type === "flexion" ? 5 : 175;
    const out =
      type === "sit-stand"
        ? 170
        : type === "flexion"
          ? 80
          : type === "hip-abduction"
            ? 140
            : 90;
    const feed = (angle: number, frames = 35) => {
      let r;
      for (let i = 0; i < frames; i++) {
        r = tracker.update(frame(type, angle), type, "Left", now, 4 / 3);
        now += 100;
        if (r.rep) count++;
      }
      return r!;
    };
    expect(feed(rest).ready).toBeTruthy();
    feed(out);
    expect(count).toBe(0);
    feed(rest);
    expect(count).toBe(1);
    feed(out);
    const bad = frame(type, out);
    bad[11].x = NaN;
    expect(tracker.update(bad, type, "Left", now, 4 / 3).rep).toBeFalsy();
    now += 100;
    feed(rest);
    expect(count).toBe(1);
    expect(
      tracker.update(undefined, type, "Left", now, 4 / 3).ready,
    ).toBeFalsy();
    expect(
      jointAngle({ x: NaN, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }),
    ).toBeNull();
  });
test("follow-up check-in makes a general draft and stops for emergency symptoms", async ({
  page,
}) => {
  await page.goto("/#ask");
  await page
    .getByLabel("What’s on your mind?")
    .fill("My hamstrings feel sore after yesterday’s workout");
  await page.getByRole("button", { name: "Explore next steps" }).click();
  await page
    .getByRole("button", { name: "After activity", exact: true })
    .click();
  await page.getByLabel(/Discomfort right now/).fill("2");
  await page.getByRole("button", { name: "Yes, as usual" }).click();
  await page.getByLabel("Any concerning changes?").selectOption("none");
  await expect(
    page.getByRole("heading", {
      name: "An easier day, with a check-in later.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ask for an AI explanation" }),
  ).toBeDisabled();
  await page
    .getByLabel("What’s on your mind?")
    .fill("I have chest pain after exercise");
  await page.getByRole("button", { name: "Explore next steps" }).click();
  await expect(
    page.getByRole("heading", { name: "Pause. Get emergency help." }),
  ).toBeVisible();
  await expect(
    page.getByText("GENERAL RECOVERY-DAY DRAFT", { exact: true }),
  ).toHaveCount(0);
});
test("clinic imports a plan without inventing a sender or bypassing safety", async ({
  page,
}) => {
  await page.goto("/#clinic");
  await expect(
    page.getByText("Clinic delivery is not connected yet."),
  ).toBeVisible();
  await page.getByLabel("Import clinician plan file").setInputFiles({
    name: "plan.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        title: "My clinician’s example",
        notes: "Use only my cleared range",
        items: [{ exerciseId: "bicep-curl", note: "Stop for pain", reps: 3 }],
      }),
    ),
  });
  await expect(
    page.getByText("IMPORTED FILE · AUTHOR NOT VERIFIED"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open guide", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("Your individual instructions"),
  ).toBeVisible();
  await expect(page.getByLabel("My clinician’s rep target")).toHaveValue("3");
  await expect(
    page.getByRole("dialog").locator(".session-plan-note"),
  ).toContainText("Use only my cleared range");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Add to my routines" }).click();
  await page.goto("/#routines");
  await expect(
    page.getByRole("heading", { name: "My clinician’s example" }),
  ).toBeVisible();
});
test("plan validation rejects malformed, unknown, repeated, and excessive-dose entries", () => {
  const base = {
    title: "My plan",
    notes: "Follow individual guidance",
    items: [{ exerciseId: "bicep-curl", note: "Use cleared range", reps: 3 }],
  };
  expect(parsePlan(base).items[0].reps).toBe(3);
  for (const items of [
    [null],
    [{ exerciseId: "unknown", note: "" }],
    [...base.items, ...base.items],
    [{ exerciseId: "bicep-curl", note: "", reps: 500 }],
  ])
    expect(() => parsePlan({ ...base, items })).toThrow();
});
test("camera mirror and interactive teaching are available for a manual exercise", async ({
  page,
}) => {
  await page.goto("/#exercises");
  await page.getByLabel("Search exercises").fill("hamstring");
  await page
    .getByRole("button", {
      name: "Open Clinician-guided seated hamstring stretch guide",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Interactive movement lesson")).toBeVisible();
  await page.getByRole("button", { name: /Check your setup/ }).click();
  await expect(page.getByLabel("Interactive movement lesson")).toContainText(
    "cannot verify its form",
  );
  await expect(
    page.getByRole("button", { name: "Open camera mirror" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enable AI camera" }),
  ).toHaveCount(0);
});
test("clinic will not mark an existing clip as sent when no service is connected", async ({
  page,
}) => {
  await page.goto("/#clinic");
  await page.getByLabel(/Or choose an existing short clip/).setInputFiles({
    name: "example.webm",
    mimeType: "video/webm",
    buffer: Buffer.from("not an actual patient clip"),
  });
  await expect(
    page.getByText("Clip selected locally. It has not been uploaded or sent."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Share reviewed clip with clinician" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Share reviewed clip with clinician" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Remove selected clip" }).click();
  await expect(page.getByLabel("Selected clip for review")).toHaveCount(0);
});
test("new care pages and equipment guides respect mobile width and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [route, heading] of [
    ["ask", "Start with how you feel."],
    ["clinic", "A clearer connection to care."],
    ["exercises", "Find your next small step."],
  ]) {
    await page.goto(`/#${route}`);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.getByLabel("Search exercises").fill("band curl");
  await page
    .getByRole("button", {
      name: "Open Resistance-band curl guide",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog").locator("animate,animateTransform"),
  ).toHaveCount(0);
});
test("the slow-practice threshold rejects quick cycles before accepting a controlled cycle", () => {
  const tracker = new MotionTracker();
  let now = 100,
    count = 0,
    tempo = false;
  const feed = (angle: number, frames: number) => {
    for (let i = 0; i < frames; i++) {
      const r = tracker.update(
        frame("wall-press", angle),
        "wall-press",
        "Left",
        now,
        4 / 3,
        3000,
      );
      now += 100;
      if (r.rep) count++;
      if (r.correction === "tempo") tempo = true;
    }
  };
  feed(175, 20);
  feed(90, 10);
  feed(175, 10);
  expect(count).toBe(0);
  expect(tempo).toBeTruthy();
  feed(90, 35);
  feed(175, 10);
  expect(count).toBe(1);
});
test("native recording is an explicit bridge request and attaching a clip never uploads it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).nativeRequests = [];
    window.ReactNativeWebView = {
      postMessage: (message) =>
        (window as any).nativeRequests.push(JSON.parse(message)),
    };
  });
  await page.goto("/#clinic");
  await expect(
    page.getByRole("heading", { name: "A clearer connection to care." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as any).nativeRequests.filter(
        (r: any) => r.type === "RECORD_CLIP",
      ),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Record a private clip" }).click();
  expect(
    await page.evaluate(() =>
      (window as any).nativeRequests.filter(
        (r: any) => r.type === "RECORD_CLIP",
      ),
    ),
  ).toEqual([{ type: "RECORD_CLIP", exerciseId: "knee-extension" }]);
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("rebound:native-clip", {
        detail: {
          base64: btoa("synthetic test bytes"),
          mimeType: "video/mp4",
          exerciseId: "knee-extension",
        },
      }),
    ),
  );
  await expect(page.getByLabel("Selected clip for review")).toBeVisible();
  await expect(page.getByText(/iPhone clip attached locally/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Share reviewed clip with clinician" }),
  ).toBeDisabled();
});
test("native exports go to the share bridge only after a user selects export", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).nativeRequests = [];
    window.ReactNativeWebView = {
      postMessage: (message) =>
        (window as any).nativeRequests.push(JSON.parse(message)),
    };
  });
  await page.goto("/#progress");
  await page
    .getByRole("button", { name: "Export my recovery journal" })
    .click();
  const requests = await page.evaluate(() =>
    (window as any).nativeRequests.filter((r: any) => r.type === "EXPORT_FILE"),
  );
  expect(requests).toHaveLength(1);
  expect(requests[0].type).toBe("EXPORT_FILE");
  expect(requests[0].name).toBe("rebound-recovery-journal.json");
  expect(() => JSON.parse(requests[0].content)).not.toThrow();
});
test("private browser recording stops the camera before review and never sends video automatically", async () => {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  try {
    const context = await browser.newContext({ permissions: ["camera"] });
    const page = await context.newPage();
    const requests: string[] = [];
    page.on("request", (r) => {
      if (/storage\/v1|functions\/v1/.test(r.url())) requests.push(r.url());
    });
    await page.goto(testOrigin + "/#clinic");
    await page.getByRole("button", { name: "Record a private clip" }).click();
    await expect(
      page.getByRole("button", { name: /Stop recording/ }),
    ).toBeVisible();
    await page.waitForTimeout(1100);
    await page.getByRole("button", { name: /Stop recording/ }).click();
    await expect(
      page.getByRole("button", { name: "Use this reviewed clip" }),
    ).toBeVisible();
    expect(
      await page
        .getByLabel("Clip preview")
        .evaluate((video: HTMLVideoElement) =>
          (video.srcObject as MediaStream)
            ?.getTracks()
            .every((t) => t.readyState === "ended"),
        ),
    ).toBeTruthy();
    expect(requests).toEqual([]);
    await page.getByRole("button", { name: "Use this reviewed clip" }).click();
    await expect(
      page.getByRole("button", { name: "Share reviewed clip with clinician" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Discard clip" }).click();
    await expect(
      page.getByRole("button", { name: "Record a private clip" }),
    ).toBeVisible();
  } finally {
    await browser.close();
  }
});
