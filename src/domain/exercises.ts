export type Exercise = {
  id: string;
  name: string;
  area: string;
  duration: string;
  sets: string;
  level: string;
  color: string;
  type: string;
  instructions: string;
  steps: string[];
  equipment: string;
  stopIf: string;
  camera: boolean;
  source: {
    title: string;
    url: string;
    verified: string | null;
    scope: string;
  };
};
const sitting = "https://www.nhs.uk/live-well/exercise/sitting-exercises/";
const strength = "https://www.nhs.uk/live-well/exercise/strength-exercises/";
const flexibility =
  "https://www.nhs.uk/live-well/exercise/flexibility-exercises/";
const balance = "https://www.nhs.uk/live-well/exercise/balance-exercises/";
const source = (url: string, title: string) => ({
  title,
  url,
  verified: "2026-10-24",
  scope:
    "General adult exercise guidance; not an injury-specific prescription.",
});
const base = {
  duration: "At your pace",
  sets: "Clinician-set dose",
  level: "Gentle mobility",
  color: "#d9e6de",
  equipment: "Stable chair",
  camera: false,
  stopIf:
    "Stop for worsening pain, dizziness, new numbness, or instability. Follow any restrictions from your clinician.",
};
export const exercises: Exercise[] = [
  {
    ...base,
    id: "knee-extension",
    name: "Seated knee extension",
    area: "Knee",
    type: "knee",
    camera: true,
    instructions:
      "Sit tall on a stable chair. Slowly straighten one knee within your clinician-approved range, then lower with control.",
    steps: [
      "Sit upright with both feet supported.",
      "Straighten one knee only through the range cleared for you.",
      "Lower slowly and relax before the next repetition.",
    ],
    source: {
      title: "Clinical review pending",
      url: "https://orthoinfo.aaos.org/en/recovery/knee-conditioning-program/",
      verified: null,
      scope:
        "This example has not been checked against the linked AAOS page; use only with specific professional clearance.",
    },
  },
  {
    ...base,
    id: "bicep-curl",
    name: "Standing bicep curl",
    area: "Elbow",
    type: "curl",
    camera: true,
    level: "Light strengthening",
    color: "#e7dfd0",
    equipment: "Optional clinician-approved light resistance",
    instructions:
      "Keep your arms by your sides. Slowly bend your elbows, then lower with control. Use only the resistance cleared for you.",
    steps: [
      "Stand with feet comfortably hip-width apart, or sit upright.",
      "Keep upper arms at your sides as you bend your elbows.",
      "Slowly lower back to your starting position.",
    ],
    source: source(strength, "NHS · Strength exercises — biceps curls"),
  },
  {
    ...base,
    id: "shoulder-raise",
    name: "Shoulder side raise",
    area: "Shoulder",
    type: "shoulder",
    camera: true,
    level: "Controlled movement",
    color: "#e0e3ee",
    equipment: "No weights",
    instructions:
      "Lift your arms sideways only through the comfortable range your clinician has cleared, then slowly lower.",
    steps: [
      "Stand comfortably with arms by your sides.",
      "Raise sideways without leaning or shrugging.",
      "Lower slowly; never reach farther to trigger a count.",
    ],
    source: {
      title: "Clinical review pending",
      url: "https://orthoinfo.aaos.org/en/recovery/rotator-cuff-and-shoulder-conditioning-program/",
      verified: null,
      scope:
        "The linked page remains inaccessible. This example requires individual professional clearance.",
    },
  },
  {
    ...base,
    id: "ankle-pumps",
    name: "Ankle pumps",
    area: "Ankle",
    type: "ankle",
    color: "#ebdfd6",
    instructions:
      "Sit upright with one leg supported or raised comfortably. Point your toes away, then draw them back toward you.",
    steps: [
      "Use a stable chair and keep your leg supported.",
      "Gently point your toes away from you.",
      "Bring them back toward you without forcing the ankle.",
    ],
    source: source(sitting, "NHS · Sitting exercises — ankle stretch"),
  },
  {
    ...base,
    id: "hip-march",
    name: "Seated hip march",
    area: "Hip",
    type: "hip-march",
    color: "#e5e5d2",
    instructions:
      "Sit tall, hold the chair for support, lift one bent knee comfortably, then place your foot down with control.",
    steps: [
      "Sit upright without leaning on the chair back.",
      "Hold the chair sides and lift one bent knee as comfortable.",
      "Lower the foot with control, then alternate sides if cleared.",
    ],
    source: source(sitting, "NHS · Sitting exercises — hip marching"),
  },
  {
    ...base,
    id: "seated-twist",
    name: "Seated upper-body turn",
    area: "Back",
    type: "seated-twist",
    color: "#dee6de",
    instructions:
      "Sit with feet flat and arms crossed. Keep your hips still while gently turning your upper body within a comfortable range.",
    steps: [
      "Sit upright with feet flat and arms crossed toward your shoulders.",
      "Keep your hips facing forward and slowly turn your upper body.",
      "Return to center before turning the other way.",
    ],
    source: source(sitting, "NHS · Sitting exercises — upper-body twist"),
  },
  {
    ...base,
    id: "chest-opener",
    name: "Seated chest opener",
    area: "Shoulder",
    type: "chest-opener",
    color: "#e8e2d3",
    instructions:
      "Sit tall, bring shoulders gently back and down, open your arms, and lift your chest without forcing the stretch.",
    steps: [
      "Sit away from the chair back.",
      "Bring shoulders gently down and back and extend arms out.",
      "Lift the chest comfortably, then relax.",
    ],
    source: source(sitting, "NHS · Sitting exercises — chest stretch"),
  },
  {
    ...base,
    id: "neck-turn",
    name: "Gentle neck rotation",
    area: "Neck",
    type: "neck-turn",
    color: "#e4e3ee",
    instructions:
      "Sit upright with relaxed shoulders. Slowly turn your head within a comfortable range, then return to center.",
    steps: [
      "Sit upright and look straight ahead.",
      "Slowly turn your head toward one shoulder without forcing it.",
      "Return to the center, then repeat to the other side if cleared.",
    ],
    stopIf:
      "Do not use after neck trauma without medical assessment. Stop for dizziness, radiating pain, numbness, or visual changes.",
    source: source(flexibility, "NHS · Flexibility exercises — neck rotation"),
  },
  {
    ...base,
    id: "sit-stand",
    camera: true,
    name: "Supported sit-to-stand",
    area: "Knee",
    type: "sit-stand",
    level: "Light strengthening",
    color: "#dce5d6",
    instructions:
      "From a stable chair, lean slightly forward and stand slowly. Return to sitting with control, using support as needed.",
    steps: [
      "Choose a stable chair with feet hip-width apart.",
      "Lean slightly forward and stand slowly, looking ahead.",
      "Lower back to the chair with control; use support if needed.",
    ],
    source: source(strength, "NHS · Strength exercises — sit-to-stand"),
  },
  {
    ...base,
    id: "mini-squat",
    camera: true,
    name: "Supported mini-squat",
    area: "Knee",
    type: "mini-squat",
    level: "Light strengthening",
    color: "#e8e3d2",
    instructions:
      "Hold a stable chair. Bend your knees only as comfortable, keeping them facing forward, then return to standing.",
    steps: [
      "Hold the back of a stable chair and stand hip-width apart.",
      "Bend your knees through your cleared comfortable range.",
      "Keep knees facing forward and rise slowly.",
    ],
    source: source(strength, "NHS · Strength exercises — mini-squats"),
  },
  {
    ...base,
    id: "calf-raise",
    name: "Supported calf raise",
    area: "Ankle",
    type: "calf-raise",
    level: "Light strengthening",
    color: "#e1e8da",
    instructions:
      "Hold a stable chair and slowly raise both heels. Lower them with control. Use only if weight bearing is cleared.",
    steps: [
      "Stand tall while holding a stable chair.",
      "Lift both heels as comfortable, without bouncing.",
      "Slowly lower them back to the floor.",
    ],
    source: source(strength, "NHS · Strength exercises — calf raises"),
  },
  {
    ...base,
    id: "hip-abduction",
    camera: true,
    name: "Supported sideways leg lift",
    area: "Hip",
    type: "hip-abduction",
    level: "Light strengthening",
    color: "#e6dfd8",
    instructions:
      "Hold a stable chair and move one leg to the side without tilting your hips. Return slowly.",
    steps: [
      "Stand upright with hands on a stable chair.",
      "Lift one leg sideways within your comfortable range.",
      "Keep hips level and lower with control.",
    ],
    source: source(strength, "NHS · Strength exercises — sideways leg lift"),
  },
  {
    ...base,
    id: "hip-extension",
    name: "Supported backward leg lift",
    area: "Hip",
    type: "hip-extension",
    level: "Light strengthening",
    color: "#dbe4df",
    instructions:
      "Hold a chair, stay upright, and move one straight leg backward a comfortable distance without arching your back.",
    steps: [
      "Stand tall, holding a stable chair for support.",
      "Move one straight leg a small comfortable distance backward.",
      "Avoid arching your lower back; return slowly.",
    ],
    source: source(strength, "NHS · Strength exercises — leg extension"),
  },
  {
    ...base,
    id: "wall-press",
    camera: true,
    name: "Wall press-up",
    area: "Shoulder",
    type: "wall-press",
    level: "Light strengthening",
    color: "#e2e3eb",
    equipment: "Clear wall and non-slip floor",
    instructions:
      "Place hands on a wall at chest height. Bend your elbows slowly, keeping your body aligned, then gently press away.",
    steps: [
      "Stand at a comfortable arm’s length from a wall.",
      "Place palms at chest level with fingers pointing upward.",
      "Bend elbows close to your sides, then return with control.",
    ],
    source: source(strength, "NHS · Strength exercises — wall press-up"),
  },
  {
    ...base,
    id: "side-bend",
    name: "Standing sideways bend",
    area: "Back",
    type: "side-bend",
    color: "#e6e7d6",
    equipment: "Clear space; support nearby if needed",
    instructions:
      "Stand comfortably and slide one hand down your side as far as comfortable. Return upright without twisting.",
    steps: [
      "Stand upright with feet comfortably hip-width apart.",
      "Slide one hand slowly down your side within a comfortable range.",
      "Return upright before changing sides.",
    ],
    source: source(flexibility, "NHS · Flexibility exercises — sideways bend"),
  },
  {
    ...base,
    id: "calf-stretch",
    name: "Supported calf stretch",
    area: "Lower leg",
    type: "calf-stretch",
    color: "#e9dfd5",
    equipment: "Wall and non-slip floor",
    instructions:
      "Place hands on a wall. Step one leg back and keep that heel down while gently bending the front knee.",
    steps: [
      "Face a wall and place hands on it for stability.",
      "Step one leg back with both feet flat.",
      "Keep the back heel down and move only within your cleared range.",
    ],
    source: source(flexibility, "NHS · Flexibility exercises — calf stretch"),
  },
  {
    ...base,
    id: "single-leg",
    name: "Supported single-leg balance",
    area: "Foot",
    type: "single-leg",
    color: "#dce7dd",
    level: "Supported balance",
    equipment: "Wall or stable support",
    instructions:
      "With fingertips on a wall, lift one foot a little, keeping hips level. Put it down gently. Never balance unsupported if unsteady.",
    steps: [
      "Stand facing a wall with fingertips touching it.",
      "Lift one foot a little, keeping hips level.",
      "Place the foot down gently; keep support throughout if needed.",
    ],
    source: source(balance, "NHS · Balance exercises — one-leg stand"),
  },
  {
    ...base,
    id: "tandem-walk",
    name: "Supported heel-to-toe walk",
    area: "Foot",
    type: "tandem-walk",
    color: "#e7e4d9",
    level: "Supported balance",
    equipment: "Clear path beside a wall",
    instructions:
      "Beside a wall, slowly place one heel in front of the opposite toes. Keep looking forward and use support.",
    steps: [
      "Choose a clear path beside a wall or rail.",
      "Place one heel just in front of the other foot’s toes.",
      "Step slowly, look ahead, and keep support as needed.",
    ],
    source: source(balance, "NHS · Balance exercises — heel-to-toe walk"),
  },
  {
    ...base,
    id: "band-curl",
    name: "Resistance-band curl",
    area: "Elbow",
    type: "curl",
    camera: true,
    level: "Clinician-directed resistance",
    equipment:
      "An intact resistance band approved by your clinician; secure footwear",
    instructions:
      "Use only the band setup and resistance your clinician has taught you. Keep upper arms at your sides as you slowly bend and lower your elbows.",
    steps: [
      "Inspect the band for damage. Use only a secure setup taught by your clinician; keep it away from your face.",
      "With the band secured as instructed, bend your elbows slowly without swinging your upper arms.",
      "Return with control. Stop if the anchor shifts, the band slips, or symptoms increase.",
    ],
    stopIf:
      "Do not use a damaged band or an improvised anchor. Stop for slipping, unexpected tension, pain, tingling, or dizziness.",
    source: {
      title: "Band-specific review pending",
      url: strength,
      verified: null,
      scope:
        "The NHS source supports an unbanded curl. This equipment adaptation needs individual clinician instruction; the camera cannot assess band tension or anchoring.",
    },
  },
  {
    ...base,
    id: "band-row",
    name: "Clinician-guided band row",
    area: "Shoulder",
    type: "band-row",
    level: "Clinician-directed resistance",
    equipment:
      "Intact resistance band and a purpose-built anchor, both checked by your clinician",
    instructions:
      "Use only a professionally taught band setup. Draw your elbows back comfortably without leaning, then release the pull slowly.",
    steps: [
      "Have your clinician choose the anchor, height, resistance, and range; inspect the band before use.",
      "Stay comfortably upright and draw your elbows back only through your taught range.",
      "Let your arms move forward with control; do not release the band suddenly.",
    ],
    stopIf:
      "Stop for pain, an unstable anchor, band damage, or unexpected tension. Do not improvise a door or furniture anchor.",
    source: {
      title: "Equipment protocol needs clinician review",
      url: strength,
      verified: null,
      scope:
        "This illustration is not verified against an exercise-specific source and must not be used as a self-directed injury protocol.",
    },
  },
  {
    ...base,
    id: "dowel-flexion",
    name: "Assisted dowel shoulder lift",
    area: "Shoulder",
    type: "dowel-flexion",
    camera: true,
    equipment:
      "A lightweight smooth dowel approved by your clinician; no weighted bar",
    instructions:
      "Hold a light dowel in the grip taught by your clinician. Let the other arm assist a comfortable forward lift without forcing the affected shoulder.",
    steps: [
      "Use a light unweighted dowel and the grip and position your clinician has taught you.",
      "Slowly assist a forward lift only within your individually cleared range.",
      "Lower with control. Do not use the bar to push farther or to trigger a count.",
    ],
    stopIf:
      "Do not use after surgery or dislocation without specific instructions. Stop for pinching, pain, numbness, or forced movement.",
    source: {
      title: "Equipment protocol needs clinician review",
      url: "https://orthoinfo.aaos.org/en/recovery/rotator-cuff-and-shoulder-conditioning-program/",
      verified: null,
      scope:
        "This original direction-of-motion illustration is not a reviewed rehabilitation protocol. Your clinician must set the grip, range, and dose.",
    },
  },
  {
    ...base,
    id: "seated-hamstring",
    name: "Clinician-guided seated hamstring stretch",
    area: "Hip",
    type: "hamstring",
    equipment: "Stable chair and non-slip floor",
    level: "Clinician-directed stretch",
    instructions:
      "Only if cleared, place one heel forward with a softly bent knee. Hinge gently from the hips within the range taught by your clinician.",
    steps: [
      "Sit on a stable chair and place one heel forward, keeping the knee softly bent.",
      "Keep your back comfortable and hinge slightly from your hips; do not round or reach for your toes.",
      "Return upright slowly. Follow your clinician’s hold time rather than the animation timing.",
    ],
    stopIf:
      "Do not stretch a suspected new hamstring injury. Stop for sharp or radiating pain, numbness, tingling, or worsening symptoms.",
    source: {
      title: "Exercise-specific review pending",
      url: flexibility,
      verified: null,
      scope:
        "This original illustration is not verified against the linked general guidance. Post-workout soreness does not automatically make this stretch appropriate.",
    },
  },
];
export const cameraExercises = exercises.filter((e) => e.camera);
export const exerciseById = new Map(exercises.map((e) => [e.id, e]));
