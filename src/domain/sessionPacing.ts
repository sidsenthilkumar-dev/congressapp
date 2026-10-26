const TRACKING_GAP_MS = 3000;
const INACTIVITY_TIMEOUT_MS = 8000;
const RECOVERY_FRAME_GAP_MS = 1200;
const STEADY_TRACKING_MS = 900;
const MOTION_THRESHOLD_DEGREES = 4;
const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 180;

export type PaceMode = "active" | "paused" | "rest" | "ready";
export type PaceState = { mode: PaceMode; reason: string; remaining: number };
export class SessionPacing {
  private lastMotion: number | null = null;
  private lastGood: number | null = null;
  private anchor: number | null = null;
  private deadline = 0;
  private trackingPause = false;
  private recoverySince: number | null = null;
  private recoveryLast: number | null = null;
  private state: PaceState = { mode: "active", reason: "", remaining: 0 };
  reset() {
    this.lastMotion = null;
    this.lastGood = null;
    this.anchor = null;
    this.deadline = 0;
    this.trackingPause = false;
    this.recoverySince = null;
    this.recoveryLast = null;
    this.state = { mode: "active", reason: "", remaining: 0 };
  }
  resume() {
    this.reset();
    return this.snapshot();
  }
  snapshot() {
    return { ...this.state };
  }
  observe(angle: number | null, valid: boolean, now: number) {
    if (!Number.isFinite(now)) return this.snapshot();
    if (this.state.mode === "paused" && this.trackingPause) {
      if (!valid || angle === null || !Number.isFinite(angle)) {
        this.recoverySince = null;
        this.recoveryLast = null;
        return this.snapshot();
      }
      if (
        this.recoverySince === null ||
        this.recoveryLast === null ||
        now - this.recoveryLast > RECOVERY_FRAME_GAP_MS ||
        now < this.recoveryLast
      )
        this.recoverySince = now;
      this.recoveryLast = now;
      if (now - this.recoverySince < STEADY_TRACKING_MS) return this.snapshot();
      this.resume();
    }
    if (this.state.mode !== "active") return this.snapshot();
    if (valid && angle !== null && Number.isFinite(angle)) {
      this.lastGood = now;
      if (this.anchor === null || Math.abs(angle - this.anchor) >= MOTION_THRESHOLD_DEGREES) {
        this.anchor = angle;
        this.lastMotion = now;
      }
    }
    return this.tick(now);
  }
  tick(now: number) {
    if (this.state.mode === "rest") {
      this.state.remaining = Math.max(
        0,
        Math.ceil((this.deadline - now) / 1000),
      );
      if (!this.state.remaining)
        this.state = {
          mode: "ready",
          reason: "Break finished. Resume only when comfortable.",
          remaining: 0,
        };
    }
    if (this.state.mode === "active" && this.lastGood !== null) {
      if (now - this.lastGood >= TRACKING_GAP_MS) {
        this.trackingPause = true;
        this.recoverySince = null;
        this.recoveryLast = null;
        this.state = {
          mode: "paused",
          reason:
            "Tracking is unclear. Keep the working joints visible; counting resumes after tracking is steady.",
          remaining: 0,
        };
      } else if (this.lastMotion !== null && now - this.lastMotion >= INACTIVITY_TIMEOUT_MS)
        this.state = {
          mode: "paused",
          reason: "No clear movement for 8 seconds. Your session is paused.",
          remaining: 0,
        };
    }
    return this.snapshot();
  }
  rest(now: number, seconds: number) {
    this.trackingPause = false;
    this.recoverySince = null;
    this.recoveryLast = null;
    this.deadline = now + Math.max(MIN_REST_SECONDS, Math.min(MAX_REST_SECONDS, seconds)) * 1000;
    this.state = {
      mode: "rest",
      reason: "Take your time. Counting and active time are paused.",
      remaining: Math.ceil((this.deadline - now) / 1000),
    };
    return this.snapshot();
  }
}
