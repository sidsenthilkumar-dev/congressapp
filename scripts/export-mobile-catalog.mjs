import { exercises } from "../src/domain/exercises.ts";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("mobile/src/patient/data", { recursive: true });
await writeFile(
  "mobile/src/patient/data/exercises.json",
  JSON.stringify(
    exercises.map(({ id, name, area, camera, equipment, type }) => ({
      id,
      name,
      area,
      camera,
      equipment,
      type,
    })),
    null,
    2,
  ) + "\n",
);
