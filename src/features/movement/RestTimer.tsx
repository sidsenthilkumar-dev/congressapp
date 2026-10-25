import { useEffect, useRef, useState } from "react";
import { Clock, Pause, Play, RotateCcw } from "lucide-react";
export function RestTimer() {
  const [duration, setDuration] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  useEffect(() => {
    if (!running) return;
    deadline.current = Date.now() + remaining * 1000;
    const timer = setInterval(() => {
      const next = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(next);
      if (next === 0) setRunning(false);
    }, 200);
    return () => clearInterval(timer);
  }, [running]);
  return (
    <section className="rest-timer">
      <div>
        <span>
          <Clock size={15} />A moment to reset
        </span>
        <small>
          {remaining === 0
            ? "Rest timer finished. Resume only when comfortable."
            : "An optional timer, not a prescribed rest interval."}
        </small>
      </div>
      <select
        aria-label="Rest duration"
        disabled={running}
        value={duration}
        onChange={(e) => {
          setDuration(+e.target.value);
          setRemaining(+e.target.value);
        }}
      >
        {[15, 30, 60, 90].map((s) => (
          <option key={s} value={s}>
            {s}s
          </option>
        ))}
      </select>
      <strong aria-label="Rest time remaining">
        {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
      </strong>
      <button
        aria-label={running ? "Pause rest timer" : "Start rest timer"}
        onClick={() => {
          if (!running && remaining === 0) setRemaining(duration);
          setRunning(!running);
        }}
      >
        {running ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <button
        aria-label="Reset rest timer"
        onClick={() => {
          setRunning(false);
          setRemaining(duration);
        }}
      >
        <RotateCcw size={14} />
      </button>
    </section>
  );
}
