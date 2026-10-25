import { test, expect } from "@playwright/test";
test("recovery journal, profile, guided session, persistence, and filtering", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Daily check-in", exact: true })
    .click();
  await page.getByLabel("Discomfort level").fill("4");
  await page.getByRole("button", { name: "Good", exact: true }).click();
  await page
    .getByLabel("Anything you want to remember?")
    .fill("Feeling a little more mobile today.");
  await page.getByRole("button", { name: "Save my check-in" }).click();
  await expect(page.locator(".stat-value").nth(2)).toContainText("4/10");
  await page.getByRole("button", { name: "Edit recovery profile" }).click();
  await page.getByLabel("Recovery area").selectOption("Shoulder");
  await page
    .getByLabel("Injury or recovery topic")
    .selectOption("General stiffness / movement confidence");
  await page.getByRole("button", { name: "Soreness", exact: true }).click();
  await page.getByRole("button", { name: "Save recovery profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Shoulder recovery" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Let’s get moving" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Shoulder side raise" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start guided session" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start guided session" }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Count a rep" }).click();
  await page.getByRole("button", { name: "Finish & save" }).click();
  await page.reload();
  await page.getByRole("button", { name: "My progress", exact: true }).click();
  await expect(page.getByText(/3 reps/)).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export my recovery journal" })
    .click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "rebound-recovery-journal.json",
  );
  await page
    .getByRole("button", { name: "Exercise library", exact: true })
    .click();
  await page.getByRole("button", { name: "Ankle", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ankle pumps" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Seated knee extension" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("mobile layout has no horizontal overflow and navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "My recovery", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your recovery, your pace." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "AI movement coach" }).click();
  await expect(
    page.getByRole("heading", { name: "Good movement starts here." }),
  ).toBeVisible();
});
test("camera permission failure offers manual session", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s get moving" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Enable AI camera" }).click();
  await expect(page.getByRole("alert")).toContainText("count reps manually");
  await page.getByRole("button", { name: "Start guided session" }).click();
  await expect(page.getByRole("button", { name: "Count a rep" })).toBeVisible();
});
test("local pose model initializes, runs inference, and releases camera", async ({
  browser,
}) => {
  const { chromium } = await import("@playwright/test");
  const b = await chromium.launch({
    executablePath: browser.browserType().executablePath().includes("/usr/bin")
      ? browser.browserType().executablePath()
      : process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const context = await b.newContext({ permissions: ["camera"] });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://localhost:5173");
    await page.getByRole("button", { name: "Let’s get moving" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enable AI camera" }).click();
    await expect(
      page.getByText("No body detected. Step into view with good lighting."),
    ).toBeVisible({ timeout: 50000 });
    expect(
      await page
        .locator("video")
        .evaluate((v: HTMLVideoElement) => v.readyState >= 2),
    ).toBeTruthy();
    await page.getByRole("button", { name: "Pause session" }).click();
    await expect(page.locator("video")).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await b.close();
  }
});
