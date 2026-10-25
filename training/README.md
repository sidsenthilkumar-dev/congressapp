# Local video-form research workflow

This is research tooling, not a trained clinical model. No public patient footage has been downloaded, no human-video candidate has been fitted, and no candidate is loaded by the iPhone/web app. Current app behavior remains the existing pretrained pose model plus explicit rules. Read [the dataset research](../docs/VIDEO-DATASET-RESEARCH.md) before choosing footage.

## Data and rights first

Only use video with documented rights for the intended training use. Do not assume a repository's code license licenses the associated patient videos. Clinic upload permission does not authorize training. The example manifest deliberately has `trainingAllowed:false`; do not flip that until the actual rights are established. An entry records the rights reference; it cannot prove or grant legal permission itself.

Put downloaded/permission-cleared data under ignored `training/data/`. Raw footage, feature files, generated reports, and candidate weights must not be committed. Generated features can remain sensitive health-related data; pseudonymous participant IDs are not a promise of anonymity.

The manifest is a JSON file like `manifest.example.json`, placed next to its `videos/` directory. Supply an independently reviewed label and timestamps for each segment. Supported labels are `acceptable`, `torso`, `elbow`, `limb`, `tempo`, and `other`. These are mappings that a qualified reviewer must establish for each dataset/exercise; never label data from the app's existing heuristics and then claim independent validation. `acceptable` means acceptable for the reviewed movement/variation, not universally safe or clinically appropriate.

Use a consistent segment length and camera view within an exercise. Prefer fixed comparable windows or clinician-annotated rep segments; changing window lengths by class can create shortcuts. The tool permits 1–30 seconds, but that does not make every segmentation strategy scientifically valid. It extracts a segment summary, not a frame-by-frame clinical diagnosis or rep-count model.

Assign each participant to exactly one of `train`, `validation`, or `test` before fitting or tuning. Every recording/day/camera/augmentation of a person belongs in that split. Prefix participant IDs by dataset to avoid collisions. Byte-identical source video cannot cross splits either. Re-encoded or cropped duplicates require human audit: SHA-256 does not detect every derivative copy.

## Extract the app's pose model locally

Install the root application's locked dependencies (`npm ci`). Its postinstall prepares the local MediaPipe models. The extractor uses the pinned JS `@mediapipe/pose` full model (complexity 1) with the same detection/tracking thresholds as the app. A model/package change requires a reviewed feature-schema change. No remote model service, API key, microphone, or live camera is needed.

Use system Chromium through `CHROMIUM_PATH`, or the default `/usr/bin/chromium` on this cloud machine. On a Mac, set `CHROMIUM_PATH` to a compatible installed browser executable, such as `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, or to Playwright Chromium's executable after installing it.

```sh
node training/extract-videos.mjs training/data/manifest.json training/data/features.jsonl
```

This starts a temporary loopback-only file server, opens videos in an automated browser, resets the pose graph for every segment, samples at 10 fps, and writes angle/lean/motion features plus quality metadata. Browser requests outside that local server are blocked. File paths cannot escape the manifest directory. A video codec the browser cannot decode must be converted locally; renaming an extension is insufficient. Keep any original rights records and annotation mapping.

The `upper` feature family requires visible shoulders, the selected hip, elbow, and wrist; `lower` requires shoulders, the selected hip, knee, and ankle. Side/view are supplied metadata, not automatically verified truth. At least eight usable samples and 80% visible-pose coverage are required for a feature vector. Insufficient pose remains a null-feature row rather than disappearing from evaluation. Invisible joints do not become zero-valued fake measurements.

On a headless machine without usable hardware graphics, set `REBOUND_TRAINING_SOFTWARE_GPU=1` for Chromium's software graphics backend. This was used to check the real extractor with a generated solid-color video. It correctly produced an insufficient-pose result; that test contains no person and establishes no human accuracy.

## Fit and evaluate a research candidate

Use Python 3.12 and a separate virtual environment:

```sh
python3 -m venv training/.venv
training/.venv/bin/python -m pip install -r training/requirements.txt
mkdir -p training/artifacts
training/.venv/bin/python training/train_models.py training/data/features.jsonl training/artifacts/candidates.json
```

The baseline is standardized logistic regression, fitted separately for each exercise/view/family. Preprocessing fits on training people only. It requires acceptable form plus an independently labeled error, at least 3 training people, 1 validation person, 2 test people, and at least 5 usable clips of every class in each split. **These are pipeline sanity floors, not an adequate clinical sample-size calculation.** More realistic samples and independent device/site evaluation are needed before deployment.

The abstention threshold defaults to 0.8 and must be chosen before inspecting held-out test results. Scores are not clinically calibrated probabilities. Reports expose accepted-decision coverage, missed errors, false alarms, per-class confusion, and poor-pose exclusions. A high score on a tiny or narrow subset does not justify an accuracy claim for all users/exercises. Validation and test reports are separate; do not repeatedly tune on test participants.

Candidate files are JSON, with explicit feature order, model/version metadata, scaling and coefficients, and `deployment_status:research_only_not_loaded_by_app`. Portable inference is checked against sklearn. The script does not install a model, alter app thresholds, diagnose injuries, establish rep accuracy, or claim that the model can prevent harm. Review the error taxonomy, allowed movement variations, uncertainty/abstention behavior, exercise-specific results, and real-iPhone latency with qualified reviewers before considering integration.

## Check the tooling

```sh
node --test training/tests/features.test.mjs
python3 -m unittest discover -s training/tests -v
```

These tests use synthetic numeric fixtures to verify grouping, rights gates, preprocessing, serialization, and evaluation accounting. They are software checks and must never be presented as accuracy measured on people or real exercise videos.

## Exercise and equipment inventory

Run `node training/catalog-readiness.mjs` from the repository root to regenerate `docs/TRACKING-READINESS.json`. It lists every guide, its current experimental or mirror/manual mode, observable motion, equipment blind spots, and missing exercise-specific human validation. This command audits coverage; it does not train a model. Band curl, band row, and assisted dowel movements need their own permission-cleared, independently labeled evaluation footage. Sharing an angular-motion rule with an unbanded exercise does not validate equipment use or resistance.
