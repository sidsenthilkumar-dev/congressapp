import { useMemo, useState } from "react";
import {
  Bookmark,
  Search,
  Camera,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { exercises } from "../../domain/exercises";
import { ExerciseCard } from "../../components/ExerciseCard";
import "./exercise-library.css";
type Props = {
  bookmarks: string[];
  onBookmark: (id: string) => void;
  onOpen: (id: string) => void;
  onRoutines: () => void;
};
export function ExerciseLibraryPage({
  bookmarks,
  onBookmark,
  onOpen,
  onRoutines,
}: Props) {
  const [area, setArea] = useState("All");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("All");
  const areas = useMemo(
    () => ["All", ...new Set(exercises.map((e) => e.area))],
    [],
  );
  const filtered = exercises.filter(
    (e) =>
      (area === "All" || e.area === area) &&
      (!query ||
        (e.name + " " + e.area + " " + e.equipment)
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (mode === "All" ||
        (mode === "Camera coach" && e.camera) ||
        (mode === "Saved" && bookmarks.includes(e.id))),
  );
  const verified = exercises.filter((e) => e.source.verified).length;
  return (
    <section className="exercise-library-page">
      <div className="exercise-library-banner">
        <div>
          <span className="eyebrow">
            MOVEMENT, WITH A LITTLE MORE INTENTION
          </span>
          <h2>
            Find a movement.
            <br />
            Make it part of your day.
          </h2>
          <p>
            Detailed steps, useful cues, and a comfortable pace. Save the
            movements your clinician has cleared for you.
          </p>
          <div className="exercise-library-proof">
            <span>{exercises.length} movement guides</span>
            <i />
            <span>{verified} linked to NHS guidance</span>
            <i />
            <span>3 camera-supported movements</span>
          </div>
        </div>
        <button className="outline" onClick={onRoutines}>
          Build my routine <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="exercise-toolbar">
        <div className="library-tabs">
          {["All", "Camera coach", "Saved"].map((m) => (
            <button
              className={mode === m ? "selected" : ""}
              onClick={() => setMode(m)}
              key={m}
            >
              {m === "Camera coach" ? (
                <Camera size={14} />
              ) : m === "Saved" ? (
                <Bookmark size={14} />
              ) : (
                <SlidersHorizontal size={14} />
              )}{" "}
              {m === "All" ? "All movements" : m}
              {m === "Saved" && (
                <span className="saved-count">{bookmarks.length}</span>
              )}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={15} />
          <input
            aria-label="Search exercises"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a movement or body area"
          />
        </label>
      </div>
      <div className="filter-row">
        {areas.map((r) => (
          <button
            className={area === r ? "selected" : ""}
            key={r}
            onClick={() => setArea(r)}
          >
            {r === "All" ? "All body areas" : r}
          </button>
        ))}
      </div>
      <div className="exercise-result-count">
        <span>{filtered.length} movements to explore</span>
        <span>
          <ShieldCheck size={12} />
          Your clinician sets the range and dose
        </span>
      </div>
      <div className="library-grid">
        {filtered.map((e) => (
          <div className="exercise-tile" key={e.id}>
            <ExerciseCard exercise={e} onClick={() => onOpen(e.id)} />
            <button
              className={
                "bookmark-button " + (bookmarks.includes(e.id) ? "saved" : "")
              }
              aria-label={
                (bookmarks.includes(e.id) ? "Unsave " : "Save ") + e.name
              }
              aria-pressed={bookmarks.includes(e.id)}
              onClick={() => onBookmark(e.id)}
            >
              <Bookmark
                size={15}
                fill={bookmarks.includes(e.id) ? "currentColor" : "none"}
              />
            </button>
            <div className="exercise-tile-detail">
              <span className={e.source.verified ? "source-verified" : ""}>
                {e.source.verified
                  ? "NHS reference"
                  : "Reference review pending"}
              </span>
              <span>{e.camera ? "AI + manual" : "Manual guide"}</span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty">
          <Search />
          <h3>No movements found.</h3>
          <p>Try another body area or save a movement to see it here.</p>
          <button
            className="outline"
            onClick={() => {
              setQuery("");
              setArea("All");
              setMode("All");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
