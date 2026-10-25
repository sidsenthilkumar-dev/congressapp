import type { RecoveryProfile } from "./recovery";
import type { Entry, Routine, Session } from "./types";
import { requestNativeExport } from "../services/nativeBridge";
export type VisitReport = {
  profile: RecoveryProfile;
  entries: Entry[];
  sessions: Session[];
  routines: Routine[];
  questions: string[];
  days: number;
  generatedAt: string;
};
export function reportWindow<T extends { date: string }>(
  records: T[],
  days: number,
  now = new Date(),
) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return records
    .filter((r) => new Date(r.date) >= start && new Date(r.date) <= now)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function visitReportHtml(report: VisitReport) {
  const h = escapeHtml;
  const date = (value: string) =>
    h(
      new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Rebound · Personal visit summary</title><style>body{font:14px/1.7 system-ui,sans-serif;color:#233a2d;max-width:850px;margin:40px auto;padding:0 25px}h1{font-size:30px;letter-spacing:-1px}h2{font-size:18px;margin-top:30px;border-bottom:1px solid #dde5d7;padding-bottom:8px}p,li{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#697861}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:10px 8px;text-align:left;border-bottom:1px solid #e5eadd;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}footer{border-top:1px solid #dde5d7;margin-top:35px;padding-top:15px;font-size:11px;color:#697861}@media print{body{margin:0;max-width:none}tr{break-inside:avoid}h2{break-after:avoid}}</style></head><body><small>REBOUND · PERSONAL JOURNAL · LAST ${report.days} DAYS</small><h1>A clearer conversation about recovery.</h1><p>Generated ${date(report.generatedAt)}. Self-reported records, not a clinical assessment.</p><h2>My recovery</h2><p>${h(report.profile.area)} · ${h(report.profile.side)}<br>${h(report.profile.condition || "Not recorded")}<br>Goal: ${h(report.profile.goal)}<br>Symptoms recorded: ${h(report.profile.symptoms.join(", ") || "None recorded")}</p><h2>Questions for my clinician</h2>${report.questions.length ? `<ul>${report.questions.map((q) => `<li>${h(q)}</li>`).join("")}</ul>` : "<p>No questions added.</p>"}<h2>Check-ins (${report.entries.length})</h2>${report.entries.length ? `<table><thead><tr><th>Date</th><th>Discomfort</th><th>Energy</th><th>Notes</th></tr></thead><tbody>${report.entries.map((e) => `<tr><td>${date(e.date)}</td><td>${e.pain}/10</td><td>${h(e.energy)}</td><td>${h(e.note || "—")}</td></tr>`).join("")}</tbody></table>` : "<p>No check-ins recorded in this period.</p>"}<h2>Movement journal (${report.sessions.length})</h2>${report.sessions.length ? `<table><thead><tr><th>Date</th><th>Movement</th><th>Reps logged</th><th>Time logged</th></tr></thead><tbody>${report.sessions.map((s) => `<tr><td>${date(s.date)}</td><td>${h(s.name)}</td><td>${s.reps}</td><td>${s.durationSeconds === undefined ? "—" : Math.floor(s.durationSeconds / 60) + "m " + (s.durationSeconds % 60) + "s"}</td></tr>`).join("")}</tbody></table>` : "<p>No sessions recorded in this period.</p>"}<h2>Current routine notes</h2>${report.routines.length ? report.routines.map((r) => `<h3>${h(r.name)}</h3><p>${h(r.notes || "No notes recorded.")}</p>`).join("") : "<p>No routine notes recorded.</p>"}<footer>Prepared privately on this device. Includes sensitive health information: share only with someone you choose. This app does not diagnose, prescribe treatment, measure healing, or validate exercise safety. Current routine notes may have been edited after the journal dates shown.</footer></body></html>`;
}
export function downloadFile(content: string, name: string, type: string) {
  if (requestNativeExport(content, name, type)) return;
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
