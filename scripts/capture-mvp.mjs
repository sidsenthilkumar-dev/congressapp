import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = process.env.PREVIEW_URL || "http://localhost:4173";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
async function fillPlan(page) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .locator("nav")
    .getByRole("button", { name: "My routines", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a routine", exact: true })
    .click();
  await page.getByLabel("Routine name").fill("My afternoon reset · example");
  await page
    .getByLabel(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "America/New_York",
      }),
      { exact: true },
    )
    .click();
  await page.getByRole("checkbox", { name: /Standing bicep curl/ }).check();
  await page.getByRole("checkbox", { name: /Seated hip march/ }).check();
  await page
    .getByLabel("Notes from my clinician")
    .fill(
      "Example plan: use only the movements and dose cleared by your clinician.",
    );
  await page.getByRole("button", { name: "Save routine", exact: true }).click();
  await page.locator(".toast").waitFor({ state: "hidden" });
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    timezoneId: "America/New_York",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fillPlan(page);
  await page
    .locator("nav")
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "artifacts/mvp-today.png", fullPage: true });
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Exercise reminders", exact: true })
    .click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "artifacts/mvp-reminders.png",
    fullPage: true,
  });
  await page
    .locator("nav")
    .getByRole("button", { name: "My progress", exact: true })
    .click();
  await page.getByRole("button", { name: "Prepare visit summary" }).click();
  await page
    .getByRole("textbox", { name: "Question for my clinician" })
    .fill("Example: what range should I use for this movement?");
  await page.getByRole("button", { name: "Add clinician question" }).click();
  await page
    .locator(".visit-summary")
    .screenshot({ path: "artifacts/mvp-visit-summary.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("nav")
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "artifacts/mvp-mobile.png", fullPage: true });
  console.log("MVP captures complete; browser errors:", JSON.stringify(errors));
  await context.close();
  if (process.env.CAPTURE_VIDEO === "1") {
    const recording = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      timezoneId: "America/New_York",
      recordVideo: { dir: "artifacts", size: { width: 1440, height: 1000 } },
    });
    const clip = await recording.newPage();
    await fillPlan(clip);
    await clip
      .locator("nav")
      .getByRole("button", { name: "Overview", exact: true })
      .click();
    await clip.waitForTimeout(1600);
    await clip
      .locator("nav")
      .getByRole("button", { name: "Reminders", exact: true })
      .click();
    await clip
      .getByRole("switch", { name: "Exercise reminders", exact: true })
      .click();
    await clip.getByLabel("My reminder time", { exact: true }).fill("18:00");
    await clip.waitForTimeout(1800);
    await clip.locator(".reminder-calendar").scrollIntoViewIfNeeded();
    await clip.waitForTimeout(1800);
    await clip
      .locator("nav")
      .getByRole("button", { name: "My progress", exact: true })
      .click();
    await clip.getByRole("button", { name: "Prepare visit summary" }).click();
    await clip
      .getByRole("textbox", { name: "Question for my clinician" })
      .fill("What range is right for me?");
    await clip.getByRole("button", { name: "Add clinician question" }).click();
    await clip.locator(".visit-summary").scrollIntoViewIfNeeded();
    await clip.waitForTimeout(2200);
    await clip
      .locator("nav")
      .getByRole("button", { name: "Overview", exact: true })
      .click();
    await clip
      .getByRole("button", { name: "Begin my routine", exact: true })
      .click();
    await clip.locator(".coach-view").scrollIntoViewIfNeeded();
    await clip.waitForTimeout(5000);
    const video = clip.video();
    await recording.close();
    if (video) {
      await video.saveAs("artifacts/rebound-mvp.webm");
      await video.delete();
    }
  }
} finally {
  await browser.close();
}
