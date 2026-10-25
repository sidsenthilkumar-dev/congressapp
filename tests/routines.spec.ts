import { test, expect } from "@playwright/test";
import { exercises, exerciseById } from "../src/domain/exercises";
import { conditions, regions } from "../src/domain/recovery";
const navigate = async (page: import("@playwright/test").Page, name: string) =>
  page.locator("nav").getByRole("button", { name, exact: true }).click();
test("movement content has stable identities, detailed instructions, and accurate source provenance", () => {
  expect(exercises).toHaveLength(18);
  expect(exerciseById.size).toBe(18);
  expect(exercises.filter((e) => e.camera)).toHaveLength(3);
  expect(exercises.filter((e) => e.source.verified)).toHaveLength(16);
  for (const e of exercises) {
    expect(e.steps.length).toBeGreaterThanOrEqual(3);
    expect(e.equipment).toBeTruthy();
    expect(e.stopIf).toBeTruthy();
    if (e.source.verified)
      expect(e.source.url).toMatch(/^https:\/\/www\.nhs\.uk\//);
  }
  expect(conditions).toHaveLength(150);
  expect(regions).toHaveLength(13);
});
test("bookmarks, exercise search, and source-backed manual guides survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Exercise library");
  await page.getByLabel("Search exercises").fill("hip march");
  await expect(page.locator(".exercise-tile")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Save Seated hip march", exact: true })
    .click();
  await page.reload();
  await navigate(page, "Exercise library");
  await page.getByRole("button", { name: /^Saved/ }).click();
  await expect(page.locator(".exercise-tile")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Open Seated hip march guide", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /NHS · Sitting exercises/ }),
  ).toHaveAttribute(
    "href",
    "https://www.nhs.uk/live-well/exercise/sitting-exercises/",
  );
  await expect(
    page.getByRole("dialog").getByRole("img", {
      name: "Seated hip march: illustrated movement guide",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enable AI camera" }),
  ).toHaveCount(0);
});
test("routine scheduling, clinician notes, edit cancellation, and sequential sessions", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "My routines");
  await page
    .getByRole("button", { name: "Create a routine", exact: true })
    .click();
  await page.getByRole("button", { name: "Save routine", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Give your routine a name.");
  await page.getByLabel("Routine name").fill("My afternoon reset");
  await page.getByLabel("Monday", { exact: true }).click();
  await page.getByLabel("Wednesday", { exact: true }).click();
  await page
    .getByLabel("Notes from my clinician")
    .fill("Use my prescribed comfortable range. Stop if symptoms worsen.");
  await page.getByRole("checkbox", { name: /Standing bicep curl/ }).check();
  await page.getByRole("checkbox", { name: /Seated hip march/ }).check();
  await page.getByRole("button", { name: "Save routine", exact: true }).click();
  await page.reload();
  await navigate(page, "My routines");
  await expect(
    page.getByRole("heading", { name: "My afternoon reset" }),
  ).toBeVisible();
  await expect(page.locator(".routine-days")).toHaveText("Mon · Wed");
  await expect(page.locator(".clinician-note")).toContainText(
    "Use my prescribed comfortable range.",
  );
  await page.getByRole("button", { name: "Edit routine", exact: true }).click();
  await page.getByLabel("Routine name").fill("An unsaved edit");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My afternoon reset" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Begin routine", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Standing bicep curl" }),
  ).toBeVisible();
  await page.getByLabel("My clinician’s rep target").fill("2");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start guided session" }).click();
  await page.getByRole("button", { name: "Count a rep" }).click();
  await page.getByRole("button", { name: "Count a rep" }).click();
  await expect(
    page.getByText(
      "Your chosen target is reached. Pause and check how you feel.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish & save" }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Seated hip march" }),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start guided session" }).click();
  await page.getByRole("button", { name: "Count a rep" }).click();
  await page.getByRole("button", { name: "Finish & save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigate(page, "My progress");
  await expect(page.getByText(/2 reps/)).toBeVisible();
  await expect(page.getByText(/1 reps/)).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rebound-sessions") || "[]"),
  );
  expect(saved[0].target).toBe(2);
  expect(saved[0].durationSeconds).toBeGreaterThanOrEqual(0);
});
test("rest timer finishes and manual rep undo updates the target cue", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s get moving" }).click();
  await page.getByLabel("Rest duration", { exact: true }).selectOption("15");
  await page.getByRole("button", { name: "Start rest timer" }).click();
  await page.clock.fastForward(15000);
  await expect(page.getByLabel("Rest time remaining")).toHaveText("0:00");
  await expect(
    page.getByText("Rest timer finished. Resume only when comfortable."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset rest timer" }).click();
  await expect(page.getByLabel("Rest time remaining")).toHaveText("0:15");
  await page.getByLabel("My clinician’s rep target").fill("1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start guided session" }).click();
  await page.getByRole("button", { name: "Count a rep" }).click();
  await expect(page.locator(".target-reached")).toBeVisible();
  await page.getByRole("button", { name: "Undo last manual rep" }).click();
  await expect(page.locator(".target-reached")).toHaveCount(0);
  await expect(page.locator(".session-metrics strong").first()).toHaveText(
    "00",
  );
});
test("cancelled profile edits leave the journal profile unchanged", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Edit recovery profile" }).click();
  await page.getByLabel("Recovery area").selectOption("Neck");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("heading", { name: "Knee recovery" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Daily check-in", exact: true })
    .click();
  await page.getByLabel("Discomfort level").fill("5");
  await page.getByRole("button", { name: "Save my check-in" }).click();
  await page
    .getByRole("button", { name: "Daily check-in", exact: true })
    .click();
  await expect(page.getByLabel("Discomfort level")).toHaveValue("5");
});
test("mobile routines and new exercise areas do not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await navigate(page, "My routines");
  await page
    .getByRole("button", { name: "Create a routine", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Close routine editor" }).click();
  await navigate(page, "Exercise library");
  await page.getByRole("button", { name: "Lower leg", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Supported calf stretch" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("malformed browser storage recovers without crashing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("rebound-injury", '{"area":null}');
    localStorage.setItem("rebound-routines", '[{"bad":true}]');
    localStorage.setItem("rebound-sessions", "null");
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Knee recovery" }),
  ).toBeVisible();
  await navigate(page, "My routines");
  await expect(
    page.getByRole("heading", { name: "Build a routine that feels like you." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
