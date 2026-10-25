import { ArrowRight, Check, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useState, useId, type ReactNode } from "react";
import type { Correction } from "../../domain/tracking";
export type { Correction } from "../../domain/tracking";
export const correctionText: Record<
  Correction,
  { title: string; detail: string; steps: string[] }
> = {
  limb: {
    title: "Pause and review your limb position.",
    detail:
      "The camera estimates an unexpected bend in this movement. Check the illustration and your individual instructions before resuming.",
    steps: [
      "Pause and reset without forcing a joint straight.",
      "Follow your clinician’s prescribed variation and range.",
      "Use manual counting when your movement differs from the illustration.",
    ],
  },
  torso: {
    title: "Stack your shoulders over your hips.",
    detail:
      "The camera estimates that your torso is leaning. Pause, reset, and reduce your range if needed.",
    steps: [
      "Keep your trunk comfortably upright.",
      "Use a smaller, pain-free range.",
      "Resume only when the position feels comfortable.",
    ],
  },
  elbow: {
    title: "Let your elbow stay by your side.",
    detail:
      "Your upper arm appears to be drifting. The movement should come from your elbow.",
    steps: [
      "Relax your shoulder.",
      "Keep your upper arm close to your ribs.",
      "Bend and straighten slowly, without swinging.",
    ],
  },
  visibility: {
    title: "Give your joints a little room.",
    detail:
      "The camera needs a clear view of the working joints before it can count.",
    steps: [
      "Step back until the highlighted joints fit.",
      "Keep the camera steady at joint height.",
      "Use bright, even lighting and avoid backlighting.",
    ],
  },
  position: {
    title: "Turn to match your camera guide.",
    detail: "A clear camera angle makes joint-angle estimates more reliable.",
    steps: [
      "Knee extensions and curls: turn side-on.",
      "Side raises: face the camera.",
      "Keep the full working limb visible.",
    ],
  },
  tempo: {
    title: "Slow it down. Stay in control.",
    detail:
      "A quick movement can be difficult to track. Use an easy, controlled pace.",
    steps: [
      "Avoid swinging or bouncing.",
      "Move out, then return with control.",
      "Follow your clinician’s range and pace.",
    ],
  },
};
export function MotionGuide({
  kind = "knee",
  correction,
  compact = false,
  paused = false,
}: {
  kind?: string;
  correction?: Correction;
  compact?: boolean;
  paused?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const arm =
    correction === "elbow" ||
    kind === "curl" ||
    kind === "wrist" ||
    kind === "hand";
  const knee =
    correction !== "elbow" &&
    (kind === "knee" || kind === "ankle" || kind === "foot");
  return (
    <div
      className={
        "motion-scene " +
        (compact ? "compact " : "") +
        (correction ? "correction-motion " : "") +
        (paused ? " is-static" : "")
      }
    >
      <svg
        fill="none"
        viewBox="0 0 380 245"
        role="img"
        aria-label={
          "Animated " +
          (correction ? correction + " correction" : kind + " movement guide")
        }
      >
        <defs>
          <linearGradient
            id={"body-" + uid}
            gradientUnits="userSpaceOnUse"
            x1="140"
            y1="40"
            x2="220"
            y2="170"
          >
            <stop stopColor="#789b83" />
            <stop offset="1" stopColor="#395c49" />
          </linearGradient>
          <radialGradient id={"glow-" + uid}>
            <stop stopColor="#d4e7b4" stopOpacity=".6" />
            <stop offset="1" stopColor="#d4e7b4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="191" cy="220" rx="110" ry="9" fill="#ced8c6" />
        <circle cx="194" cy="125" r="109" fill={"url(#glow-" + uid + ")"} />
        {knee ? (
          <>
            <path
              d="M129 135v78m0-65h72v65"
              stroke="#abb9a4"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g
              className={
                correction === "torso" ? "correcting-torso seated-torso" : ""
              }
            >
              <circle cx="163" cy="45" r="17" fill="#c99e82" />
              <path
                d="M156 71L151 137l43 10"
                stroke={"url(#body-" + uid + ")"}
                strokeWidth="28"
                strokeLinecap="round"
              />
              <path
                d="M163 86l18 37 25 5"
                stroke="#c99e82"
                strokeWidth="11"
                strokeLinecap="round"
              />
            </g>
            <path
              d="M183 149l4 57 20 5"
              stroke="#43604c"
              strokeWidth="17"
              strokeLinecap="round"
            />
            <g
              className={
                kind === "ankle" || kind === "foot"
                  ? "ankle-leg"
                  : "moving-knee"
              }
            >
              <path
                d="M196 149l1 57 22 5"
                stroke="#43604c"
                strokeWidth="17"
                strokeLinecap="round"
              />
              <circle
                cx="196"
                cy="149"
                r="8"
                fill="#d9ebad"
                stroke="#6c8850"
                strokeWidth="2"
              />
              <path
                d="M198 205l23 5"
                className="moving-foot"
                stroke="#9fb782"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </g>
            <path
              d="M238 172q27-18 24-46"
              stroke="#9dad86"
              strokeWidth="2"
              strokeDasharray="4 5"
              fill="none"
            />
            <path
              d="M256 132l6-8 5 8"
              stroke="#9dad86"
              strokeWidth="2"
              fill="none"
            />
          </>
        ) : (
          <>
            <g className={correction === "torso" ? "correcting-torso" : ""}>
              <circle cx="185" cy="39" r="17" fill="#c99e82" />
              <path
                d="M185 68v73"
                stroke={"url(#body-" + uid + ")"}
                strokeWidth="35"
                strokeLinecap="round"
              />

              {arm ? (
                <>
                  <path
                    d="M173 76l-12 54"
                    stroke="#c99e82"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <g className="moving-forearm">
                    <path
                      d="M161 130l0 55"
                      stroke="#c99e82"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="161"
                      cy="130"
                      r="8"
                      fill="#d9ebad"
                      stroke="#6c8850"
                      strokeWidth="2"
                    />
                    <circle cx="161" cy="185" r="5" fill="#d4e5bf" />
                  </g>
                  <path
                    d="M202 75l13 54"
                    stroke="#c99e82"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <g className="moving-left-arm">
                    <path
                      d="M168 77l-13 47-8 37"
                      stroke="#c99e82"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                  </g>
                  <g className="moving-right-arm">
                    <path
                      d="M203 77l13 47 8 37"
                      stroke="#c99e82"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                  </g>
                  <circle
                    cx="168"
                    cy="77"
                    r="7"
                    fill="#d9ebad"
                    stroke="#6c8850"
                    strokeWidth="2"
                  />
                  <circle
                    cx="203"
                    cy="77"
                    r="7"
                    fill="#d9ebad"
                    stroke="#6c8850"
                    strokeWidth="2"
                  />
                </>
              )}
            </g>
            <path
              d="M174 145l-12 65m35-65 14 65"
              stroke="#43604c"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M153 217h18m32 0h18"
              stroke="#e9eadb"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </>
        )}
        <g className="motion-joint-label">
          <path
            d={knee ? "M214 148h68" : arm ? "M173 130h92" : "M215 77h67"}
            stroke="#9eae8b"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={knee ? 287 : arm ? 270 : 287}
            y={knee ? 152 : arm ? 134 : 81}
            fill="#7b8f69"
            fontSize="9"
            fontFamily="sans-serif"
          >
            {knee ? "KNEE" : arm ? "ELBOW" : "SHOULDER"}
          </text>
        </g>
      </svg>
      <span className="motion-caption">
        <span />{" "}
        {correction
          ? "Reset · align · move gently"
          : "Slow, controlled movement"}{" "}
        <span className="motion-cycle">↻</span>
      </span>
    </div>
  );
}
function ElbowAdjustment() {
  return (
    <div className="joint-detail">
      <svg
        fill="none"
        viewBox="0 0 300 205"
        role="img"
        aria-label="Animated elbow close-up showing a steady upper arm and slow forearm movement"
      >
        <defs>
          <radialGradient id="elbow-detail-glow">
            <stop stopColor="#dfedc9" />
            <stop offset="1" stopColor="#f8fbf3" />
          </radialGradient>
          <linearGradient
            id="elbow-skin"
            gradientUnits="userSpaceOnUse"
            x1="120"
            y1="30"
            x2="175"
            y2="170"
          >
            <stop stopColor="#bd9579" />
            <stop offset="1" stopColor="#d8b998" />
          </linearGradient>
        </defs>
        <ellipse
          cx="151"
          cy="113"
          rx="100"
          ry="85"
          fill="url(#elbow-detail-glow)"
        />
        <path
          className="drift-ghost"
          d="M179 38l18 66 31 57"
          stroke="#c5b8a0"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="2 5"
          opacity=".3"
        />
        <path
          d="M142 39v66"
          stroke="url(#elbow-skin)"
          strokeWidth="27"
          strokeLinecap="round"
        />
        <path
          d="M141 42v56"
          stroke="#f1dac1"
          strokeWidth="4"
          strokeLinecap="round"
          opacity=".6"
        />
        <g className="detailed-forearm">
          <path
            d="M142 104v67"
            stroke="url(#elbow-skin)"
            strokeWidth="23"
            strokeLinecap="round"
          />
          <path
            d="M141 111v48"
            stroke="#f1dac1"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".6"
          />
          <ellipse cx="142" cy="179" rx="10" ry="15" fill="#ceb191" />
        </g>
        <circle cx="142" cy="104" r="17" fill="#e1edc6" opacity=".6" />
        <circle
          cx="142"
          cy="104"
          r="9"
          fill="#d6e8b2"
          stroke="#819c60"
          strokeWidth="2"
        />
        <circle
          cx="142"
          cy="104"
          r="24"
          stroke="#a1b985"
          strokeWidth="1"
          strokeDasharray="3 4"
          fill="none"
        />
        <path d="M170 102h57" stroke="#a6b88f" strokeDasharray="3 3" />
        <text x="231" y="105" fontSize="8" fill="#819569">
          ELBOW
        </text>
        <path
          d="M186 149q22-9 20-31m-5 6 5-8 6 7"
          fill="none"
          stroke="#a4ba86"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x="83" y="17" fontSize="7" letterSpacing="1.4" fill="#91a57b">
          STEADY ARM · SLOW MOVEMENT
        </text>
      </svg>
    </div>
  );
}
export function CorrectionPanel({
  kind,
  correction,
  preview = false,
  onClose,
  illustration,
}: {
  kind: string;
  correction: Correction;
  preview?: boolean;
  onClose: () => void;
  illustration?: ReactNode;
}) {
  const content = correctionText[correction];
  return (
    <aside
      className="correction-panel"
      aria-label={preview ? "Form correction preview" : "Movement correction"}
      role="status"
    >
      <div className="correction-top">
        <span className="correction-symbol">
          <RotateCcw size={17} />
        </span>
        <div>
          <small>
            {preview
              ? "GUIDANCE PREVIEW · NOT A CAMERA FINDING"
              : "LET’S MAKE A SMALL ADJUSTMENT"}
          </small>
          <h3>{content.title}</h3>
        </div>
        <button aria-label="Dismiss correction" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="correction-content">
        {illustration ??
          (correction === "elbow" ? (
            <ElbowAdjustment />
          ) : (
            <MotionGuide kind={kind} correction={correction} compact />
          ))}
        <div>
          <p>{content.detail}</p>
          <ol>
            {content.steps.map((s) => (
              <li key={s}>
                <Check size={12} />
                {s}
              </li>
            ))}
          </ol>
          <span className="correction-note">
            <ShieldCheck size={12} />
            Movement estimate, not a medical assessment
          </span>
        </div>
      </div>
    </aside>
  );
}
export function CorrectionPreview({ kind }: { kind: string }) {
  const [preview, setPreview] = useState<Correction | null>(null);
  return (
    <div className="correction-preview">
      <div>
        <span>
          <span className="tiny-dot" /> SEE HOW COACHING WORKS
        </span>
        <button
          onClick={() =>
            setPreview(preview ? null : kind === "curl" ? "elbow" : "torso")
          }
        >
          {preview ? "Hide animation" : "Preview form guidance"}
          <ArrowRight size={14} />
        </button>
      </div>
      {preview && (
        <>
          <div className="correction-tabs">
            {(["torso", "elbow", "visibility"] as Correction[]).map((c) => (
              <button
                className={preview === c ? "selected" : ""}
                key={c}
                onClick={() => setPreview(c)}
              >
                {c === "torso"
                  ? "Torso alignment"
                  : c === "elbow"
                    ? "Elbow position"
                    : "Camera framing"}
              </button>
            ))}
          </div>
          <CorrectionPanel
            kind={kind}
            correction={preview}
            preview
            onClose={() => setPreview(null)}
          />
        </>
      )}
    </div>
  );
}
