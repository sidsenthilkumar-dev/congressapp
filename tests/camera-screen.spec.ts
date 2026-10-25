import { test, expect, chromium } from "@playwright/test";
import { testOrigin } from "./test-server";
test("phone camera fills the viewport, exposes its counter, traps focus, and exits cleanly", async () => {
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
        callback: any;
        setOptions() {}
        initialize() {
          return Promise.resolve();
        }
        onResults(callback: any) {
          this.callback = callback;
        }
        send() {
          this.callback({});
          return Promise.resolve();
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
    const screen = page.getByRole("dialog", {
      name: "Full-screen movement camera",
    });
    await expect(screen).toBeVisible();
    await expect(
      page.getByLabel("Camera rep count", { exact: true }),
    ).toHaveText("00");
    const badge = await screen.locator(".tracking-badge").boundingBox();
    expect(badge!.height).toBeLessThan(60);
    expect(badge!.x).toBeGreaterThanOrEqual(0);
    await screen.screenshot({ path: "artifacts/camera-fullscreen-phone.png" });
    const bounds = await screen.boundingBox();
    expect(bounds).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
    await expect(
      page.getByRole("button", { name: "Pause session", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Exit full-screen camera" }).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.getByRole("button", { name: "Pause session", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(screen).toHaveCount(0);
    await expect(page.locator("video")).toHaveCount(0);
    expect(
      await page.locator(".app").evaluate((app: HTMLElement) => app.inert),
    ).toBe(false);
    await expect(
      page.getByRole("button", { name: "Start guided session" }),
    ).toBeEnabled();
  } finally {
    await browser.close();
  }
});

test("Expo host permission gates live camera capture and denial returns to the guide", async () => {
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
      (window as any).__captures = 0;
      (window as any).__allowCamera = true;
      (window as any).__granted = false;
      (window as any).__native = [];
      const original = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices,
      );
      navigator.mediaDevices.getUserMedia = (constraints) => {
        if (!(window as any).__granted)
          throw Error("Capture began before host permission");
        (window as any).__captures++;
        return original(constraints);
      };
      window.ReactNativeWebView = {
        postMessage(raw: string) {
          const data = JSON.parse(raw);
          (window as any).__native.push(data);
          if (data.type === "REQUEST_CAMERA_PERMISSION") {
            (window as any).__granted = (window as any).__allowCamera;
            window.dispatchEvent(
              new CustomEvent("rebound:native-camera-permission", {
                detail: {
                  requestId: data.requestId,
                  granted: (window as any).__granted,
                },
              }),
            );
          }
        },
      };
      window.Pose = class {
        callback: any;
        setOptions() {}
        initialize() {
          return Promise.resolve();
        }
        onResults(callback: any) {
          this.callback = callback;
        }
        send() {
          this.callback({});
          return Promise.resolve();
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
    await expect
      .poll(() => page.evaluate(() => (window as any).__captures))
      .toBe(1);
    await expect(
      page.getByRole("dialog", { name: "Full-screen movement camera" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Camera rep count", { exact: true }),
    ).toHaveText("00");
    await page.getByRole("button", { name: "Exit full-screen camera" }).click();
    await page.evaluate(() => {
      (window as any).__allowCamera = false;
      (window as any).__captures = 0;
    });
    await page.getByRole("button", { name: "Enable AI camera" }).click();
    await expect(page.getByText(/Camera permission is off/)).toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "Full-screen movement camera" }),
    ).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__captures)).toBe(0);
  } finally {
    await browser.close();
  }
});
