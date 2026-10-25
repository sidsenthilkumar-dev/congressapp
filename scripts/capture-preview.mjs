import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const context = await b.newContext({
    viewport: { width: 1440, height: 1120 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await page.screenshot({ path: "artifacts/dashboard.png", fullPage: true });
  await page
    .getByRole("button", { name: "Injury library", exact: true })
    .click();
  await page.getByRole("button", { name: "Knee", exact: true }).click();
  await page.screenshot({
    path: "artifacts/injury-library.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "AI movement coach" }).click();
  await page.getByRole("button", { name: "Preview form guidance" }).click();
  await page
    .getByRole("button", { name: "Elbow position", exact: true })
    .click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "artifacts/animated-coach.png",
    fullPage: true,
  });
  await page
    .getByLabel("Form correction preview")
    .screenshot({ path: "artifacts/coach-correction.png" });
  await page
    .getByRole("button", {
      name: "Open Standing bicep curl guide",
      exact: false,
    })
    .click();
  await page.getByRole("button", { name: "Set up for a clearer view" }).click();
  await page.getByRole("button", { name: "Preview form guidance" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "artifacts/exercise-guidance.png" });
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  console.log("Screenshots captured. Browser errors:", JSON.stringify(errors));
  await context.close();
  if (process.env.CAPTURE_VIDEO === "1") {
    const recording = await b.newContext({
      viewport: { width: 1100, height: 850 },
      recordVideo: { dir: "artifacts", size: { width: 1100, height: 850 } },
    });
    const clip = await recording.newPage();
    await clip.goto("http://localhost:4173", { waitUntil: "networkidle" });
    await clip.getByRole("button", { name: "AI movement coach" }).click();
    await clip.getByRole("button", { name: "Preview form guidance" }).click();
    await clip.getByLabel("Form correction preview").scrollIntoViewIfNeeded();
    // Record two complete animation cycles to make the actual UI motion reviewable.
    await clip.waitForTimeout(9500);
    const video = clip.video();
    await recording.close();
    if (video) {
      await video.saveAs("artifacts/movement-coach.webm");
      await video.delete();
    }
  }
} finally {
  await b.close();
}
