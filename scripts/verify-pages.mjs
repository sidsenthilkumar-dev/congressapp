import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base =
  process.env.PAGES_PREVIEW_URL || "http://localhost:4191/congressapp/";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
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
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["camera"],
  });
  const page = await context.newPage();
  const errors = [],
    pose = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/pose/")) pose.push(r.url());
  });
  await page.goto(base);
  await expect(
    page.getByRole("heading", { name: "A little stronger, every day." }),
  ).toBeVisible();
  const icon = page.locator('link[rel="icon"]');
  expect(await icon.getAttribute("href")).toBe(
    new URL("app-icon.svg", base).pathname,
  );
  const manifestResponse = await context.request.get(
    base + "manifest.webmanifest",
  );
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(new URL(manifest.start_url, base).href).toBe(base);
  await page.getByRole("button", { name: "Let’s get moving" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Enable AI camera" }).click();
  await expect(
    page.getByText("No body detected. Step into view with good lighting."),
  ).toBeVisible({ timeout: 60000 });
  const stage = page.getByRole("dialog", {
    name: "Full-screen movement camera",
  });
  expect(await stage.boundingBox()).toMatchObject({
    x: 0,
    y: 0,
    width: 390,
    height: 844,
  });
  await expect(page.getByLabel("Camera rep count", { exact: true })).toHaveText(
    "00",
  );
  expect(pose.length).toBeGreaterThan(2);
  for (const url of pose) expect(url.startsWith(base + "pose/")).toBe(true);
  await mkdir("artifacts", { recursive: true });
  await stage.screenshot({ path: "artifacts/pages-camera.png" });
  await page.getByRole("button", { name: "Exit full-screen camera" }).click();
  await expect(page.locator("video")).toHaveCount(0);
  await page.goto(base + "#reminders");
  const scope = await page.evaluate(async () => {
    const worker = await navigator.serviceWorker.register(
      new URL("notification-worker.js", location.href),
    );
    await navigator.serviceWorker.ready;
    return worker.scope;
  });
  expect(scope).toBe(base);
  expect(errors).toEqual([]);
  console.log(
    "Project-path release verified: page, icon, manifest, local pose model, full-screen camera, stream cleanup, and notification-worker scope. Synthetic stream; no real-person accuracy claim.",
  );
} finally {
  await browser.close();
}
