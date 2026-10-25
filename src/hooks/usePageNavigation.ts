import { useState, useEffect, useCallback } from "react";
const routes: Record<string, string> = {
  Overview: "today",
  "My recovery": "recovery",
  "Injury library": "injuries",
  "Exercise library": "exercises",
  "AI movement coach": "coach",
  "My routines": "routines",
  "My progress": "progress",
  Reminders: "reminders",
  "Ask Rebound": "ask",
  Clinic: "clinic",
};
function currentPage() {
  const slug = location.hash.replace(/^#\/?/, "");
  return (
    Object.entries(routes).find(([, value]) => value === slug)?.[0] ||
    "Overview"
  );
}
export function usePageNavigation() {
  const [page, setPage] = useState(currentPage);
  useEffect(() => {
    const update = () => setPage(currentPage());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  const navigate = useCallback((next: string) => {
    if (!routes[next]) return;
    const hash = "#" + routes[next];
    if (location.hash !== hash) history.pushState(null, "", hash);
    setPage(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  return [page, navigate] as const;
}
