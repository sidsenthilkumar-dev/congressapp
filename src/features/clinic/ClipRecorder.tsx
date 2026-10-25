import { useEffect, useRef, useState } from "react";
import { Camera, Circle, Trash2 } from "lucide-react";
import { exercises } from "../../domain/exercises";
import { requestNativeRecording } from "../../services/nativeBridge";

export function ClipRecorder({
  onReady,
  onDiscard,
  disabled = false,
}: {
  onReady: (blob: Blob, exerciseId: string) => void;
  onDiscard?: () => void;
  disabled?: boolean;
}) {
  const [exerciseId, setExerciseId] = useState(exercises[0].id);
  const [state, setState] = useState<
    "idle" | "starting" | "recording" | "review"
  >("idle");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const blob = useRef<Blob | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const request = useRef(0);
  const objectUrl = useRef("");
  function release() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }
  function discard() {
    release();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
    blob.current = null;
    setPreview("");
    setState("idle");
    setSeconds(0);
    onDiscard?.();
  }
  useEffect(() => {
    mounted.current = true;
    const background = () => {
      request.current++;
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
      setState((current) => (current === "starting" ? "idle" : current));
    };
    const visibility = () => {
      if (document.hidden) background();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("rebound:native-background", background);
    return () => {
      mounted.current = false;
      request.current++;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("rebound:native-background", background);
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);
  async function record() {
    if (disabled) return;
    const current = ++request.current;
    setError("");
    if (requestNativeRecording(exerciseId)) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Recording is not available here. Use the iPhone recorder or choose a short MP4 / WebM clip below.",
      );
      return;
    }
    setState("starting");
    try {
      const capture = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      if (!mounted.current || current !== request.current) {
        capture.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = capture;
      if (video.current) {
        video.current.srcObject = capture;
        await video.current.play();
      }
      const mimeType = [
        "video/webm;codecs=vp8",
        "video/mp4",
        "video/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType)
        throw Error(
          "This browser does not support a compatible recording format.",
        );
      const parts: BlobPart[] = [];
      let size = 0;
      const recording = new MediaRecorder(capture, {
        mimeType,
        videoBitsPerSecond: 1000000,
      });
      recorder.current = recording;
      recording.ondataavailable = (e) => {
        if (e.data.size) {
          parts.push(e.data);
          size += e.data.size;
          if (size > 19 * 1024 * 1024 && recording.state === "recording")
            recording.stop();
        }
      };
      recording.onerror = () => {
        release();
        if (mounted.current) {
          setError(
            "Recording stopped unexpectedly. Discard this clip and try again.",
          );
          setState("idle");
        }
      };
      recording.onstop = () => {
        release();
        if (!mounted.current) return;
        blob.current = new Blob(parts, { type: mimeType });
        objectUrl.current = URL.createObjectURL(blob.current);
        setPreview(objectUrl.current);
        setState("review");
      };
      recording.start(500);
      setSeconds(0);
      setState("recording");
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed++;
        if (mounted.current) setSeconds(elapsed);
        if (elapsed >= 20 && recording.state === "recording") recording.stop();
      }, 1000);
    } catch (e) {
      release();
      setState("idle");
      setError(e instanceof Error ? e.message : "Camera could not start.");
    }
  }
  return (
    <section className="clip-recorder">
      <div className="section-title">
        <Camera size={19} />
        <h3>A short clip, on your terms.</h3>
      </div>
      <p>
        Nothing records during normal coaching. Start a separate, silent clip
        here, review it, then choose whether to share. Maximum 20 seconds.
      </p>
      <label htmlFor="clip-exercise">Exercise shown in the clip</label>
      <select
        id="clip-exercise"
        disabled={disabled || state !== "idle"}
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
      >
        {exercises.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <video
        ref={video}
        src={preview || undefined}
        muted={state !== "review"}
        controls={state === "review"}
        playsInline
        aria-label="Clip preview"
        hidden={state === "idle"}
      />
      {(state === "idle" || state === "starting") && (
        <button
          className="outline"
          disabled={disabled || state === "starting"}
          onClick={record}
        >
          <Camera size={16} />
          {state === "starting" ? "Opening camera…" : "Record a private clip"}
        </button>
      )}
      {state === "recording" && (
        <button
          className="recording-button"
          onClick={() => recorder.current?.stop()}
        >
          <Circle size={13} fill="currentColor" />
          Stop recording · {seconds} / 20 sec
        </button>
      )}
      {state === "review" && (
        <div className="clip-review-actions">
          <button
            className="dark"
            disabled={disabled}
            onClick={() => {
              if (blob.current) onReady(blob.current, exerciseId);
            }}
          >
            Use this reviewed clip
          </button>
          <button className="outline" disabled={disabled} onClick={discard}>
            <Trash2 size={15} />
            Discard clip
          </button>
          <a
            className="outline"
            href={preview}
            download={`rebound-${exerciseId}.${blob.current?.type.startsWith("video/mp4") ? "mp4" : "webm"}`}
          >
            Save on this device
          </a>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <label className="clip-file">
        Or choose an existing short clip
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mov"
          disabled={disabled || state === "recording" || state === "starting"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.size || file.size > 20 * 1024 * 1024) {
              setError("Choose a nonempty clip smaller than 20 MB.");
              return;
            }
            onReady(file, exerciseId);
            e.target.value = "";
          }}
        />
      </label>
    </section>
  );
}
