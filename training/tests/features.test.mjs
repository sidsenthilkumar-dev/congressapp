import { test } from "node:test";
import assert from "node:assert/strict";
import {
  summarizeVideo,
  VIDEO_FEATURE_NAMES,
} from "../../src/domain/videoFeatures.ts";
function frames() {
  return Array.from({ length: 10 }, (_, i) => {
    const points = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      visibility: 0.99,
    }));
    points[11] = { x: 0.48, y: 0.2, visibility: 0.99 };
    points[12] = { x: 0.52, y: 0.2, visibility: 0.99 };
    points[23] = { x: 0.48, y: 0.55, visibility: 0.99 };
    points[13] = { x: 0.48, y: 0.35, visibility: 0.99 };
    points[15] = { x: 0.62, y: 0.35, visibility: 0.99 };
    return { time: i * 0.1, points };
  });
}
test("video features preserve geometry and expose stable ordered names", () => {
  const result = summarizeVideo(frames(), 4 / 3, "upper", "Left");
  assert.equal(result.features.length, VIDEO_FEATURE_NAMES.length);
  assert.ok(Math.abs(result.features[0] - 90) < 1e-8);
  assert.equal(result.features[3], 0);
  assert.equal(result.features[9], 0);
  assert.equal(result.quality.usableFraction, 1);
});
test("missing or unreliable pose produces an explicit abstention", () => {
  const samples = frames();
  for (let i = 0; i < 3; i++) samples[i].points[15].visibility = 0.2;
  const result = summarizeVideo(samples, 4 / 3, "upper", "Left");
  assert.equal(result.features, null);
  assert.equal(result.quality.usableFraction, 0.7);
});
test("non-finite geometry is excluded and timestamps cannot repeat", () => {
  const samples = frames();
  samples[0].points[15].x = NaN;
  assert.equal(
    summarizeVideo(samples, 4 / 3, "upper", "Left").quality.usableFrames,
    9,
  );
  samples[1].time = 0;
  assert.throws(
    () => summarizeVideo(samples, 4 / 3, "upper", "Left"),
    /strictly increasing/,
  );
  assert.throws(
    () => summarizeVideo(frames(), NaN, "upper", "Left"),
    /Invalid video/,
  );
});
