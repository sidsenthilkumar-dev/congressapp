import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  await mkdir("public/icons", { recursive: true });
  const svg = await readFile("public/app-icon.svg", "utf8");
  await mkdir("mobile/assets", { recursive: true });
  for (const size of [180, 192, 512, 1024]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<html><head><style>html,body{margin:0;width:100%;height:100%;background:#344b35}svg{display:block;width:100vw;height:100vh}</style></head><body>${svg}</body></html>`,
    );
    await page.screenshot({
      path:
        size === 1024
          ? "mobile/assets/icon.png"
          : `public/icons/rebound-${size}.png`,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
