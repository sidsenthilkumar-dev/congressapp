import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  Camera,
  Sun,
  ShieldCheck,
  Info,
  Play,
  Pause,
  Plus,
  CheckCircle2,
} from "lucide-react";
import type { Pose, Results } from "@mediapipe/pose";
import type { Exercise } from "../../domain/exercises";
import { ExerciseDemo } from "../../components/ExerciseDemo";
import { RestTimer } from "./RestTimer";
import { CorrectionPanel, CorrectionPreview } from "./MotionGuide";
import {
  MotionTracker,
  type Correction,
  type TrackingResult,
  type TrackingSide,
  type TrackedMovement,
} from "../../domain/tracking";
declare global {
  interface Window {
    Pose: typeof Pose;
  }
}
export function MovementSession({
  exercise,
  safetyBlocked,
  safetyMessage,
  onSave,
}: {
  exercise: Exercise;
  safetyBlocked: boolean;
  safetyMessage: string;
  onSave: (
    reps: number,
    details: {
      durationSeconds: number;
      target?: number;
    },
  ) => void;
}) {
  const [cleared, setCleared] = useState(false);
  const [mode, setMode] = useState<"guide" | "camera">("guide");
  const [running, setRunning] = useState(false);
  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("Position your full body in view.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState("");
  const [staticGuide, setStaticGuide] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const landmarker = useRef<Pose | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const tracker = useRef(new MotionTracker());
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [trackingSide, setTrackingSide] = useState<TrackingSide>("Automatic");
  const sideRef = useRef<TrackingSide>("Automatic");
  sideRef.current = trackingSide;
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [correction, setCorrection] = useState<Correction | null>(null);
  const correctionSince = useRef<{
    issue: Correction | null;
    time: number;
  }>({
    issue: null,
    time: 0,
  });
  const [dismissed, setDismissed] = useState<Correction | null>(null);
  const [lighting, setLighting] = useState<"Checking" | "Good" | "Too dim">(
    "Checking",
  );
  const sample = useRef<HTMLCanvasElement | null>(null);
  const sampledAt = useRef(0);
  const dimRef = useRef(false);
  const [setupOpen, setSetupOpen] = useState(true);
  const active = useRef(false);
  const previousTime = useRef(-1);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current = false;
      cancelAnimationFrame(raf.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      landmarker.current?.close();
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);
  async function startCamera() {
    if (safetyBlocked || !cleared) return;
    tracker.current.reset();
    setTracking(null);
    setCorrection(null);
    setDismissed(null);
    setLighting("Checking");
    setError("");
    setLoading(true);
    setMode("camera");
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error(
          "Camera access requires a secure connection (HTTPS or localhost).",
        );
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: { ideal: facing } },
        audio: false,
      });
      if (!mounted.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        return;
      }
      if (video.current) {
        video.current.srcObject = stream.current;
        await video.current.play();
      }
      if (!window.Pose) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "/pose/pose.js";
          script.onload = () => resolve();
          script.onerror = () =>
            reject(Error("Could not load the local pose runtime."));
          document.head.appendChild(script);
        });
      }
      if (!mounted.current) return;
      landmarker.current = new window.Pose({
        locateFile: (file: string) => "/pose/" + file,
      });
      landmarker.current.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      landmarker.current.onResults(handleResults);
      await landmarker.current.initialize();
      if (!mounted.current) {
        landmarker.current?.close();
        return;
      }
      active.current = true;
      setRunning(true);
      setStatus("Step back so your joints are visible.");
      detect();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Camera could not start. Check permission and try again.",
      );
      stream.current?.getTracks().forEach((t) => t.stop());
      setRunning(false);
    } finally {
      setLoading(false);
    }
  }
  function handleResults(result: Results) {
    const v = video.current;
    if (!active.current || !v) return;
    const ctx = canvas.current?.getContext("2d");
    if (ctx && canvas.current) {
      canvas.current.width = v.videoWidth;
      canvas.current.height = v.videoHeight;
      ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
    }
    const now = performance.now();
    if (now - sampledAt.current > 1200) {
      sample.current ??= document.createElement("canvas");
      sample.current.width = 32;
      sample.current.height = 24;
      const sampleCtx = sample.current.getContext("2d", {
        willReadFrequently: true,
      });
      if (sampleCtx) {
        sampleCtx.drawImage(v, 0, 0, 32, 24);
        const pixels = sampleCtx.getImageData(0, 0, 32, 24).data;
        let luminance = 0;
        for (let i = 0; i < pixels.length; i += 4)
          luminance +=
            0.2126 * pixels[i] +
            0.7152 * pixels[i + 1] +
            0.0722 * pixels[i + 2];
        dimRef.current = luminance / (pixels.length / 4) < 45;
        setLighting(dimRef.current ? "Too dim" : "Good");
      }
      sampledAt.current = now;
    }
    const p = result.poseLandmarks;
    const resultState = tracker.current.update(
      p,
      exercise.type as TrackedMovement,
      sideRef.current,
      performance.now(),
      v.videoWidth / Math.max(v.videoHeight, 1),
    );
    if (dimRef.current) {
      tracker.current.reset();
      resultState.ready = false;
      resultState.rep = false;
      resultState.progress = 0;
      resultState.correction = "visibility";
      resultState.cue = "Add more light before continuing. Counting is paused.";
    }
    setTracking(resultState);
    setStatus(resultState.cue);
    if (resultState.rep) setReps((n) => n + 1);
    if (resultState.correction !== correctionSince.current.issue) {
      correctionSince.current = { issue: resultState.correction, time: now };
      setDismissed(null);
    }
    if (resultState.correction && now - correctionSince.current.time > 850)
      setCorrection(resultState.correction);
    else setCorrection(null);
    if (p && ctx && canvas.current) {
      const w = canvas.current.width,
        h = canvas.current.height;
      const ids = resultState.joints;
      ctx.strokeStyle = resultState.ready ? "#d5f384" : "#f3d294";
      ctx.lineWidth = 4;
      const main =
        exercise.type === "curl"
          ? resultState.side === "Left"
            ? [11, 13, 15]
            : [12, 14, 16]
          : exercise.type === "knee"
            ? resultState.side === "Left"
              ? [23, 25, 27]
              : [24, 26, 28]
            : resultState.side === "Left"
              ? [23, 11, 13, 15]
              : [24, 12, 14, 16];
      ctx.beginPath();
      main.forEach((id, j) =>
        j
          ? ctx.lineTo(p[id].x * w, p[id].y * h)
          : ctx.moveTo(p[id].x * w, p[id].y * h),
      );
      ctx.stroke();
      ids.forEach((id) => {
        ctx.beginPath();
        ctx.arc(p[id].x * w, p[id].y * h, 6, 0, Math.PI * 2);
        ctx.fillStyle = resultState.ready ? "#d5f384" : "#f3d294";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }
  async function detect() {
    if (!active.current || !video.current || !landmarker.current) return;
    try {
      if (
        video.current.readyState >= 2 &&
        video.current.currentTime !== previousTime.current
      ) {
        previousTime.current = video.current.currentTime;
        await landmarker.current.send({ image: video.current });
      }
    } catch (e) {
      setError(
        "Pose tracking stopped. Try restarting the camera with better lighting.",
      );
      active.current = false;
      stream.current?.getTracks().forEach((t) => t.stop());
      setRunning(false);
    }
    if (active.current) raf.current = requestAnimationFrame(detect);
  }
  function stop() {
    active.current = false;
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    landmarker.current?.close();
    landmarker.current = null;
    setRunning(false);
    setMode("guide");
  }
  return (
    <>
      <span className="eyebrow">YOUR GUIDED MOVEMENT</span>
      <h2>{exercise.name}</h2>
      <p>{exercise.instructions}</p>
      {safetyBlocked && (
        <div className="warning clinical-block" role="alert">
          <ShieldCheck size={20} />
          <div>
            <strong>View the demo; pause the exercise.</strong>
            <p>
              {safetyMessage} A general clearance checkbox cannot override this
              safety hold.
            </p>
          </div>
        </div>
      )}
      <section className="exercise-instructions">
        <div>
          <h3>Before you begin</h3>
          <span>
            {exercise.camera ? "Camera + manual guidance" : "Manual guidance"}
          </span>
        </div>
        <ol>
          {exercise.steps.map((step, i) => (
            <li key={step}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              {step}
            </li>
          ))}
        </ol>
        <p>
          <strong>You’ll need:</strong> {exercise.equipment}
        </p>
        <p className="exercise-stop-note">{exercise.stopIf}</p>
        <a href={exercise.source.url} target="_blank" rel="noreferrer">
          {exercise.source.title} <ArrowRight size={12} />
        </a>
        <small>
          {exercise.source.verified
            ? "Source read " +
              exercise.source.verified +
              " · General adult guidance, not an injury protocol."
            : exercise.source.scope}
        </small>
      </section>
      {exercise.camera && (
        <section className="camera-setup">
          <button
            className="setup-heading"
            aria-expanded={setupOpen}
            onClick={() => setSetupOpen(!setupOpen)}
          >
            <span>
              <Camera size={17} />
              Set up for a clearer view
            </span>
            <span>{setupOpen ? "−" : "+"}</span>
          </button>
          {setupOpen && (
            <>
              <div className="setup-steps">
                <div>
                  <b>01</b>
                  <strong>
                    {exercise.type === "shoulder"
                      ? "Face the camera"
                      : "Turn side-on"}
                  </strong>
                  <p>
                    {exercise.type === "shoulder"
                      ? "Keep both shoulders, hips, elbows, and wrists in view."
                      : "Place the camera at working-joint height. Show the whole working limb."}
                  </p>
                </div>
                <div>
                  <b>02</b>
                  <strong>Give yourself room</strong>
                  <p>
                    Start about 2–3 m away; adjust to your lens. Use even light
                    and a stable camera.
                  </p>
                </div>
                <div>
                  <b>03</b>
                  <strong>Let the coach settle</strong>
                  <p>
                    Hold still for a moment. Counting waits for clear joints and
                    a suitable camera angle.
                  </p>
                </div>
              </div>
              <div className="camera-controls">
                <label>
                  Working side
                  <select
                    aria-label="Working side"
                    value={trackingSide}
                    disabled={running}
                    onChange={(e) => {
                      setTrackingSide(e.target.value as TrackingSide);
                      tracker.current.reset();
                    }}
                  >
                    {["Automatic", "Left", "Right"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Camera
                  <select
                    aria-label="Camera lens"
                    value={facing}
                    disabled={running || loading}
                    onChange={(e) =>
                      setFacing(e.target.value as "user" | "environment")
                    }
                  >
                    <option value="user">Front camera</option>
                    <option value="environment">Rear camera</option>
                  </select>
                </label>
                <span>
                  <ShieldCheck size={14} />
                  Video stays on this device
                </span>
              </div>
            </>
          )}
        </section>
      )}
      <div
        className={
          "coach-view enhanced-view " +
          (facing === "environment" ? "rear-camera" : "")
        }
      >
        {mode === "camera" ? (
          <>
            <video ref={video} playsInline muted />
            <div className="camera-frame" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <span
              className={"tracking-badge " + (tracking?.ready ? "ready" : "")}
            >
              <span />
              {loading
                ? "Preparing camera"
                : tracking?.ready
                  ? "Tracking · " + tracking.side + " side"
                  : "Finding your position"}
            </span>
            <canvas ref={canvas} />
            {loading && (
              <div className="camera-loading">
                Preparing your camera & pose model…
              </div>
            )}
          </>
        ) : (
          <>
            <ExerciseDemo exercise={exercise} paused={staticGuide} />
            <span className="guide-label">
              Movement illustration · Use your clinician’s range and dose
            </span>
          </>
        )}
      </div>
      {mode === "guide" && (
        <button
          className="demo-toggle"
          aria-pressed={staticGuide}
          onClick={() => setStaticGuide(!staticGuide)}
        >
          {staticGuide
            ? "Animate movement guide"
            : "Show static movement guide"}
        </button>
      )}
      {mode === "camera" && running && (
        <div className="camera-readiness">
          <span className={tracking?.visible ? "pass" : ""}>
            <CheckCircle2 size={13} />
            Joints {tracking?.visible ? "visible" : "not clear"}
          </span>
          <span className={tracking?.viewGood ? "pass" : ""}>
            <Camera size={13} />
            Angle {tracking?.viewGood ? "ready" : "needs adjustment"}
          </span>
          <span className={lighting === "Good" ? "pass" : ""}>
            <Sun size={13} />
            Light: {lighting}
          </span>
          <span className={tracking?.ready ? "pass" : ""}>
            {tracking?.angle !== null && tracking?.angle !== undefined
              ? Math.round(tracking.angle) + "°"
              : "—"}{" "}
            · {Math.round((tracking?.confidence || 0) * 100)}% visibility
          </span>
          <div className="calibration-track">
            <i style={{ width: `${(tracking?.progress || 0) * 100}%` }} />
          </div>
        </div>
      )}
      {correction &&
        dismissed !== correction &&
        mode === "camera" &&
        running && (
          <CorrectionPanel
            kind={exercise.type}
            correction={correction}
            onClose={() => setDismissed(correction)}
          />
        )}
      {mode === "guide" && exercise.camera && (
        <CorrectionPreview kind={exercise.type} />
      )}
      {error && (
        <div className="warning" role="alert">
          {error} You can still follow the guide and count reps manually.
        </div>
      )}
      <div className="session-metrics">
        <div>
          <strong>{reps.toString().padStart(2, "0")}</strong>
          <span>REPS COMPLETED</span>
        </div>
        <div>
          <strong>
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </strong>
          <span>SESSION TIME</span>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>PRIVATE BY DESIGN</span>
        </div>
      </div>
      {mode === "camera" && running && (
        <div className="live-cue">
          <span className="tiny-dot" />
          {status}
        </div>
      )}
      <div className="session-target">
        <label htmlFor="rep-target">
          My clinician’s rep target <small>(optional)</small>
        </label>
        <input
          id="rep-target"
          type="number"
          min="1"
          max="200"
          inputMode="numeric"
          placeholder="—"
          value={target}
          disabled={running}
          onChange={(e) =>
            setTarget(
              e.target.value === ""
                ? ""
                : String(
                    Math.max(1, Math.min(200, Number(e.target.value) || 1)),
                  ),
            )
          }
        />
        <span>Set a reminder, not a prescription.</span>
      </div>
      {target && Number(target) > 0 && reps >= Number(target) && (
        <div className="target-reached" role="status">
          <CheckCircle2 size={16} />
          Your chosen target is reached. Pause and check how you feel.
        </div>
      )}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={cleared}
          disabled={loading}
          onChange={(e) => {
            if (!e.target.checked) stop();
            setCleared(e.target.checked);
          }}
        />
        I have medical clearance for this movement and will stop if it hurts.
      </label>
      <div className="session-actions">
        {!running ? (
          <>
            <button
              className="dark"
              disabled={!cleared || loading || safetyBlocked}
              onClick={() => {
                setMode("guide");
                setRunning(true);
              }}
            >
              <Play size={16} />
              Start guided session
            </button>
            {exercise.camera && (
              <button
                className="outline"
                disabled={!cleared || loading || safetyBlocked}
                onClick={startCamera}
              >
                <Camera size={16} />
                Enable AI camera
              </button>
            )}
          </>
        ) : (
          <>
            <button
              className="outline"
              onClick={() => {
                if (mode === "camera") stop();
                else setRunning(false);
              }}
            >
              <Pause size={16} />
              Pause session
            </button>
            {mode === "camera" && (
              <button
                className="outline"
                onClick={() => {
                  stop();
                  setRunning(true);
                }}
              >
                Switch to manual <ArrowRight size={15} />
              </button>
            )}
            {mode === "guide" && (
              <button className="outline" onClick={() => setReps((n) => n + 1)}>
                <Plus size={16} />
                Count a rep
              </button>
            )}
          </>
        )}
        <button
          className="dark"
          disabled={reps === 0}
          onClick={() => {
            stop();
            onSave(reps, {
              durationSeconds: elapsed,
              target: target && Number(target) > 0 ? Number(target) : undefined,
            });
          }}
        >
          Finish & save <Check size={16} />
        </button>
      </div>
      {mode === "guide" && reps > 0 && (
        <button
          className="undo-rep"
          onClick={() => setReps((n) => Math.max(0, n - 1))}
        >
          Undo last manual rep
        </button>
      )}
      <RestTimer />
      <div className="range-reminder">
        <Info size={14} />
        <span>
          Never stretch farther to trigger a count. Use manual counting if your
          clinician prescribes a smaller range.
        </span>
      </div>
      <p className="coach-disclaimer">
        Camera coaching estimates joint angles; it cannot certify safe form or
        replace a physical therapist. Stop for pain, dizziness, or new symptoms.
        Model accuracy varies with lighting and camera position.
      </p>
    </>
  );
}
