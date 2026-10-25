import { jointAngle, type Landmark } from "./tracking.ts";
export const VIDEO_FEATURE_VERSION = "rebound-video-features-v1";
export const VIDEO_FEATURE_NAMES = [
  "primary_median",
  "primary_p10",
  "primary_p90",
  "primary_range",
  "secondary_median",
  "secondary_range",
  "torso_lean_median",
  "torso_lean_p90",
  "segment_drift_median",
  "primary_speed_median",
  "primary_speed_p90",
];
export type VideoFrame = { time: number; points: Landmark[] };
export function summarizeVideo(
  frames: VideoFrame[],
  aspect: number,
  family: "upper" | "lower",
  side: "Left" | "Right",
) {
  if (
    !Number.isFinite(aspect) ||
    aspect <= 0 ||
    !["upper", "lower"].includes(family) ||
    !["Left", "Right"].includes(side)
  )
    throw Error("Invalid video geometry or feature family.");
  const left = side === "Left",
    shoulder = left ? 11 : 12,
    hip = left ? 23 : 24;
  const ids =
    family === "upper"
      ? [shoulder, left ? 13 : 14, left ? 15 : 16]
      : [hip, left ? 25 : 26, left ? 27 : 28];
  const required = [...new Set([11, 12, hip, ...ids])];
  const usable: {
    time: number;
    primary: number;
    secondary: number;
    lean: number;
    drift: number;
  }[] = [];
  let previous = -Infinity;
  for (const frame of frames) {
    if (!Number.isFinite(frame.time) || frame.time <= previous)
      throw Error("Frame times must be finite and strictly increasing.");
    previous = frame.time;
    const p = frame.points;
    if (
      !Array.isArray(p) ||
      p.length !== 33 ||
      required.some(
        (i) =>
          !p[i] ||
          ![p[i].x, p[i].y, p[i].visibility].every(Number.isFinite) ||
          (p[i].visibility ?? 0) < 0.7 ||
          (p[i].visibility ?? 0) > 1 ||
          p[i].x <= 0.035 ||
          p[i].x >= 0.965 ||
          p[i].y <= 0.035 ||
          p[i].y >= 0.965,
      )
    )
      continue;
    const primary = jointAngle(p[ids[0]], p[ids[1]], p[ids[2]], aspect),
      secondary =
        family === "upper"
          ? jointAngle(p[hip], p[shoulder], p[ids[1]], aspect)
          : jointAngle(p[shoulder], p[hip], p[ids[1]], aspect);
    const height = Math.abs(p[hip].y - p[shoulder].y);
    if (primary === null || secondary === null || height < 0.08) continue;
    usable.push({
      time: frame.time,
      primary,
      secondary,
      lean: (Math.abs(p[shoulder].x - p[hip].x) * aspect) / height,
      drift: (Math.abs(p[ids[0]].x - p[ids[1]].x) * aspect) / height,
    });
  }
  const quality = {
    sampledFrames: frames.length,
    usableFrames: usable.length,
    usableFraction: frames.length ? usable.length / frames.length : 0,
  };
  if (usable.length < 8 || quality.usableFraction < 0.8)
    return { version: VIDEO_FEATURE_VERSION, quality, features: null };
  const percentile = (values: number[], q: number) => {
    const sorted = [...values].sort((a, b) => a - b);
    const at = (sorted.length - 1) * q;
    return (
      sorted[Math.floor(at)] +
      (sorted[Math.ceil(at)] - sorted[Math.floor(at)]) * (at - Math.floor(at))
    );
  };
  const primary = usable.map((f) => f.primary),
    secondary = usable.map((f) => f.secondary),
    lean = usable.map((f) => f.lean),
    drift = usable.map((f) => f.drift);
  const speed = usable
    .slice(1)
    .flatMap((f, i) =>
      f.time - usable[i].time <= 0.5
        ? [Math.abs(f.primary - usable[i].primary) / (f.time - usable[i].time)]
        : [],
    );
  if (!speed.length)
    return { version: VIDEO_FEATURE_VERSION, quality, features: null };
  return {
    version: VIDEO_FEATURE_VERSION,
    quality,
    features: [
      percentile(primary, 0.5),
      percentile(primary, 0.1),
      percentile(primary, 0.9),
      Math.max(...primary) - Math.min(...primary),
      percentile(secondary, 0.5),
      Math.max(...secondary) - Math.min(...secondary),
      percentile(lean, 0.5),
      percentile(lean, 0.9),
      percentile(drift, 0.5),
      percentile(speed, 0.5),
      percentile(speed, 0.9),
    ],
  };
}
