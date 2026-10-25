import { useId } from "react";
import type { Exercise } from "../../domain/exercises";

/** Original direction-of-motion illustrations. Their timing is never a dose. */
export function EquipmentDemo({
  exercise,
  paused,
}: {
  exercise: Exercise;
  paused: boolean;
}) {
  const id = useId();
  const bandCurl = exercise.id === "band-curl";
  const row = exercise.type === "band-row";
  const hamstring = exercise.type === "hamstring";
  const motion = (from: string, to: string) =>
    paused ? null : (
      <animate
        attributeName="d"
        values={`${from};${from};${to};${to};${from}`}
        keyTimes="0;.12;.45;.6;1"
        dur="6s"
        repeatCount="indefinite"
      />
    );
  return (
    <div className="equipment-demo">
      <svg
        fill="none"
        viewBox="0 0 340 250"
        role="img"
        aria-label={`${exercise.name}: equipment movement illustration`}
      >
        <defs>
          <radialGradient id={id}>
            <stop stopColor="#d8e9c9" />
            <stop offset="1" stopColor="#f2f3eb" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="170" cy="124" r="120" fill={`url(#${id})`} />
        <path d="M65 224h220" stroke="#c7d1be" strokeWidth="3" />
        {hamstring ? (
          <>
            <path
              d="M112 145h72v77m-72-77v77"
              stroke="#abbba3"
              strokeWidth="5"
            />
            <path
              d="M151 139 196 156 247 218M151 139 149 181 143 215"
              stroke="#536e59"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g>
              <circle cx="149" cy="57" r="16" fill="#cca78b" />
              <path
                d="M150 84 151 139"
                stroke="#536e59"
                strokeWidth="26"
                strokeLinecap="round"
              />
              <path
                d="m151 91 26 23 22 17"
                stroke="#cca78b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {!paused && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 151 139;0 151 139;9 151 139;9 151 139;0 151 139"
                  dur="6s"
                  repeatCount="indefinite"
                />
              )}
            </g>
          </>
        ) : (
          <>
            <circle cx="156" cy="43" r="17" fill="#cca78b" />
            <path
              d="M157 75v66"
              stroke="#536e59"
              strokeWidth="28"
              strokeLinecap="round"
            />
            <path
              d="M153 142 140 181 132 218M162 142 176 181 183 218"
              stroke="#536e59"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {bandCurl ? (
              <>
                <path
                  d="M157 86 163 124 179 161"
                  stroke="#cca78b"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {motion("M157 86 163 124 179 161", "M157 86 163 124 190 96")}
                </path>
                <path d="M138 218 179 161" stroke="#ba8c50" strokeWidth="4">
                  {motion("M138 218 179 161", "M138 218 190 96")}
                </path>
              </>
            ) : row ? (
              <>
                <path d="M267 75v110" stroke="#a6b59d" strokeWidth="7" />
                <circle cx="267" cy="110" r="5" fill="#a6b59d" />
                <path
                  d="M160 84 197 100 227 110"
                  stroke="#cca78b"
                  strokeWidth="11"
                  strokeLinecap="round"
                >
                  {motion("M160 84 197 100 227 110", "M160 84 137 113 174 110")}
                </path>
                <path d="M267 110 227 110" stroke="#ba8c50" strokeWidth="4">
                  {motion("M267 110 227 110", "M267 110 174 110")}
                </path>
              </>
            ) : (
              <>
                <path
                  d="M157 82 178 117 200 148"
                  stroke="#cca78b"
                  strokeWidth="11"
                  strokeLinecap="round"
                >
                  {motion("M157 82 178 117 200 148", "M157 82 191 85 225 88")}
                </path>
                <path
                  d="M184 154 221 140"
                  stroke="#a88862"
                  strokeWidth="6"
                  strokeLinecap="round"
                >
                  {motion("M184 154 221 140", "M209 94 244 80")}
                </path>
              </>
            )}
          </>
        )}
        <text x="170" y="245" textAnchor="middle" fontSize="9" fill="#63735f">
          DIRECTION ONLY · YOUR CLINICIAN SETS RANGE &amp; DOSE
        </text>
      </svg>
    </div>
  );
}
