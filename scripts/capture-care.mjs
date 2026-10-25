import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = process.env.PREVIEW_URL || "http://localhost:4173";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/New_York",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/#ask");
  await page
    .getByLabel("What’s on your mind?")
    .fill("I finished working out yesterday and my hamstrings feel sore.");
  await page.getByRole("button", { name: "Explore next steps" }).click();
  await page
    .getByRole("button", { name: "After activity", exact: true })
    .click();
  await page.getByLabel(/Discomfort right now/).fill("2");
  await page.getByRole("button", { name: "Yes, as usual" }).click();
  await page.getByLabel("Any concerning changes?").selectOption("none");
  await page
    .getByRole("heading", { name: "An easier day, with a check-in later." })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/care-ask.png", fullPage: true });
  await page.goto(base + "/#clinic");
  await page
    .getByRole("heading", { name: "A clearer connection to care." })
    .waitFor();
  await page.screenshot({ path: "artifacts/care-clinic.png", fullPage: true });
  await page.goto(base + "/#exercises");
  await page.getByLabel("Search exercises").fill("band curl");
  await page
    .getByRole("button", {
      name: "Open Resistance-band curl guide",
      exact: true,
    })
    .click();
  await page.getByLabel("Interactive movement lesson").waitFor();
  await page.screenshot({
    path: "artifacts/care-teaching.png",
    fullPage: true,
  });
  await page
    .getByRole("dialog")
    .locator(".coach-view")
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "artifacts/care-equipment.png",
    fullPage: true,
  });
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/New_York",
    reducedMotion: "reduce",
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await phone.newPage();
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(base + "/#ask");
  await mobile
    .getByRole("heading", { name: "Start with how you feel." })
    .waitFor();
  await mobile
    .getByLabel("What’s on your mind?")
    .fill("I finished working out and my hamstrings feel sore.");
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({
    path: "artifacts/care-mobile.png",
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      screens: [
        "care-ask.png",
        "care-clinic.png",
        "care-teaching.png",
        "care-equipment.png",
        "care-mobile.png",
      ],
      browserErrors: errors,
    }),
  );
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
