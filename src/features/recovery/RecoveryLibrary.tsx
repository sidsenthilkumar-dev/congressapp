import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Search,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  conditions,
  regions,
  sourceLinks,
  type RecoveryProfile,
  assessProfile,
} from "../../domain/recovery";
export function RecoveryLibrary({
  onSelect,
  profile,
}: {
  onSelect: (area: string, condition: string) => void;
  profile: RecoveryProfile;
}) {
  const [region, setRegion] = useState("All");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"conditions" | "references">("conditions");
  const visible = conditions.filter(
    (c) =>
      (region === "All" || region === c.area) &&
      (c.name + " " + c.area).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="injury-library">
      <div className="library-banner">
        <div>
          <span className="eyebrow">UNDERSTAND BEFORE YOU EXERCISE</span>
          <h2>A clearer path to your comeback.</h2>
          <p>
            Explore {conditions.length} common injury and recovery topics across{" "}
            {regions.length} body regions. Find the right next step, with room
            for your clinician’s plan.
          </p>
          <div className="library-proof">
            <span>
              <BookOpen size={14} />
              {conditions.length} recovery topics
            </span>
            <span>
              <ShieldCheck size={14} />
              Conservative safety checks
            </span>
          </div>
        </div>
        <div className="body-map">
          <svg viewBox="0 0 160 230" aria-label="Body region illustration">
            <circle cx="80" cy="23" r="15" fill="#879a78" />
            <path
              d="M80 49v74M67 125l-10 77M92 125l11 77M60 59l-22 60-9 35M100 59l22 60 9 35"
              fill="none"
              stroke="#a6b795"
              strokeWidth="19"
              strokeLinecap="round"
            />
            {[
              [80, 23],
              [80, 50],
              [62, 62],
              [99, 62],
              [38, 119],
              [123, 119],
              [30, 154],
              [131, 154],
              [68, 124],
              [94, 124],
              [61, 165],
              [99, 165],
              [56, 202],
              [104, 202],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="5"
                fill="#e9f2d3"
                stroke="#7c9564"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <span>Every body. Every comeback.</span>
        </div>
      </div>
      <div className="library-controls">
        <div className="library-tabs">
          <button
            className={tab === "conditions" ? "selected" : ""}
            onClick={() => setTab("conditions")}
          >
            Injury & recovery library
          </button>
          <button
            className={tab === "references" ? "selected" : ""}
            onClick={() => setTab("references")}
          >
            Sources & scope <ArrowUpRight size={13} />
          </button>
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search injuries"
            placeholder="Search injuries or body areas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {tab === "conditions" ? (
        <>
          <div className="filter-row compact-filters">
            {["All", ...regions].map((r) => (
              <button
                className={region === r ? "selected" : ""}
                key={r}
                onClick={() => setRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="catalog-summary">
            <span>
              {visible.length} topics {query && <>matching “{query}”</>}
            </span>
            <span>Not a diagnostic tool · No claim of complete coverage</span>
          </div>
          <div className="condition-grid">
            {visible.map((c) => (
              <button
                key={c.area + c.name}
                className={
                  "condition-card " +
                  (profile.area === c.area && profile.condition === c.name
                    ? "chosen"
                    : "")
                }
                onClick={() => onSelect(c.area, c.name)}
              >
                <div>
                  <span className="condition-area">{c.area}</span>
                  <span className={"care-tag " + c.care}>
                    {c.care === "general"
                      ? "Movement examples"
                      : c.care === "assessment"
                        ? "Assessment first"
                        : "Individual protocol"}
                  </span>
                </div>
                <h3>{c.name}</h3>
                <p>{c.note}</p>
                <span className="condition-action">
                  {profile.area === c.area && profile.condition === c.name
                    ? "Selected in your profile"
                    : "Add to my recovery"}
                  <ChevronRight size={15} />
                </span>
              </button>
            ))}
          </div>
          {!visible.length && (
            <div className="empty">
              <Search />
              <p>
                No matching topic. Choose “Other injury or condition” to journal
                it without an automatic exercise plan.
              </p>
              <button
                className="outline"
                onClick={() => onSelect("Other", "Other injury or condition")}
              >
                Add another condition
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="references-panel">
          <div className="notice">
            <Info size={20} />
            <span>
              <strong>Reference links, with transparent limits.</strong>
              <br />
              The NHS pages below were read on October 24, 2026. Movement
              instructions link to the relevant general exercise guidance. AAOS
              access remains unavailable. Reading a source does not clinically
              validate this app or make an exercise suitable for a specific
              injury. The expanded injury catalog still needs professional
              review.
            </span>
          </div>
          <div className="reference-grid">
            {sourceLinks.map((s) => (
              <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
                <BookOpen size={20} />
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.topic}</p>
                  <small className="reference-status">
                    {s.verified
                      ? "Source read · " + s.verified
                      : "Page not verified"}
                  </small>
                </div>
                <ArrowUpRight size={17} />
              </a>
            ))}
          </div>
          <div className="scope-note">
            <h3>What this library can and cannot do</h3>
            <p>
              It organizes common musculoskeletal injuries and flags situations
              requiring assessment. It does not include every possible injury,
              establish a diagnosis, screen out every serious condition, or
              provide a symptom-based treatment prescription. Fractures,
              suspected ruptures, concussion, and post-surgical rehabilitation
              need individual professional guidance. General exercise demos
              remain available to view; blocked profiles cannot start a generic
              session.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
export function SafetyCard({
  profile,
  pain,
  onEdit,
}: {
  profile: RecoveryProfile;
  pain?: number;
  onEdit: () => void;
}) {
  const result = assessProfile(profile, pain);
  return (
    <div className={"safety-card " + result.level}>
      <span className="safety-icon">
        <ShieldCheck size={21} />
      </span>
      <div>
        <small>YOUR NEXT STEP</small>
        <h3>{result.title}</h3>
        <p>{result.message}</p>
      </div>
      <button onClick={onEdit}>
        Review symptoms <ChevronRight size={15} />
      </button>
    </div>
  );
}
