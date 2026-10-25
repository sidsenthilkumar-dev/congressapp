export type Correction =
  | "torso"
  | "elbow"
  | "visibility"
  | "position"
  | "tempo";
export type Landmark = {
  x: number;
  y: number;
  visibility?: number;
  z?: number;
};
export type TrackedMovement =
  | "knee"
  | "curl"
  | "shoulder"
  | "squat"
  | "sit-stand"
  | "hip-abduction"
  | "wall-press"
  | "flexion";
export type TrackingSide = "Automatic" | "Left" | "Right";
export type TrackingResult = {
  ready: boolean;
  visible: boolean;
  framed: boolean;
  viewGood: boolean;
  confidence: number;
  angle: number | null;
  side: string;
  rep: boolean;
  correction: Correction | null;
  cue: string;
  joints: number[];
  progress: number;
};
export function jointAngle(a: Landmark, b: Landmark, c: Landmark, aspect = 1) {
  if (
    ![a.x, a.y, b.x, b.y, c.x, c.y, aspect].every(Number.isFinite) ||
    aspect <= 0
  )
    return null;
  const u = [(a.x - b.x) * aspect, a.y - b.y],
    v = [(c.x - b.x) * aspect, c.y - b.y];
  const length = Math.hypot(...u) * Math.hypot(...v);
  if (length < 1e-7) return null;
  return (
    (Math.acos(
      Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / length)),
    ) *
      180) /
    Math.PI
  );
}
export class MotionTracker {
  private locked: number | null = null;
  private stableSince: number | null = null;
  private cycle: "idle" | "ready" | "out" = "idle";
  private started = 0;
  private smooth: number | null = null;
  private lastSide = "";
  private candidate: number | null = null;
  private lastRep = 0;
  private lastNow = 0;
  private phaseCandidate = "";
  private phaseSince = 0;
  private lastType: TrackedMovement | null = null;
  private tempoUntil = 0;
  reset() {
    this.locked = null;
    this.candidate = null;
    this.stableSince = null;
    this.cycle = "idle";
    this.smooth = null;
    this.started = 0;
    this.lastNow = 0;
    this.phaseCandidate = "";
    this.lastRep = 0;
    this.tempoUntil = 0;
  }
  update(
    p: Landmark[] | undefined,
    type: TrackedMovement,
    side: TrackingSide,
    now: number,
    aspect = 4 / 3,
    minimumRepMs = 1200,
  ): TrackingResult {
    const empty: TrackingResult = {
      ready: false,
      visible: false,
      framed: false,
      viewGood: false,
      confidence: 0,
      angle: null,
      side: "—",
      rep: false,
      correction: "visibility",
      cue: "No body detected. Step into view with good lighting.",
      joints: [],
      progress: 0,
    };
    if (
      !p ||
      p.length < 33 ||
      !Number.isFinite(now) ||
      !Number.isFinite(aspect) ||
      aspect <= 0 ||
      aspect > 5
    ) {
      this.reset();
      return empty;
    }
    if (this.lastType !== type) {
      this.reset();
      this.lastType = type;
    }
    const delta = this.lastNow ? now - this.lastNow : 100;
    if (delta < 0 || (this.lastNow && delta > 600)) {
      this.stableSince = null;
      this.cycle = "idle";
      this.smooth = null;
    }
    this.lastNow = now;
    const choices =
      type === "curl" || type === "wall-press"
        ? [
            [11, 13, 15],
            [12, 14, 16],
          ]
        : type === "knee" || type === "squat" || type === "sit-stand"
          ? [
              [23, 25, 27],
              [24, 26, 28],
            ]
          : type === "hip-abduction"
            ? [
                [11, 23, 25],
                [12, 24, 26],
              ]
            : [
                [23, 11, 13],
                [24, 12, 14],
              ];
    const scores = choices.map((ids) =>
      Math.min(...ids.map((i) => p[i].visibility ?? 0)),
    );
    let index =
      side === "Left"
        ? 0
        : side === "Right"
          ? 1
          : (this.locked ?? (scores[0] >= scores[1] ? 0 : 1));
    if (this.lastSide !== side) {
      this.reset();
      this.lastSide = side;
      index =
        side === "Left"
          ? 0
          : side === "Right"
            ? 1
            : scores[0] >= scores[1]
              ? 0
              : 1;
    }
    if (this.candidate !== index) {
      this.stableSince = null;
      this.cycle = "idle";
      this.smooth = null;
      this.candidate = index;
    }
    const ids = choices[index],
      left = index === 0;
    const supporting = [left ? 11 : 12, left ? 23 : 24];
    const required = Array.from(
      new Set([
        ...ids,
        ...supporting,
        ...(["shoulder", "flexion"].includes(type) ? [left ? 15 : 16] : []),
        ...(type === "wall-press" ? [left ? 27 : 28] : []),
        ...(type === "hip-abduction" ? [left ? 27 : 28] : []),
      ]),
    );
    const confidence = Math.min(...required.map((i) => p[i].visibility ?? 0));
    const validPoint = (i: number) =>
      [p[i].x, p[i].y, p[i].visibility].every(
        (v) => typeof v === "number" && Number.isFinite(v),
      ) &&
      (p[i].visibility ?? 0) <= 1 &&
      p[i].x >= 0 &&
      p[i].x <= 1 &&
      p[i].y >= 0 &&
      p[i].y <= 1;
    const visible =
      confidence >= 0.7 &&
      required.every(validPoint) &&
      [11, 12].every((i) => validPoint(i) && (p[i].visibility ?? 0) >= 0.55);
    const framed =
      visible &&
      required.every(
        (i) =>
          p[i].x > 0.035 && p[i].x < 0.965 && p[i].y > 0.035 && p[i].y < 0.965,
      );
    const shoulder = p[left ? 11 : 12],
      hip = p[left ? 23 : 24];
    const torsoHeight = Math.abs(hip.y - shoulder.y);
    const shoulderSpan = Math.abs(p[11].x - p[12].x) * aspect;
    const viewGood =
      torsoHeight > 0.08 &&
      (type === "shoulder" || type === "hip-abduction"
        ? shoulderSpan > torsoHeight * 0.5
        : shoulderSpan < torsoHeight * 0.8);
    const base = {
      ...empty,
      visible,
      framed,
      viewGood,
      confidence,
      side: left ? "Left" : "Right",
      joints: required,
    };
    if (!visible || !framed) {
      this.stableSince = null;
      this.cycle = "idle";
      this.smooth = null;
      return {
        ...base,
        correction: "visibility",
        cue: "Move back: keep the working joints fully visible.",
      };
    }
    if (!viewGood) {
      this.stableSince = null;
      this.cycle = "idle";
      return {
        ...base,
        correction: "position",
        cue:
          type === "shoulder" || type === "hip-abduction"
            ? "Face the camera so both shoulders are visible."
            : "Turn side-on so the working joint bends across the image.",
      };
    }
    const angle = jointAngle(p[ids[0]], p[ids[1]], p[ids[2]], aspect);
    if (angle === null) {
      this.stableSince = null;
      this.cycle = "idle";
      return base;
    }
    const limbLength = (a: number, b: number) =>
      Math.hypot((p[a].x - p[b].x) * aspect, p[a].y - p[b].y);
    if (
      limbLength(ids[0], ids[1]) < 0.035 ||
      limbLength(ids[1], ids[2]) < 0.035
    ) {
      this.stableSince = null;
      this.cycle = "idle";
      this.smooth = null;
      return {
        ...base,
        correction: "visibility",
        cue: "The working joint is too small or occluded. Reposition the camera; counting is paused.",
      };
    }
    // Time-based smoothing behaves consistently at different camera frame rates.
    const alpha = 1 - Math.exp(-Math.max(1, Math.min(delta, 250)) / 180);
    this.smooth =
      this.smooth === null
        ? angle
        : this.smooth + alpha * (angle - this.smooth);
    const torsoLean =
      (Math.abs(shoulder.x - hip.x) * aspect) / Math.max(torsoHeight, 0.01);
    const upperArmDrift =
      type === "curl"
        ? (Math.abs(p[ids[0]].x - p[ids[1]].x) * aspect) /
          Math.max(Math.abs(p[ids[0]].y - p[ids[1]].y), 0.01)
        : 0;
    const leanLimit =
      type === "wall-press"
        ? 2
        : type === "squat" || type === "sit-stand"
          ? 1.4
          : 0.5;
    const bodyAngle =
      type === "wall-press"
        ? jointAngle(shoulder, hip, p[left ? 27 : 28], aspect)
        : 180;
    const correction: Correction | null =
      torsoLean > leanLimit ||
      (type === "wall-press" && (bodyAngle === null || bodyAngle < 150))
        ? "torso"
        : upperArmDrift > 0.65
          ? "elbow"
          : null;
    if (correction) {
      this.stableSince = null;
      this.cycle = "idle";
      return {
        ...base,
        angle: this.smooth,
        correction,
        cue:
          correction === "torso"
            ? "Bring your torso upright. Avoid leaning to complete the movement."
            : "Keep your elbow closer to your side. Move from the elbow, not your shoulder.",
      };
    }
    if (this.stableSince === null) this.stableSince = now;
    const progress = Math.min(1, (now - this.stableSince) / 900),
      ready = progress === 1;
    if (!ready)
      return {
        ...base,
        angle: this.smooth,
        correction: null,
        progress,
        cue: "Hold this position while the camera settles.",
      };
    if (side === "Automatic" && this.locked === null) this.locked = index;
    const rest =
      type === "knee" || type === "sit-stand"
        ? this.smooth < 115
        : type === "curl" || type === "wall-press" || type === "squat"
          ? this.smooth > 140
          : type === "hip-abduction"
            ? this.smooth > 165
            : this.smooth < 25;
    const extended =
      type === "knee" || type === "sit-stand"
        ? this.smooth > 150
        : type === "curl"
          ? this.smooth < 70
          : type === "wall-press" || type === "squat"
            ? this.smooth < 115
            : type === "hip-abduction"
              ? this.smooth < 150
              : this.smooth > 60;
    const phase = rest ? "rest" : extended ? "extended" : "middle";
    if (this.phaseCandidate !== phase) {
      this.phaseCandidate = phase;
      this.phaseSince = now;
    }
    const settled = now - this.phaseSince >= 100;
    let rep = false;
    let feedback: Correction | null = null;
    if (this.cycle === "idle" && rest && settled) {
      this.cycle = "ready";
      this.started = now;
    } else if (this.cycle === "ready" && extended && settled) {
      this.cycle = "out";
    } else if (this.cycle === "out" && rest && settled) {
      const duration = now - this.started;
      if (
        duration >= minimumRepMs &&
        duration <= 30000 &&
        now - this.lastRep >= minimumRepMs
      ) {
        rep = true;
        this.lastRep = now;
      } else if (duration < minimumRepMs) feedback = "tempo";
      this.cycle = "ready";
      this.started = now;
    }
    if (this.cycle === "ready" && rest) this.started = now;
    if (now - this.started > 30000 && this.cycle === "out") this.cycle = "idle";
    if (feedback === "tempo") this.tempoUntil = now + 1600;
    if (now < this.tempoUntil) feedback = "tempo";
    return {
      ...base,
      ready: true,
      angle: this.smooth,
      progress: 1,
      rep,
      correction: feedback,
      cue: feedback
        ? "Slow down: move out and return with control."
        : this.cycle === "idle"
          ? "Begin in the relaxed starting position."
          : this.cycle === "out"
            ? "Now return slowly to your starting position."
            : type === "knee"
              ? "Slowly extend, then lower with control."
              : type === "curl"
                ? "Your upper arm looks steady. Keep your movement slow."
                : "Keep shoulders relaxed. Lift only as comfortable.",
    };
  }
}
