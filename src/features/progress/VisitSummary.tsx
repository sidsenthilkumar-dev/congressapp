import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Download,
  FileText,
  Plus,
  Printer,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocalStorage } from "../../hooks/storage";
import {
  reportWindow,
  visitReportHtml,
  downloadFile,
} from "../../domain/visitReport";
import type { Entry, Routine, Session } from "../../domain/types";
import type { RecoveryProfile } from "../../domain/recovery";
import "./visit-summary.css";
const isQuestions = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length <= 20 &&
  v.every((x) => typeof x === "string" && x.length <= 500);
export function VisitSummary({
  profile,
  entries,
  sessions,
  routines,
}: {
  profile: RecoveryProfile;
  entries: Entry[];
  sessions: Session[];
  routines: Routine[];
}) {
  const [open, setOpen] = useState(false),
    [days, setDays] = useState(7),
    [draft, setDraft] = useState(""),
    [message, setMessage] = useState("");
  const questions = useLocalStorage<string[]>(
    "rebound-visit-questions",
    [],
    isQuestions,
  );
  const recentEntries = reportWindow(entries, days),
    recentSessions = reportWindow(sessions, days);
  const report = () => ({
    profile,
    entries: recentEntries,
    sessions: recentSessions,
    routines,
    questions: questions.value,
    days,
    generatedAt: new Date().toISOString(),
  });
  function print() {
    const popup = window.open("", "_blank");
    if (!popup) {
      setMessage(
        "Your browser blocked the print window. Download the summary to open and print it.",
      );
      return;
    }
    popup.opener = null;
    popup.document.open();
    popup.document.write(visitReportHtml(report()));
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }
  const add = () => {
    if (draft.trim() && questions.value.length < 20) {
      questions.setValue((items) => [...items, draft.trim().slice(0, 500)]);
      setDraft("");
    }
  };
  return (
    <section className={"visit-summary " + (open ? "is-open" : "")}>
      <div className="visit-summary-heading">
        <span className="visit-icon">
          <FileText size={22} />
        </span>
        <div>
          <span className="today-overline">FOR YOUR NEXT CONVERSATION</span>
          <h2>Your progress, ready to share.</h2>
          <p>
            Bring your check-ins, movement journal, and questions to your next
            appointment.
          </p>
        </div>
        <button
          className="outline"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close summary" : "Prepare visit summary"}
          <ArrowUpRight size={15} />
        </button>
      </div>
      {open && (
        <div className="visit-summary-content">
          <div className="visit-period">
            <label htmlFor="report-days">Journal period</label>
            <select
              id="report-days"
              value={days}
              onChange={(e) => setDays(+e.target.value)}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <span>
              {recentEntries.length} check-ins · {recentSessions.length}{" "}
              sessions
            </span>
          </div>
          <div className="visit-content-grid">
            <div>
              <h3>Questions I want to remember</h3>
              <p className="visit-help">
                Write down what changed, what feels difficult, or what you’d
                like to ask.
              </p>
              <div className="visit-question-input">
                <input
                  aria-label="Question for my clinician"
                  maxLength={500}
                  placeholder="e.g. Is this range still appropriate for me?"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
                <button
                  aria-label="Add clinician question"
                  disabled={!draft.trim() || questions.value.length >= 20}
                  onClick={add}
                >
                  <Plus size={18} />
                </button>
              </div>
              <ul className="visit-question-list">
                {questions.value.map((q, i) => (
                  <li key={i}>
                    <Check size={13} />
                    <span>{q}</span>
                    <button
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() =>
                        questions.setValue((items) =>
                          items.filter((_, index) => index !== i),
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              {!questions.value.length && (
                <p className="visit-help">
                  Your questions will stay on this device until you remove them.
                </p>
              )}
              {questions.storageError && (
                <p role="alert" className="warning">
                  Questions could not be saved. Download your summary before
                  closing.
                </p>
              )}
            </div>
            <div className="visit-preview">
              <span className="today-overline">INCLUDED IN YOUR SUMMARY</span>
              <h3>{profile.area} recovery</h3>
              <p>{profile.goal}</p>
              <ul>
                <li>
                  <Check size={14} />
                  Your recorded symptoms
                </li>
                <li>
                  <Check size={14} />
                  {recentEntries.length} discomfort & energy check-ins
                </li>
                <li>
                  <Check size={14} />
                  {recentSessions.length} movement sessions
                </li>
                <li>
                  <Check size={14} />
                  {questions.value.length} questions for your clinician
                </li>
                <li>
                  <Check size={14} />
                  Current routine notes
                </li>
              </ul>
            </div>
          </div>
          <div className="visit-share-actions">
            <span>
              <ShieldCheck size={15} />
              Nothing is sent automatically.
            </span>
            <button
              className="outline"
              onClick={() => {
                downloadFile(
                  visitReportHtml(report()),
                  "rebound-visit-summary.html",
                  "text/html",
                );
                setMessage(
                  "Summary downloaded. It contains personal health information; share it only with someone you choose.",
                );
              }}
            >
              <Download size={15} />
              Download summary
            </button>
            <button className="dark" onClick={print}>
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
          {message && (
            <p className="visit-message" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
