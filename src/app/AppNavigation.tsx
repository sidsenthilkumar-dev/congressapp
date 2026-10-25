import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  House,
  Heart,
  ShieldCheck,
  BookOpen,
  Camera,
  Sparkles,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Bell,
  MoreHorizontal,
  Settings,
  X,
} from "lucide-react";
import "./navigation.css";
const items = [
  { name: "Overview", short: "Today", icon: House, primary: true },
  { name: "My recovery", short: "Recovery", icon: Heart },
  { name: "Injury library", short: "Injuries", icon: ShieldCheck },
  { name: "Exercise library", short: "Exercises", icon: BookOpen },
  { name: "AI movement coach", short: "Coach", icon: Camera, primary: true },
  { name: "Ask Rebound", short: "Ask", icon: Sparkles, primary: true },
  { name: "Clinic", short: "Clinic", icon: Building2, primary: true },
  { name: "My routines", short: "Routines", icon: CalendarDays },
  { name: "My progress", short: "Progress", icon: ChartNoAxesCombined },
  { name: "Reminders", short: "Reminders", icon: Bell },
];
export function AppNavigation({
  page,
  onNavigate,
  onSettings,
}: {
  page: string;
  onNavigate: (page: string) => void;
  onSettings: () => void;
}) {
  const [more, setMore] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const primary = items.some((item) => item.name === page && item.primary);
  useEffect(() => {
    setMore(false);
  }, [page]);
  useEffect(() => {
    if (!more) return;
    const buttons = () =>
      Array.from(
        sheet.current?.querySelectorAll<HTMLButtonElement>("button") || [],
      );
    buttons()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMore(false);
      if (event.key !== "Tab") return;
      const list = buttons(),
        first = list[0],
        last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const media = matchMedia("(min-width:721px)");
    const resize = () => {
      if (media.matches) setMore(false);
    };
    document.addEventListener("keydown", key);
    media.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", key);
      media.removeEventListener("change", resize);
      toggle.current?.focus();
    };
  }, [more]);
  const navigate = (next: string) => {
    setMore(false);
    onNavigate(next);
  };
  return (
    <>
      <nav aria-label="Main navigation">
        {items.map(({ name, short, icon: Icon, primary }) => (
          <button
            key={name}
            className={`nav-item ${page === name ? "active" : ""} ${primary ? "mobile-primary" : "mobile-secondary"}`}
            aria-label={name}
            aria-current={page === name ? "page" : undefined}
            onClick={() => navigate(name)}
          >
            <Icon size={19} />
            <span className="nav-label" data-short-label={short}>
              {name}
            </span>
            {name === "AI movement coach" && <span className="ai-tag">AI</span>}
          </button>
        ))}
        <button
          ref={toggle}
          className={`nav-item mobile-more-toggle ${!primary ? "active" : ""}`}
          aria-label="More navigation"
          aria-expanded={more}
          aria-controls="mobile-more-menu"
          onClick={() => setMore(!more)}
        >
          <MoreHorizontal size={21} />
          <span className="nav-label" data-short-label="More">
            More
          </span>
        </button>
      </nav>
      {more &&
        createPortal(
          <div className="mobile-menu-layer" onClick={() => setMore(false)}>
            <div
              ref={sheet}
              id="mobile-more-menu"
              className="mobile-menu-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="More pages"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-menu-heading">
                <div>
                  <span>YOUR RECOVERY SPACE</span>
                  <h2>Make it yours.</h2>
                </div>
                <button
                  aria-label="Close more pages"
                  onClick={() => setMore(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mobile-menu-links">
                {items
                  .filter((item) => !item.primary)
                  .map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      aria-current={page === name ? "page" : undefined}
                      onClick={() => navigate(name)}
                    >
                      <Icon size={20} />
                      {name}
                    </button>
                  ))}
                <button
                  onClick={() => {
                    setMore(false);
                    onSettings();
                  }}
                >
                  <Settings size={20} />
                  Settings & preferences
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
