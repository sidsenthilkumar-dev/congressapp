import type { Exercise } from "./exercises";
import type { TrackedMovement } from "./tracking";

export type CameraProtocol = {
  movement: TrackedMovement;
  view: "front" | "side";
  observes: string;
  cannotObserve: string;
};
const protocols: Record<string, CameraProtocol> = {
  knee: {
    movement: "knee",
    view: "side",
    observes: "Knee bend-and-return cycles",
    cannotObserve: "Pain, joint loading, or your prescribed range",
  },
  curl: {
    movement: "curl",
    view: "side",
    observes: "Elbow cycles and upper-arm drift",
    cannotObserve: "Grip, resistance, or band tension",
  },
  shoulder: {
    movement: "shoulder",
    view: "front",
    observes: "Side-raise cycles and trunk lean",
    cannotObserve: "Shoulder pain, joint mechanics, or safe lifting limits",
  },
  "mini-squat": {
    movement: "squat",
    view: "side",
    observes: "Knee bend-and-return cycles",
    cannotObserve:
      "Balance, support contact, weight distribution, or knee alignment in depth",
  },
  "sit-stand": {
    movement: "sit-stand",
    view: "side",
    observes: "Seated-to-upright knee cycles",
    cannotObserve: "Chair stability, seat contact, or fall risk",
  },
  "hip-abduction": {
    movement: "hip-abduction",
    view: "front",
    observes: "Sideways leg cycles and trunk lean",
    cannotObserve: "Support contact, pelvic rotation, or balance",
  },
  "wall-press": {
    movement: "wall-press",
    view: "side",
    observes: "Elbow bend-and-return cycles",
    cannotObserve: "Wall contact, hand loading, or shoulder safety",
  },
  "dowel-flexion": {
    movement: "flexion",
    view: "side",
    observes: "Arm lift-and-return cycles",
    cannotObserve: "Grip, bar pressure, or assistance from the other arm",
  },
};
export function cameraProtocol(exercise: Pick<Exercise, "type">) {
  return protocols[exercise.type] ?? null;
}
export function trackingCoverage(exercise: Exercise) {
  const protocol = cameraProtocol(exercise);
  return protocol
    ? {
        mode: "experimental" as const,
        title: "Experimental rep estimates",
        detail:
          protocol.observes +
          ". Cannot assess " +
          protocol.cannotObserve.toLowerCase() +
          ".",
      }
    : {
        mode: "manual" as const,
        title: "Camera mirror + manual count",
        detail:
          "This movement needs details the body-pose model cannot reliably measure. Use the illustration, your clinician’s instructions, and manual counting.",
      };
}
