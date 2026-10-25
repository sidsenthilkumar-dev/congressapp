# Video training and feature research for Rebound

Research checked October 25, 2026. Goal: improve useful feedback for Rebound's specific clinician-cleared movements, then validate it on people and iPhones. No new model trained on human exercise videos is claimed or deployed. This report separates verified primary-source descriptions, unverified access/license details, and product proposals.

## Dataset findings

| Candidate | What the primary source actually supports | Fit for Rebound | Current decision |
| --- | --- | --- | --- |
| **KERAAL** | Authors describe RGB video, Kinect/Vicon and estimated skeletons, with correctness/error/body-part/timing annotations for three low-back rehabilitation exercises. The introduction describes 9 healthy people and 12 patients; only subsets have expert annotations. | Best candidate here for studying clinically annotated error feedback. Three low-back exercises do not automatically map to Rebound's 22 guides or eight tracking protocols. Clinic cameras/resolutions also differ from iPhones. | Investigate first. The accompanying software is BSD-2-Clause, but the separate video-data terms/download site could not be verified from this environment. No footage downloaded or assumed licensed for a paid app. |
| **Fitness-AQA** | Authors cover back squat, overhead press, and barbell row. Dataset access requires a request; README explicitly limits use to non-commercial purposes. | Useful exercise-quality research, but heavy gym movements differ from supported mini-squats, assisted movements, and injured users' individual variations. | Do not treat as commercially cleared training data or relabel its movements as Rebound rehab movements. Access/permission must be resolved first. |
| **OpenCap** | Official code estimates 3D kinematics from two or more videos, with a separate processing system. | Useful reference/evaluation direction for motion measurement. It does not provide a verified single-phone good/bad-form label set for this app. Multi-camera hardware/cloud workflow differs from current Expo/WKWebView coaching. | A potential comparison tool under its actual applicable terms, not a drop-in rep/form model or dataset license. |
| **UI-PRMD / KIMORE** | Primary dataset pages were blocked by the network proxy. A KIMORE wrangling repository was accessible, but it is a secondary source and does not establish dataset permissions. | Worth further investigation for rehabilitation benchmarking. | Access, labels, exercise mapping, and raw-data permissions remain unverified; not selected for training based on mirrors. |
| **NS-AQA** | Official repository states non-commercial use and implements platform-diving quality assessment. | Interesting explainable-error research, with a substantial activity/domain mismatch. | Not a rehab training corpus for Rebound. |

KERAAL is a stronger research lead than indiscriminately collecting workout videos. It still needs actual data rights, exercise-by-exercise mapping, annotation review, and held-out testing. The authors' description of informed consent for their study does not automatically establish every downstream use. Code/data permissions must be checked separately. A congressional prototype and a future paid release may have different applicable permissions; do not assume one authorization covers both.

## What “accuracy” must mean

Google's MediaPipe documentation reports pose-landmark benchmarks on Yoga, Dance, and HIIT images, with one person about 2–4 meters away. Those metrics measure landmark localization. They are **not** the probability that Rebound recognizes bad rehab form, counts an injured user's reps correctly, or prevents injury. Do not reuse a published pose percentage as this app's accuracy.

Measure at least the following separately for each supported movement and camera view:

- Rep count error compared with a human-reviewed count.
- Missed errors, incorrect “form problem” alerts, and which specific error types are recognized.
- How often the system abstains because it cannot see enough; include those clips in coverage reporting.
- Acceptable clinician-taught modifications that must not be mislabeled as bad form.
- Device latency and reliability on actual iPhones, plus lighting, framing, clothing, occlusion, equipment, and body diversity.

Keep all videos/days/augmentations from a participant in one split. Otherwise, a model can recognize the person/camera setup and appear accurate on familiar recordings. Fit scaling and classifier weights on training people, use different people for validation, and keep a separate test cohort. An independent iPhone collection is still needed even if performance is good on a public clinic dataset. No single global accuracy percentage is warranted at present.

## Concrete training preparation delivered

`training/` now contains a local video-to-pose feature extractor, a rights/manifest gate, participant/source-video leakage checks, a per-exercise/view classifier baseline, and held-out reports. Inadequate pose is recorded as an abstention. Candidate artifacts are explicitly research-only and are never loaded into the app automatically. The actual pose runtime was exercised on a generated no-person video and correctly returned insufficient pose. Synthetic numerical tests verify the software pipeline; they are not clinical/video accuracy results.

The remaining blocker is suitable raw footage with verified intended-use rights and reviewed labels matching a supported movement. There is no lawful/appropriate production corpus available in this checkout yet. No access form was submitted, author contacted, paid service enrolled, or clinic footage repurposed.

## Feature priorities that would improve the app

These are product recommendations, not claims that a study proved Rebound improves recovery. Prioritize a complete, understandable care loop over an ever-growing unreviewed exercise list.

| Priority | Feature proposal | Why it fits this app | Scope / honest limit |
| --- | --- | --- | --- |
| **1** | **Optional hands-free voice and haptic cues** | People exercising away from their phone should not have to turn their head to read a correction or break timer. | Short cues, immediate mute, repetition limits, and no microphone requirement. Prefer device-local speech where available; MDN distinguishes local from remote voices. Test on physical iPhones. This is proposed, not newly implemented here. |
| **2** | **“Why a rep was missed” session recap** | Distinguish a hidden wrist, camera angle, fast cycle, incomplete visible return, and manual correction. This gives the user an actionable setup improvement. | Record factual tracking events locally; do not score healing, count every rejected cycle as bad form, or ask someone to force a larger range. Existing live warnings provide the event sources; a recap UI is still to build. |
| **3** | **Clinician review queue with replies** | Turn an uploaded clip into a clear workflow: uploaded, awaiting review, clinician comment, updated instructions. | Current Clinic supports plans and explicit private uploads. Replies, review assignment/status, and notifications need authenticated backend changes. Never mark “reviewed” merely because an upload succeeded. |
| **4** | **Before/after-session comfort and effort check-ins** | Help the user and clinician discuss how a specific session felt, instead of only a daily journal entry. | Self-report, not diagnosis. Show changes factually and offer clinician contact/appropriate help for concerning symptoms. Do not autonomously increase resistance or prescribe a treatment progression. |
| **5** | **Clinician-approved movement variations** | A supported seated version or deliberately bent elbow can be valid; comparing everyone with one healthy-person template creates false alerts. | Store individual written restrictions/variation and choose a reviewed protocol or manual mode. Do not promise camera goniometry or infer a safe range from a generic demonstration. |
| **6** | **Production onboarding and offline lesson access** | A polished release should open directly to the user's plan, with clear service availability, rather than asking ordinary users for a server address. Cached guides help when connectivity is poor. | The current server field is a development setup. A production HTTPS host/configuration is required; offline caching/native bundling is separate work. Clinic exchange and AI calls cannot be promised offline. |

The highest-value next implementation slice is **hands-free cues + an honest session recap**, followed by clinician replies once the service is configured. The current camera screen, pause/rest controls, clinician plan import, and privacy-first clip review are a useful base. Avoid adding automatic injury diagnosis, unvalidated “safe form” badges, a fabricated recovery percentage, or training on private clips without separate permission.

## Primary sources and access evidence

1. [KERAAL authors' repository](https://github.com/nguyensmai/KeraalDataset), [README](https://raw.githubusercontent.com/nguyensmai/KeraalDataset/main/README.md), [software license](https://github.com/nguyensmai/KeraalDataset/blob/main/LICENSE), [data-format documentation](https://github.com/nguyensmai/KeraalDataset/blob/main/doc/readme_files_format.txt): fetched and read successfully. Separate [dataset site](https://nguyensmai.free.fr/KeraalDataset.html) was proxy-blocked. The introduction and later annotation descriptions differ in level of detail; this report does not treat all recordings as expert-labelled.
2. [Fitness-AQA authors' README](https://github.com/ParitoshParmar/Fitness-AQA): fetched/read. The request link and non-commercial restriction are explicit. The separate PDF license was not fully reviewed; do not infer further permissions from this summary.
3. [OpenCap official core README](https://github.com/opencap-org/opencap-core): fetched/read. No claim is made that its software terms license every underlying video/session or every commercial service use.
4. [NS-AQA authors' README](https://github.com/laurenok24/NSAQA): fetched/read; platform diving and non-commercial terms are explicit.
5. [MediaPipe Pose documentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md): fetched/read for landmark topology, model settings, and benchmark scope.
6. [scikit-learn grouped cross-validation documentation](https://github.com/scikit-learn/scikit-learn/blob/main/doc/modules/cross_validation.rst): fetched/read for independent subject grouping and leakage concerns.
7. [NHS physiotherapy](https://www.nhs.uk/tests-and-treatments/physiotherapy/) and [NHS strength exercises](https://www.nhs.uk/live-well/exercise/strength-exercises/): fetched/read. These support the importance of symptoms, medical history, professional assessment/instructions, and home exercise. They do not validate Rebound's product ideas or equipment adaptations.
8. [MDN SpeechSynthesis](https://github.com/mdn/content/blob/main/files/en-us/web/api/speechsynthesis/index.md) and [localService](https://github.com/mdn/content/blob/main/files/en-us/web/api/speechsynthesisvoice/localservice/index.md): fetched/read. Feasibility rationale for optional local voice cues, not proof of clinical benefit or iPhone support in this app.
9. [W3C target-size explanation](https://github.com/w3c/wcag/blob/main/understanding/22/target-size-minimum.html): fetched/read. Minimum target size/spacing matters for users with dexterity limits; key exercise controls should be comfortably larger than the minimum.

Official UI-PRMD, IEEE DataPort KIMORE, UCI, and several competitor product sites were proxy-blocked. GitHub discovery search also hit a rate limit; it was not repeatedly retried. This is a focused source review, not a systematic clinical review or verified competitor feature/pricing audit.
