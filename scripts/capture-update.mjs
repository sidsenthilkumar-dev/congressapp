import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const base = process.env.PREVIEW_URL || "http://localhost:4173";
async function sampleRoutine(page) {
  await page
    .locator("nav")
    .getByRole("button", { name: "My routines", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a routine", exact: true })
    .click();
  await page.getByLabel("Routine name").fill("My afternoon reset · example");
  await page.getByLabel("Monday", { exact: true }).click();
  await page.getByLabel("Wednesday", { exact: true }).click();
  await page.getByLabel("Friday", { exact: true }).click();
  await page.getByRole("checkbox", { name: /Standing bicep curl/ }).check();
  await page.getByRole("checkbox", { name: /Seated hip march/ }).check();
  await page.getByRole("checkbox", { name: /Ankle pumps/ }).check();
  await page
    .getByLabel("Notes from my clinician")
    .fill(
      "Example note: use only the range and dose cleared by your clinician. Stop if symptoms worsen.",
    );
  await page.getByRole("button", { name: "Save routine", exact: true }).click();
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .locator("nav")
    .getByRole("button", { name: "Exercise library", exact: true })
    .click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "artifacts/expanded-exercises.png" });
  await page
    .getByRole("button", { name: "Save Seated hip march", exact: true })
    .click();
  await sampleRoutine(page);
  await page.locator(".toast").waitFor({ state: "hidden" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/personal-routines.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit routine", exact: true }).click();
  await page.screenshot({
    path: "artifacts/routine-builder.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Exercise library", exact: true })
    .click();
  await page.getByLabel("Search exercises").fill("hip march");
  await page
    .getByRole("button", { name: "Open Seated hip march guide", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .screenshot({ path: "artifacts/sourced-movement-guide.png" });
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await page.screenshot({
    path: "artifacts/updated-dashboard.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("nav")
    .getByRole("button", { name: "My routines", exact: true })
    .click();
  await page.screenshot({
    path: "artifacts/mobile-routines.png",
    fullPage: true,
  });
  console.log(
    "Actual interface captures completed. Browser errors:",
    JSON.stringify(errors),
  );
  await context.close();
  if (process.env.CAPTURE_VIDEO === "1") {
    const recording = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      recordVideo: { dir: "artifacts", size: { width: 1440, height: 1000 } },
    });
    const clip = await recording.newPage();
    await clip.goto(base, { waitUntil: "networkidle" });
    await sampleRoutine(clip);
    await clip.waitForTimeout(1800);
    await clip
      .locator("nav")
      .getByRole("button", { name: "Exercise library", exact: true })
      .click();
    await clip.waitForTimeout(1800);
    await clip.getByLabel("Search exercises").fill("hip march");
    await clip
      .getByRole("button", { name: "Open Seated hip march guide", exact: true })
      .click();
    await clip
      .getByRole("img", {
        name: "Seated hip march: illustrated movement guide",
        exact: true,
      })
      .last()
      .scrollIntoViewIfNeeded();
    await clip.waitForTimeout(5500);
    await clip.getByRole("button", { name: "Close dialog" }).click();
    await clip
      .locator("nav")
      .getByRole("button", { name: "AI movement coach" })
      .click();
    await clip.getByRole("button", { name: "Preview form guidance" }).click();
    await clip
      .getByRole("button", { name: "Elbow position", exact: true })
      .click();
    await clip.getByLabel("Form correction preview").scrollIntoViewIfNeeded();
    await clip.waitForTimeout(5500);
    const video = clip.video();
    await recording.close();
    if (video) {
      await video.saveAs("artifacts/rebound-update.webm");
      await video.delete();
    }
  }
} finally {
  await browser.close();
}
