// Local research utility. No videos or landmarks are sent to an external service.
import { readFile, writeFile, realpath, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { resolve, dirname, basename, extname, sep } from "node:path";
import { chromium } from "@playwright/test";
import {
  summarizeVideo,
  VIDEO_FEATURE_NAMES,
} from "../src/domain/videoFeatures.ts";
const [manifestFile, outputFile] = process.argv.slice(2);
if (!manifestFile || !outputFile)
  throw Error(
    "Usage: node training/extract-videos.mjs manifest.json output.jsonl",
  );
const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
if (
  !Array.isArray(manifest.clips) ||
  !manifest.clips.length ||
  manifest.clips.length > 10000 ||
  manifest.rights?.trainingAllowed !== true ||
  typeof manifest.rights?.reference !== "string" ||
  !manifest.rights.reference.trim()
)
  throw Error(
    "A nonempty clip manifest and explicit, documented training rights are required. A code license alone does not establish video rights.",
  );
const posePackage = JSON.parse(
  await readFile(
    new URL("../node_modules/@mediapipe/pose/package.json", import.meta.url),
    "utf8",
  ),
);
if (posePackage.version !== "0.5.1675469404")
  throw Error(
    "This feature schema requires the pinned MediaPipe model; review and version any extractor change.",
  );
const root = await realpath(dirname(resolve(manifestFile)));
const groups = new Map(),
  hashes = new Map(),
  ids = new Set();
const clips = [];
for (const clip of manifest.clips) {
  if (
    !clip ||
    !["clip_id", "participant_id", "exercise_id"].every(
      (key) => typeof clip[key] === "string",
    ) ||
    !/^[a-zA-Z0-9_-]{1,80}$/.test(clip.clip_id) ||
    ids.has(clip.clip_id) ||
    !/^[a-zA-Z0-9_-]{1,80}$/.test(clip.participant_id) ||
    !/^[a-z0-9-]{1,80}$/.test(clip.exercise_id) ||
    !["train", "validation", "test"].includes(clip.split) ||
    !["acceptable", "torso", "elbow", "limb", "tempo", "other"].includes(
      clip.label,
    ) ||
    !["front", "side"].includes(clip.view) ||
    !["upper", "lower"].includes(clip.family) ||
    !["Left", "Right"].includes(clip.side) ||
    typeof clip.file !== "string" ||
    !Number.isFinite(clip.start) ||
    !Number.isFinite(clip.end) ||
    clip.start < 0 ||
    clip.end - clip.start < 1 ||
    clip.end - clip.start > 30
  )
    throw Error(
      "Invalid, repeated, or unlabelled clip metadata; use 1–30 second labelled segments.",
    );
  ids.add(clip.clip_id);
  if (
    groups.has(clip.participant_id) &&
    groups.get(clip.participant_id) !== clip.split
  )
    throw Error("Participant leakage across splits.");
  groups.set(clip.participant_id, clip.split);
  const file = await realpath(resolve(root, clip.file));
  if (!file.startsWith(root + sep))
    throw Error("Video paths must stay under the manifest directory.");
  if (![".mp4", ".mov", ".webm"].includes(extname(file).toLowerCase()))
    throw Error("Use MP4, MOV, or WebM videos.");
  const size = (await stat(file)).size;
  if (!size || size > 500 * 1024 * 1024)
    throw Error("Videos must be nonempty and no larger than 500 MB.");
  const hash = createHash("sha256");
  for await (const part of createReadStream(file)) hash.update(part);
  const video_sha256 = hash.digest("hex");
  if (hashes.has(video_sha256) && hashes.get(video_sha256) !== clip.split)
    throw Error("The same video appears in multiple splits.");
  hashes.set(video_sha256, clip.split);
  clips.push({ ...clip, file, video_sha256, size });
}
let current;
const poseRoot = resolve("public/pose");
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<video id="video" muted playsinline preload="auto"></video><script src="/pose/pose.js"></script>',
      );
      return;
    }
    let file, type;
    if (path === "/clip" && current) {
      file = current.file;
      type =
        extname(file) === ".mov"
          ? "video/quicktime"
          : extname(file) === ".webm"
            ? "video/webm"
            : "video/mp4";
    } else if (
      path.startsWith("/pose/") &&
      basename(path) === path.slice(6) &&
      /\.(js|wasm|data|tflite|binarypb)$/.test(path)
    ) {
      file = resolve(poseRoot, basename(path));
      type = file.endsWith(".js")
        ? "application/javascript"
        : file.endsWith(".wasm")
          ? "application/wasm"
          : "application/octet-stream";
    } else {
      res.writeHead(404).end();
      return;
    }
    const size = (await stat(file)).size;
    res.setHeader("Content-Type", type);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-store");
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start = 0,
      end = size - 1;
    if (range) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start > end || start >= size) {
        res.writeHead(416).end();
        return;
      }
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": end - start + 1,
      });
    } else res.writeHead(200, { "Content-Length": size });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    const stream = createReadStream(file, { start, end });
    res.on("close", () => stream.destroy());
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      ...(process.env.REBOUND_TRAINING_SOFTWARE_GPU === "1"
        ? [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ]
        : []),
    ],
  });
  const context = await browser.newContext();
  await context.route("**/*", (route) =>
    route
      .request()
      .url()
      .startsWith(origin + "/")
      ? route.continue()
      : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  await page.goto(origin);
  await page.evaluate(async () => {
    window.researchPose = new window.Pose({
      locateFile: (file) => "/pose/" + file,
    });
    window.researchPose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.75,
    });
    await window.researchPose.initialize();
  });
  const rows = [];
  for (const clip of clips) {
    current = clip;
    const result = await page.evaluate(
      async ({ start, end }) => {
        const video = document.getElementById("video");
        video.src = "/clip?version=" + Math.random();
        await new Promise((resolve, reject) => {
          video.onloadeddata = resolve;
          video.onerror = () =>
            reject(Error("Video codec could not be decoded."));
        });
        if (end > video.duration + 0.05)
          throw Error("A labelled segment extends beyond the video duration.");
        window.researchPose.reset();
        let latest;
        window.researchPose.onResults((result) => {
          latest = result.poseLandmarks || [];
        });
        const frames = [];
        // Sample the complete labelled segment, not only frames that look correct.
        for (let time = start; time < end; time += 0.1) {
          if (Math.abs(video.currentTime - time) > 0.001)
            await new Promise((resolve, reject) => {
              video.onseeked = resolve;
              video.onerror = reject;
              video.currentTime = time;
            });
          await window.researchPose.send({ image: video });
          frames.push({ time, points: latest });
        }
        return { frames, aspect: video.videoWidth / video.videoHeight };
      },
      { start: clip.start, end: clip.end },
    );
    const summary = summarizeVideo(
      result.frames,
      result.aspect,
      clip.family,
      clip.side,
    );
    rows.push({
      clip_id: clip.clip_id,
      participant_id: clip.participant_id,
      exercise_id: clip.exercise_id,
      view: clip.view,
      family: clip.family,
      split: clip.split,
      label: clip.label,
      video_sha256: clip.video_sha256,
      rights: manifest.rights,
      pose_model: "@mediapipe/pose@0.5.1675469404/full",
      feature_names: VIDEO_FEATURE_NAMES,
      ...summary,
    });
    console.log(
      `${clip.clip_id}: ${summary.features ? "features extracted" : "insufficient visible pose; excluded from classifier fitting"}`,
    );
  }
  await writeFile(
    outputFile,
    rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
    { mode: 0o600 },
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
