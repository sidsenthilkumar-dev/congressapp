"""Fit research candidates from labelled video features. Never installs a model in Rebound."""
import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler

VERSION = "rebound-video-features-v1"
LABELS = {"acceptable", "torso", "elbow", "limb", "tempo", "other"}
FEATURES = ["primary_median", "primary_p10", "primary_p90", "primary_range", "secondary_median", "secondary_range", "torso_lean_median", "torso_lean_p90", "segment_drift_median", "primary_speed_median", "primary_speed_p90"]


def validate(rows):
    people, videos, ids = {}, {}, set()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Each row must be an object.")
        for key in ["clip_id", "participant_id", "exercise_id", "view", "family", "split", "label", "video_sha256"]:
            if not isinstance(row.get(key), str) or not row[key].strip():
                raise ValueError(f"Missing {key}.")
        if row["clip_id"] in ids:
            raise ValueError("Duplicate clip IDs.")
        ids.add(row["clip_id"])
        if row["split"] not in {"train", "validation", "test"} or row["label"] not in LABELS or row["view"] not in {"front", "side"} or row["family"] not in {"upper", "lower"}:
            raise ValueError("Unknown split, label, view, or feature family.")
        if row.get("rights", {}).get("trainingAllowed") is not True or not row["rights"].get("reference"):
            raise ValueError("Documented permission for the video data is required.")
        if row.get("pose_model") != "@mediapipe/pose@0.5.1675469404/full" or row.get("version") != VERSION or row.get("feature_names") != FEATURES:
            raise ValueError("Mixed or incompatible feature extractors.")
        for registry, key in [(people, row["participant_id"]), (videos, row["video_sha256"])]:
            if key in registry and registry[key] != row["split"]:
                raise ValueError("Participant or source-video leakage across data splits.")
            registry[key] = row["split"]
        if len(row["video_sha256"]) != 64 or any(c not in "0123456789abcdef" for c in row["video_sha256"]):
            raise ValueError("A SHA-256 source video hash is required.")
        if row.get("features") is not None:
            vector = np.asarray(row["features"], dtype=float)
            if vector.shape != (len(FEATURES),) or not np.isfinite(vector).all():
                raise ValueError("Non-finite or malformed feature vector.")
            quality = row.get("quality", {})
            if quality.get("usableFrames", 0) < 8 or not .8 <= quality.get("usableFraction", 0) <= 1:
                raise ValueError("Ineligible pose coverage must remain an abstention.")
    return rows


def probabilities(candidate, matrix):
    scaled = (np.asarray(matrix) - candidate["mean"]) / candidate["scale"]
    logits = scaled @ np.asarray(candidate["coefficients"]).T + candidate["intercepts"]
    if candidate["binary_one_logit"]:
        positive = 1 / (1 + np.exp(-np.clip(logits[:, 0], -40, 40)))
        return np.column_stack([1 - positive, positive])
    logits -= logits.max(axis=1, keepdims=True)
    exp = np.exp(logits)
    return exp / exp.sum(axis=1, keepdims=True)


def evaluate(candidate, rows):
    usable = [row for row in rows if row.get("features") is not None]
    labels = [row["label"] for row in usable]
    scores = probabilities(candidate, [row["features"] for row in usable])
    predictions = [candidate["classes"][index] for index in scores.argmax(axis=1)]
    accepted = scores.max(axis=1) >= candidate["abstention_threshold"]
    errors = np.array(labels) != "acceptable"
    alarms = np.array(predictions) != "acceptable"
    return {
        "clips_total": len(rows), "clips_with_usable_pose": len(usable),
        "clips_excluded_for_pose": len(rows) - len(usable),
        "automatic_decision_coverage_of_all_clips": float(accepted.sum() / len(rows)),
        "accepted_accuracy": float(np.mean(np.array(predictions)[accepted] == np.array(labels)[accepted])) if accepted.any() else None,
        "balanced_accuracy_on_usable_clips_before_abstention": float(balanced_accuracy_score(labels, predictions)),
        "automatic_missed_error_rate_on_usable_error_clips": float(np.mean((accepted & ~alarms)[errors])) if errors.any() else None,
        "automatic_false_alarm_rate_on_usable_acceptable_clips": float(np.mean((accepted & alarms)[~errors])) if (~errors).any() else None,
        "classes": candidate["classes"], "confusion_matrix_before_abstention": confusion_matrix(labels, predictions, labels=candidate["classes"]).tolist(),
        "per_class_before_abstention": classification_report(labels, predictions, labels=candidate["classes"], output_dict=True, zero_division=0),
        "note": "Scores are not clinically calibrated. Abstention is not evidence of correct form. These results do not establish injury prevention or iPhone performance.",
    }


def train(rows, threshold=.8):
    validate(rows)
    if not .5 <= threshold <= .99:
        raise ValueError("Use a predefined abstention threshold from 0.5 to 0.99.")
    cohorts = defaultdict(list)
    for row in rows:
        cohorts[(row["exercise_id"], row["view"], row["family"])].append(row)
    if not cohorts:
        raise ValueError("No labelled clips were supplied; no model was trained.")
    output = []
    for (exercise, view, family), cohort in sorted(cohorts.items()):
        partitions = {split: [r for r in cohort if r["split"] == split] for split in ["train", "validation", "test"]}
        usable = {split: [r for r in values if r.get("features") is not None] for split, values in partitions.items()}
        classes = sorted({r["label"] for r in usable["train"]})
        if "acceptable" not in classes or len(classes) < 2:
            raise ValueError(f"{exercise}: include acceptable form and at least one independently labelled error.")
        for split, minimum_people in [("train", 3), ("validation", 1), ("test", 2)]:
            if len({r["participant_id"] for r in usable[split]}) < minimum_people:
                raise ValueError(f"{exercise}: insufficient independent people in {split} (minimum {minimum_people}). These are pipeline floors, not clinical sample-size evidence.")
            counts = Counter(r["label"] for r in usable[split])
            if set(counts) != set(classes) or min(counts.values()) < 5:
                raise ValueError(f"{exercise}: every split needs at least five usable clips per class.")
        x = np.asarray([r["features"] for r in usable["train"]])
        y = [r["label"] for r in usable["train"]]
        scaler = StandardScaler().fit(x)  # Fit preprocessing on training people only.
        classifier = LogisticRegression(class_weight="balanced", max_iter=2000, random_state=42).fit(scaler.transform(x), y)
        candidate = {
            "deployment_status": "research_only_not_loaded_by_app", "version": VERSION, "pose_model": "@mediapipe/pose@0.5.1675469404/full",
            "data_rights_references": sorted({row["rights"]["reference"] for row in cohort}),
            "exercise_id": exercise, "view": view, "family": family,
            "classes": classifier.classes_.tolist(), "mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist(),
            "coefficients": classifier.coef_.tolist(), "intercepts": classifier.intercept_.tolist(),
            "binary_one_logit": len(classifier.classes_) == 2,
            "feature_names": FEATURES, "abstention_threshold": threshold,
            "score_calibration": "not_clinically_calibrated", "sklearn_version": sklearn.__version__,
        }
        # A portable JSON candidate must reproduce sklearn before it is saved.
        if not np.allclose(probabilities(candidate, x), classifier.predict_proba(scaler.transform(x)), atol=1e-10):
            raise ValueError("Portable candidate does not reproduce the fitted classifier.")
        candidate["validation"] = evaluate(candidate, partitions["validation"])
        candidate["held_out_test"] = evaluate(candidate, partitions["test"])
        candidate["people_per_split"] = {split: len({r["participant_id"] for r in values}) for split, values in partitions.items()}
        output.append(candidate)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("features", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--threshold", type=float, default=.8, help="Choose before inspecting held-out results.")
    args = parser.parse_args()
    source = args.features.read_bytes()
    rows = [json.loads(line) for line in source.decode().splitlines() if line.strip()]
    models = train(rows, args.threshold)
    args.output.write_text(json.dumps({"source_features_sha256": hashlib.sha256(source).hexdigest(), "models": models, "clinical_validation": "not established"}, indent=2, allow_nan=False) + "\n")
    args.output.chmod(0o600)
    print(f"Saved {len(models)} research candidate(s). No production model was installed.")


if __name__ == "__main__":
    main()
