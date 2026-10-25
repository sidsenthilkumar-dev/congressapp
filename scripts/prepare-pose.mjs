import { mkdir, copyFile, readdir } from "node:fs/promises";
const source = new URL("../node_modules/@mediapipe/pose/", import.meta.url);
const target = new URL("../public/pose/", import.meta.url);
await mkdir(target, { recursive: true });
for (const name of await readdir(source))
  if (/\.(wasm|data|binarypb|tflite|js)$/.test(name))
    await copyFile(new URL(name, source), new URL(name, target));
console.log("On-device pose model and runtime prepared.");
