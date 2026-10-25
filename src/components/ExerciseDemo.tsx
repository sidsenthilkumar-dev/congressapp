import { useEffect, useId, useState } from "react";
import type { Exercise } from "../domain/exercises";
import { MotionGuide } from "../features/movement/MotionGuide";
import { EquipmentDemo } from "../features/movement/EquipmentDemo";
function useMotionPreference() {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return !reduced;
}
function Limb({
  from,
  to,
  skin = false,
  animate = true,
}: {
  from: string;
  to?: string;
  skin?: boolean;
  animate?: boolean;
}) {
  return (
    <path
      d={from}
      fill="none"
      stroke={skin ? "#c9a386" : "#526e59"}
      strokeWidth={skin ? 11 : 16}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {to && animate && (
        <animate
          attributeName="d"
          values={`${from};${from};${to};${to};${from}`}
          keyTimes="0;.12;.45;.58;1"
          dur="5s"
          repeatCount="indefinite"
        />
      )}
    </path>
  );
}
export function ExerciseDemo({
  exercise,
  compact = false,
  paused = false,
}: {
  exercise: Exercise;
  compact?: boolean;
  paused?: boolean;
}) {
  const motionAllowed = useMotionPreference();
  const animate = motionAllowed && !paused;
  const id = useId();
  const kind = exercise.type;
  if (
    ["band-curl", "band-row", "dowel-flexion", "seated-hamstring"].includes(
      exercise.id,
    )
  )
    return <EquipmentDemo exercise={exercise} paused={!animate} />;
  if (["knee", "curl", "shoulder", "ankle"].includes(kind))
    return <MotionGuide kind={kind} compact={compact} paused={paused} />;
  const seated = [
    "hip-march",
    "seated-twist",
    "chest-opener",
    "neck-turn",
    "sit-stand",
  ].includes(kind);
  const squat = kind === "mini-squat";
  const sitStand = kind === "sit-stand";
  const calf = kind === "calf-raise";
  const torsoMove = calf
    ? "0 -9"
    : squat
      ? "0 19"
      : sitStand
        ? "0 -24"
        : kind === "side-bend"
          ? "12 0"
          : "0 0";
  return (
    <div className={"exercise-demo " + (compact ? "compact" : "")}>
      <svg
        fill="none"
        viewBox="0 0 320 240"
        role="img"
        aria-label={`${exercise.name}: illustrated movement guide`}
      >
        <defs>
          <radialGradient id={id}>
            <stop stopColor="#d7e7bf" stopOpacity=".65" />
            <stop offset="1" stopColor="#ecf0e4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="160" cy="120" r="110" fill={`url(#${id})`} />
        <ellipse
          cx="165"
          cy="218"
          rx="95"
          ry="7"
          fill="#5e7c4c"
          opacity=".09"
        />
        {seated && (
          <path
            d="M118 126v87m0-75h87v75"
            fill="none"
            stroke="#acb99f"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
        {!seated &&
          [
            "hip-abduction",
            "hip-extension",
            "calf-raise",
            "single-leg",
            "mini-squat",
          ].includes(kind) && (
            <path
              d="M76 83v130m0-110h39v110"
              fill="none"
              stroke="#acb99f"
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
        {["wall-press", "calf-stretch"].includes(kind) && (
          <path
            d="M253 32v184"
            stroke="#b2bea8"
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        {kind === "tandem-walk" ? (
          <>
            <path d="M80 179h167" stroke="#a4b88c" strokeDasharray="5 7" />
            <g className="walking-steps">
              <ellipse
                cx="109"
                cy="164"
                rx="12"
                ry="23"
                fill="#668565"
                transform="rotate(65 109 164)"
              />
              <ellipse
                cx="158"
                cy="184"
                rx="12"
                ry="23"
                fill="#91a77c"
                transform="rotate(65 158 184)"
              />
              <ellipse
                cx="207"
                cy="164"
                rx="12"
                ry="23"
                fill="#a6b690"
                transform="rotate(65 207 164)"
              />
            </g>
            <path
              d="m225 135 12 12-12 12"
              fill="none"
              stroke="#92a87a"
              strokeWidth="2"
            />
            <text x="85" y="102" fill="#8da17b" fontSize="9" letterSpacing="1">
              SLOW STEPS · SUPPORT NEARBY
            </text>
          </>
        ) : (
          <>
            <g>
              {animate && torsoMove !== "0 0" && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`0 0;0 0;${torsoMove};${torsoMove};0 0`}
                  keyTimes="0;.12;.45;.58;1"
                  dur="5s"
                  repeatCount="indefinite"
                />
              )}
              <circle cx="154" cy="42" r="16" fill="#c9a386" />
              <path
                d="M151 65v66"
                stroke="#69856c"
                strokeWidth="29"
                strokeLinecap="round"
              />
              {kind === "neck-turn" && (
                <path
                  d="M160 41h9"
                  stroke="#9a7459"
                  strokeWidth="4"
                  strokeLinecap="round"
                >
                  {animate && (
                    <animate
                      attributeName="d"
                      values="M160 41h9;M140 41h-9;M160 41h9"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
              )}
              {kind === "wall-press" ? (
                <Limb
                  from="M165 78 208 89 248 87"
                  to="M165 78 190 106 248 87"
                  skin
                  animate={animate}
                />
              ) : kind === "calf-stretch" ? (
                <Limb from="M164 79 210 78 247 73" skin />
              ) : kind === "chest-opener" ? (
                <>
                  <Limb
                    from="M137 77 112 108 100 133"
                    to="M137 77 104 81 73 78"
                    skin
                    animate={animate}
                  />
                  <Limb
                    from="M166 77 189 108 199 133"
                    to="M166 77 202 81 233 78"
                    skin
                    animate={animate}
                  />
                </>
              ) : kind === "seated-twist" ? (
                <>
                  <Limb
                    from="M137 79 157 104 171 79"
                    to="M137 79 147 104 161 79"
                    skin
                    animate={animate}
                  />
                  <Limb
                    from="M169 79 148 104 132 79"
                    to="M169 79 138 104 122 79"
                    skin
                    animate={animate}
                  />
                </>
              ) : (
                <>
                  <Limb
                    from={
                      seated
                        ? "M136 78 123 109 123 132"
                        : "M136 78 104 87 80 88"
                    }
                    skin
                  />
                  <Limb
                    from={
                      seated
                        ? "M168 78 180 109 180 132"
                        : "M167 78 179 117 183 145"
                    }
                    skin
                  />
                </>
              )}
            </g>
            {seated ? (
              <>
                <Limb
                  from="M148 134 181 142 184 205"
                  to={
                    kind === "hip-march"
                      ? "M148 134 184 119 200 177"
                      : sitStand
                        ? "M148 110 163 154 180 205"
                        : undefined
                  }
                  animate={animate}
                />
                <Limb
                  from="M146 135 151 161 148 205"
                  to={sitStand ? "M146 110 139 155 138 205" : undefined}
                  animate={animate}
                />
              </>
            ) : (
              <>
                <Limb
                  from="M140 136 132 170 127 207"
                  to={
                    squat
                      ? "M140 155 111 174 127 207"
                      : kind === "hip-extension"
                        ? "M140 136 117 170 96 201"
                        : kind === "calf-stretch"
                          ? "M140 136 102 175 78 208"
                          : undefined
                  }
                  animate={animate}
                />
                <Limb
                  from="M162 136 174 170 184 207"
                  to={
                    squat
                      ? "M162 155 190 174 184 207"
                      : kind === "hip-abduction"
                        ? "M162 136 196 163 226 187"
                        : kind === "single-leg"
                          ? "M162 136 194 151 183 181"
                          : kind === "calf-stretch"
                            ? "M162 136 200 165 203 207"
                            : undefined
                  }
                  animate={animate}
                />
              </>
            )}
            <circle
              cx={
                kind === "hip-march"
                  ? 148
                  : kind === "neck-turn"
                    ? 154
                    : kind === "chest-opener"
                      ? 138
                      : kind === "calf-raise"
                        ? 184
                        : 151
              }
              cy={
                kind === "neck-turn"
                  ? 61
                  : kind === "chest-opener"
                    ? 77
                    : kind === "calf-raise"
                      ? 207
                      : 134
              }
              r="6"
              fill="#d8e8b9"
              stroke="#8da772"
              strokeWidth="1.5"
            />
          </>
        )}
        {!compact && (
          <text
            x="160"
            y="235"
            textAnchor="middle"
            fill="#8e9f80"
            fontSize="8"
            letterSpacing=".3"
          >
            Illustration · use your clinician’s comfortable range
          </text>
        )}
      </svg>
    </div>
  );
}
