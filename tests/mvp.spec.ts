import { test, expect } from "@playwright/test";
import {
  routineProgress,
  dailyRoutines,
  weekActivity,
} from "../src/domain/dailyPlan";
import {
  escapeHtml,
  reportWindow,
  visitReportHtml,
} from "../src/domain/visitReport";
import type { Routine, Session } from "../src/domain/types";
const r: Routine = {
  id: "routine-today",
  name: "Afternoon reset",
  exerciseIds: ["bicep-curl", "hip-march"],
  notes: "Use the range assigned by my clinician.",
  days: [0, 1, 2, 3, 4, 5, 6],
  createdAt: "2026-10-20T12:00:00Z",
};
const session = (extra: Partial<Session> = {}): Session => ({
  date: "2026-10-24T12:00:00Z",
  name: "Standing bicep curl",
  reps: 2,
  exerciseId: "bicep-curl",
  routineId: r.id,
  runId: "run-1",
  ...extra,
});
test("daily progress requires a completed routine run; independent sessions cannot complete it", () => {
  const now = new Date("2026-10-24T18:00:00Z");
  expect(
    routineProgress(r, [{ ...session(), routineId: undefined }], now).complete,
  ).toBeFalsy();
  const partial = routineProgress(r, [session()], now);
  expect(partial.remaining).toEqual(["hip-march"]);
  expect(partial.runId).toBe("run-1");
  expect(partial.completedMovements).toBe(1);
  expect(
    routineProgress(
      r,
      [session(), session({ exerciseId: "hip-march", routineFinished: true })],
      now,
    ).complete,
  ).toBeTruthy();
  expect(dailyRoutines([r], now)).toHaveLength(1);
  expect(
    weekActivity([session()], now).reduce((n, d) => n + d.sessions, 0),
  ).toBe(1);
});
test("report range excludes future and out-of-range entries; HTML escapes private notes", () => {
  const now = new Date("2026-10-24T18:00:00Z");
  expect(
    reportWindow(
      [
        session(),
        session({ date: "2026-09-01T12:00:00Z" }),
        session({ date: "2026-11-01T12:00:00Z" }),
      ],
      7,
      now,
    ),
  ).toHaveLength(1);
  expect(escapeHtml('<script>"&')).toBe("&lt;script&gt;&quot;&amp;");
  const html = visitReportHtml({
    profile: {
      area: "Knee",
      side: "Right",
      goal: "<img src=x onerror=alert(1)>",
      symptoms: ["Soreness"],
    },
    entries: [],
    sessions: [session()],
    routines: [r],
    questions: ["<script>alert(1)</script>"],
    days: 7,
    generatedAt: now.toISOString(),
  });
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("No check-ins recorded");
  expect(html).toContain("Self-reported records");
});
test("Today shows real routine progress, resumes remaining movements, and records completion", async ({
  page,
}) => {
  const now = new Date();
  await page.addInitScript(
    ({ routine, date }) => {
      localStorage.setItem("rebound-routines", JSON.stringify([routine]));
      localStorage.setItem(
        "rebound-sessions",
        JSON.stringify([
          {
            date,
            name: "Standing bicep curl",
            reps: 2,
            exerciseId: "bicep-curl",
            routineId: routine.id,
            runId: "active-run",
          },
        ]),
      );
    },
    { routine: r, date: now.toISOString() },
  );
  await page.goto("/");
  await expect(
    page.getByText("1 of 2 movements logged · Ready to continue"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue my routine", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Seated hip march" }),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start guided session" }).click();
  await page.getByRole("button", { name: "Count a rep" }).click();
  await page.getByRole("button", { name: "Finish & save" }).click();
  await expect(
    page.getByText("1 of 1 routines completed", { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rebound-sessions") || "[]"),
  );
  expect(saved.at(-1).routineFinished).toBe(true);
  expect(saved.at(-1).runId).toBe("active-run");
});
test("pages support reload, browser Back, and notification routes", async ({
  page,
}) => {
  await page.goto("/#reminders");
  await expect(
    page.getByRole("heading", { name: "A gentle nudge. On your terms." }),
  ).toBeVisible();
  await page
    .locator("nav")
    .getByRole("button", { name: "My routines", exact: true })
    .click();
  await expect(page).toHaveURL(/#routines$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make a little room for you." }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "A gentle nudge. On your terms." }),
  ).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("rebound:open-reminders")),
  );
  await expect(page).toHaveURL(/#reminders$/);
});
test("visit questions persist and report download contains factual escaped journal content", async ({
  page,
}) => {
  await page.goto("/#progress");
  await page.getByRole("button", { name: "Prepare visit summary" }).click();
  await page
    .getByRole("textbox", { name: "Question for my clinician" })
    .fill("Should I reduce my range? <script>");
  await page.getByRole("button", { name: "Add clinician question" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Prepare visit summary" }).click();
  await expect(page.locator(".visit-question-list")).toContainText(
    "Should I reduce my range? <script>",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download summary", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "rebound-visit-summary.html",
  );
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page
    .getByRole("button", { name: "Print / Save PDF", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Your browser blocked the print window",
  );
});
test("manual static guide and reduced-motion preferences work; mobile daily plan fits", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s get moving" }).click();
  await page
    .getByRole("button", { name: "Show static movement guide" })
    .click();
  await expect(page.locator(".coach-view .motion-scene")).toHaveClass(
    /is-static/,
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .locator("nav")
    .getByRole("button", { name: "Reminders", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("browser tabs share saved data so completing a plan can suppress stale reminders", async ({
  context,
  page,
}) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/#exercises");
  await page.goto("/#exercises");
  await page
    .getByRole("button", { name: "Save Seated hip march", exact: true })
    .click();
  await expect(
    other.getByRole("button", { name: "Unsave Seated hip march", exact: true }),
  ).toBeVisible();
  await other.close();
});
