export type RecoveryProfile = {
  area: string;
  side: string;
  symptoms: string[];
  goal: string;
  condition?: string;
  stage?: string;
};
export type Condition = {
  name: string;
  area: string;
  care: "assessment" | "clinician-plan" | "general";
  note: string;
};
export const regions = [
  "Knee",
  "Shoulder",
  "Elbow",
  "Ankle",
  "Foot",
  "Hip",
  "Back",
  "Neck",
  "Wrist & hand",
  "Head",
  "Chest & ribs",
  "Lower leg",
  "Other",
];
const groups: Record<
  string,
  { names: string[]; care: Condition["care"]; note: string }[]
> = {
  Knee: [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "General movement examples only, after clearance.",
    },
    {
      names: [
        "ACL injury",
        "PCL injury",
        "MCL / LCL injury",
        "Meniscus injury",
        "Patellar dislocation",
        "Patellar fracture",
        "Quadriceps / patellar tendon tear",
        "Knee replacement / other surgery",
      ],
      care: "clinician-plan",
      note: "Loading, range, and timing depend on your diagnosis and treatment. Follow your clinician’s specific protocol.",
    },
    {
      names: [
        "Patellofemoral pain",
        "Patellar tendinopathy",
        "Iliotibial band symptoms",
        "Knee bursitis",
        "Osgood–Schlatter symptoms",
        "Osteoarthritis-related knee pain",
      ],
      care: "assessment",
      note: "Pain in this region can have several causes. Get assessed before choosing a strengthening program.",
    },
  ],
  Shoulder: [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "General movement examples only, after clearance.",
    },
    {
      names: [
        "Rotator cuff tear",
        "Shoulder dislocation / instability",
        "Labral injury",
        "AC joint separation",
        "Clavicle / upper arm fracture",
        "Shoulder surgery",
      ],
      care: "clinician-plan",
      note: "Position and loading restrictions differ. Do not use a generic shoulder program after these injuries.",
    },
    {
      names: [
        "Rotator cuff-related shoulder pain",
        "Frozen shoulder",
        "Shoulder bursitis",
        "Biceps tendon symptoms",
      ],
      care: "assessment",
      note: "A clinician should determine your comfortable range and appropriate progression.",
    },
  ],
  Elbow: [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "Only use clinician-cleared comfortable movements.",
    },
    {
      names: [
        "Elbow fracture / dislocation",
        "Distal biceps tendon tear",
        "UCL injury",
        "Elbow surgery",
      ],
      care: "clinician-plan",
      note: "Use the range, resistance, and timing prescribed by your treating team.",
    },
    {
      names: [
        "Tennis elbow",
        "Golfer’s elbow",
        "Elbow bursitis",
        "Ulnar nerve symptoms",
      ],
      care: "assessment",
      note: "A symptom label alone does not determine which movements or loads are appropriate.",
    },
  ],
  Ankle: [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "Only use clinician-cleared comfortable movements.",
    },
    {
      names: [
        "Ankle sprain",
        "High ankle sprain",
        "Ankle fracture",
        "Achilles tendon rupture",
        "Ankle surgery",
      ],
      care: "clinician-plan",
      note: "Weight-bearing and movement restrictions depend on the injury and healing stage.",
    },
    {
      names: [
        "Achilles tendon pain",
        "Peroneal tendon symptoms",
        "Posterior tibial tendon symptoms",
      ],
      care: "assessment",
      note: "These problems need different loading plans. Ankle pumps are not a treatment for all of them.",
    },
  ],
  Foot: [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "Comfortable movement examples only, after clearance.",
    },
    {
      names: [
        "Foot / toe fracture",
        "Stress fracture",
        "Lisfranc injury",
        "Foot surgery",
      ],
      care: "clinician-plan",
      note: "Avoid self-selected loading; follow weight-bearing and rehabilitation instructions.",
    },
    {
      names: [
        "Plantar heel pain",
        "Turf toe",
        "Metatarsal pain",
        "Bunion-related discomfort",
      ],
      care: "assessment",
      note: "Assessment helps distinguish a soft-tissue problem from a bone or joint injury.",
    },
  ],
  Hip: [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "Use supported, comfortable movement only after clearance.",
    },
    {
      names: [
        "Hip fracture",
        "Hip labral injury",
        "Hip replacement / surgery",
        "Hamstring tear / avulsion",
      ],
      care: "clinician-plan",
      note: "Restrictions and safe positions are specific to your diagnosis and procedure.",
    },
    {
      names: [
        "Hip flexor strain",
        "Groin / adductor strain",
        "Gluteal tendon pain",
        "Lateral hip pain",
        "Hamstring strain",
        "Quadriceps strain",
      ],
      care: "assessment",
      note: "Muscle and tendon injuries need a plan matched to severity and healing stage.",
    },
  ],
  Back: [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "Comfortable movement examples only after assessment and clearance.",
    },
    {
      names: [
        "Vertebral fracture",
        "Spine surgery",
        "Spondylolysis / stress injury",
      ],
      care: "clinician-plan",
      note: "Follow your spine clinician’s restrictions. Generic exercise is not a safe substitute.",
    },
    {
      names: [
        "Back strain",
        "Persistent low back pain",
        "Disc-related symptoms / sciatica",
      ],
      care: "assessment",
      note: "Radiating pain, weakness, and bladder or bowel changes need medical assessment.",
    },
  ],
  Neck: [
    {
      names: [
        "Whiplash",
        "Neck strain",
        "Nerve-related arm symptoms",
        "Persistent neck pain",
      ],
      care: "assessment",
      note: "Get assessed, particularly after a collision, fall, or symptoms into the arm.",
    },
    {
      names: ["Neck fracture / instability", "Neck surgery"],
      care: "clinician-plan",
      note: "Do not start neck movements without your treating team’s protocol.",
    },
  ],
  "Wrist & hand": [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "Use comfortable movement only after clearance.",
    },
    {
      names: [
        "Wrist / scaphoid fracture",
        "Finger fracture / dislocation",
        "Wrist ligament injury",
        "Hand tendon injury",
        "Hand / wrist surgery",
      ],
      care: "clinician-plan",
      note: "Splints, healing stage, and tendon repairs may restrict movement.",
    },
    {
      names: [
        "Wrist sprain",
        "Carpal tunnel symptoms",
        "De Quervain’s symptoms",
        "Finger sprain",
        "Hand overuse symptoms",
      ],
      care: "assessment",
      note: "Nerve, tendon, and ligament problems require different approaches.",
    },
  ],
  Head: [
    {
      names: ["Suspected concussion", "Diagnosed concussion", "Head injury"],
      care: "clinician-plan",
      note: "No self-directed rehab exercise. Get medical assessment and a supervised return-to-school / return-to-sport plan.",
    },
  ],
  "Chest & ribs": [
    {
      names: [
        "Rib injury / possible fracture",
        "Chest muscle strain",
        "Unexplained chest symptoms",
      ],
      care: "assessment",
      note: "New chest pain or trouble breathing may be urgent. Do not use exercise to test these symptoms.",
    },
  ],
  Other: [
    {
      names: [
        "Not diagnosed / unsure",
        "Other injury or condition",
        "Multiple injuries",
        "Post-surgery / clinician-specific protocol",
      ],
      care: "assessment",
      note: "Record your symptoms and ask a qualified healthcare professional to assess you. No automatic exercise plan is generated.",
    },
  ],
};
const additionalTopics: Record<
  string,
  { names: string[]; care: Condition["care"]; note: string }[]
> = {
  Knee: [
    {
      names: [
        "Baker’s cyst",
        "Pes anserine pain",
        "Plica-related symptoms",
        "Knee hyperextension injury",
      ],
      care: "assessment",
      note: "These symptoms overlap with other knee conditions. Get an assessment before loading or stretching the knee.",
    },
    {
      names: [
        "Knee cartilage / osteochondral injury",
        "Tibial plateau fracture",
      ],
      care: "clinician-plan",
      note: "Weight bearing and movement limits depend on the injury. Follow an individual clinician-led plan.",
    },
  ],
  Shoulder: [
    {
      names: ["Scapular control problems", "Shoulder overuse symptoms"],
      care: "assessment",
      note: "Assess the cause and choose a comfortable range with a qualified professional.",
    },
    {
      names: ["Scapular fracture", "Pectoralis major tendon tear"],
      care: "clinician-plan",
      note: "Protect the injured structures and follow your treating team’s loading and movement restrictions.",
    },
  ],
  Elbow: [
    {
      names: ["Elbow overuse in throwing", "Radial tunnel symptoms"],
      care: "assessment",
      note: "Throwing pain and nerve symptoms need an assessment before an exercise program.",
    },
    {
      names: ["Triceps tendon tear", "Radial head fracture"],
      care: "clinician-plan",
      note: "Do not use a generic strengthening routine. Your clinician determines range and loading.",
    },
  ],
  Ankle: [
    {
      names: ["Chronic ankle instability", "Ankle impingement symptoms"],
      care: "assessment",
      note: "Balance and loading choices depend on stability, pain, and the cause of symptoms.",
    },
    {
      names: ["Talar osteochondral injury", "Syndesmosis surgery recovery"],
      care: "clinician-plan",
      note: "Follow individual weight-bearing and range restrictions before trying a general movement.",
    },
  ],
  Foot: [
    {
      names: [
        "Sesamoid pain",
        "Morton’s neuroma symptoms",
        "Heel fat-pad pain",
      ],
      care: "assessment",
      note: "Foot pain may involve different tissues. Get assessed before changing loads or starting exercises.",
    },
    {
      names: [
        "Navicular stress fracture",
        "Calcaneal fracture",
        "Plantar fascia rupture",
      ],
      care: "clinician-plan",
      note: "Avoid self-selected loading until you have an individual treatment and rehabilitation plan.",
    },
  ],
  Hip: [
    {
      names: [
        "Gluteal muscle strain",
        "Deep gluteal / piriformis symptoms",
        "Snapping hip symptoms",
      ],
      care: "assessment",
      note: "The correct exercise approach depends on diagnosis, severity, and the cause of pain.",
    },
    {
      names: ["Femoral neck stress fracture", "Adductor tendon rupture"],
      care: "clinician-plan",
      note: "These injuries need individual medical guidance; generic mobility or strengthening is not appropriate.",
    },
  ],
  Back: [
    {
      names: [
        "Thoracic muscle strain",
        "Sacroiliac-region pain",
        "Coccyx injury",
        "Spinal stenosis-related symptoms",
      ],
      care: "assessment",
      note: "Have persistent or new back symptoms assessed. New neurological symptoms need prompt medical attention.",
    },
  ],
  Neck: [
    {
      names: [
        "Torticollis / acute neck spasm",
        "Cervical radiculopathy symptoms",
      ],
      care: "assessment",
      note: "Do not self-diagnose neck or nerve symptoms. Seek assessment, especially after trauma or with symptoms into the arm.",
    },
  ],
  "Wrist & hand": [
    {
      names: [
        "Trigger finger",
        "Ganglion-related wrist discomfort",
        "Finger overuse / climbing symptoms",
      ],
      care: "assessment",
      note: "Tendon, nerve, joint, and ligament conditions need different management. Assess before choosing exercises.",
    },
    {
      names: [
        "Mallet finger",
        "Thumb UCL injury",
        "TFCC injury",
        "Metacarpal fracture",
        "Flexor tendon repair",
      ],
      care: "clinician-plan",
      note: "Splinting, tendon healing, and ligament protection may restrict movement. Follow your hand specialist’s instructions.",
    },
  ],
  "Lower leg": [
    {
      names: ["General stiffness / movement confidence"],
      care: "general",
      note: "Comfortable general movement only after assessment and professional clearance.",
    },
    {
      names: [
        "Shin splints",
        "Calf muscle strain",
        "Lower-leg overuse symptoms",
      ],
      care: "assessment",
      note: "Get assessed to distinguish soft-tissue symptoms from a stress injury or other cause. Do not exercise through increasing pain.",
    },
    {
      names: [
        "Tibial shaft fracture",
        "Fibular fracture",
        "Tibial stress fracture",
        "Lower-leg surgery",
      ],
      care: "clinician-plan",
      note: "Follow your clinician’s individual weight-bearing and movement restrictions.",
    },
  ],
  "Chest & ribs": [
    {
      names: ["Sternal fracture"],
      care: "clinician-plan",
      note: "Chest injuries require medical assessment and an individual plan. Chest pain or breathing difficulty may be urgent.",
    },
  ],
};
for (const [area, items] of Object.entries(additionalTopics))
  groups[area] = [...(groups[area] || []), ...items];
export const conditions: Condition[] = Object.entries(groups).flatMap(
  ([area, items]) =>
    items.flatMap((g) =>
      g.names.map((name) => ({ name, area, care: g.care, note: g.note })),
    ),
);
export const symptomOptions = [
  "Stiffness",
  "Soreness",
  "Limited mobility",
  "Swelling",
  "Weakness",
  "Numbness or tingling",
  "Cannot bear weight",
  "Hot or red joint",
  "Fever",
  "Severe sudden pain",
  "Chest pain / trouble breathing",
  "Bladder or bowel changes",
  "Head injury symptoms",
];
export const stages = [
  "Ongoing / assessed",
  "New or worsening",
  "Post-surgery / protected healing",
];
export function assessProfile(profile: RecoveryProfile, pain?: number) {
  const urgent = profile.symptoms.filter((s) =>
    [
      "Severe sudden pain",
      "Chest pain / trouble breathing",
      "Bladder or bowel changes",
    ].includes(s),
  );
  if (urgent.length)
    return {
      level: "urgent" as const,
      title: "Pause exercise. Get urgent medical help.",
      message:
        "Chest pain or difficulty breathing, sudden severe pain, or new bladder / bowel changes with back symptoms need prompt medical evaluation. Use your local emergency service if severe or sudden.",
      blocked: true,
    };
  const concerning = profile.symptoms.some((s) =>
    [
      "Numbness or tingling",
      "Cannot bear weight",
      "Hot or red joint",
      "Fever",
      "Head injury symptoms",
    ].includes(s),
  );
  if (
    concerning ||
    (pain !== undefined && pain >= 7) ||
    profile.stage === "New or worsening"
  )
    return {
      level: "assessment" as const,
      title: "An assessment comes before a movement plan.",
      message:
        "New, severe, or worsening symptoms may need prompt medical attention. Pause exercise and contact a healthcare professional; a symptom checklist cannot rule out serious injury.",
      blocked: true,
    };
  const condition = conditions.find(
    (c) => c.area === profile.area && c.name === profile.condition,
  );
  if (
    condition?.care === "clinician-plan" ||
    profile.stage === "Post-surgery / protected healing"
  )
    return {
      level: "plan" as const,
      title: "Your clinician’s protocol leads the way.",
      message:
        condition?.note ||
        "Healing restrictions vary. Obtain an individual rehabilitation plan before starting movements here.",
      blocked: true,
    };
  if (condition?.care === "assessment" || (!condition && !!profile.condition))
    return {
      level: "assessment" as const,
      title: "Let’s understand the injury first.",
      message:
        condition?.note ||
        "This condition has no reviewed exercise pathway in the app. Record symptoms and get an assessment.",
      blocked: true,
    };
  if (profile.symptoms.some((s) => ["Swelling", "Weakness"].includes(s)))
    return {
      level: "assessment" as const,
      title: "Check in with a healthcare professional.",
      message:
        "Swelling or weakness can change which movements are appropriate. Get assessed before beginning a generic routine.",
      blocked: true,
    };
  return {
    level: "general" as const,
    title: "Explore movements cleared for you.",
    message:
      "These are general movement examples, not an injury-specific prescription. Your clinician chooses the movement, comfortable range, and dose. Stop if symptoms worsen.",
    blocked: false,
  };
}
export const sourceLinks = [
  {
    title: "NHS · Sitting exercises",
    url: "https://www.nhs.uk/live-well/exercise/sitting-exercises/",
    topic:
      "Seated hip march, ankle movement, chest opener, and upper-body turn",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Strength exercises",
    url: "https://www.nhs.uk/live-well/exercise/strength-exercises/",
    topic: "Supported strength movements and biceps curls",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Flexibility exercises",
    url: "https://www.nhs.uk/live-well/exercise/flexibility-exercises/",
    topic: "Comfortable neck movement, side bend, and calf stretch",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Balance exercises",
    url: "https://www.nhs.uk/live-well/exercise/balance-exercises/",
    topic: "Supported balance and walking examples",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Sprains and strains",
    url: "https://www.nhs.uk/conditions/sprains-and-strains/",
    topic: "Acute injury information and seeking assessment",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Knee pain",
    url: "https://www.nhs.uk/conditions/knee-pain/",
    topic: "Symptoms and when to get medical help",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Back pain",
    url: "https://www.nhs.uk/conditions/back-pain/",
    topic: "Staying active and urgent neurological symptoms",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Shoulder pain",
    url: "https://www.nhs.uk/conditions/shoulder-pain/",
    topic: "Comfortable movement and assessment advice",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Neck pain",
    url: "https://www.nhs.uk/conditions/neck-pain-and-stiff-neck/",
    topic: "Neck symptoms and when to seek assessment",
    verified: "2026-10-24",
  },
  {
    title: "NHS · Wrist pain",
    url: "https://www.nhs.uk/conditions/hand-pain/wrist-pain/",
    topic: "Gentle movement guidance and symptoms requiring assessment",
    verified: "2026-10-24",
  },
  {
    title: "AAOS · Knee conditioning",
    url: "https://orthoinfo.aaos.org/en/recovery/knee-conditioning-program/",
    topic: "Additional reference — page access still unavailable",
    verified: null,
  },
  {
    title: "AAOS · Shoulder conditioning",
    url: "https://orthoinfo.aaos.org/en/recovery/rotator-cuff-and-shoulder-conditioning-program/",
    topic: "Additional reference — page access still unavailable",
    verified: null,
  },
];
