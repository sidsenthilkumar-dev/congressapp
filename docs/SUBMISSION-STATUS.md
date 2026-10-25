# Rebound submission status

The iPhone home includes a schedule-based weekly routine goal, reminder shortcut, actual session history, and recovery focus. The website presentation is preserved. Native Recovery/Coach screens share saved app data with the focused guided sessions and Clinic screens.

## Camera demonstration

Use a stable HTTPS website, or run `npm run iphone -- --https` for a temporary public static preview and scan the Expo Go QR code. Approve the host camera permission, review the camera setup, and demonstrate the two slow practice cycles within a cleared movement range. The camera fills the phone view with a large counter, correction illustrations, explicit pause/exit, inactivity pause, and set breaks. Camera coaching does not automatically record or upload video. Separate Clinic recording requires explicit review and sharing.

The HTTPS launcher’s startup, timeout, cancellation, and disconnect logic has automated tests. Cloudflared 2026.10.3 was downloaded and its CLI flag handling was checked without opening a public tunnel. External tunnel availability, physical iPhone behavior, and clinical performance are separate checks. Temporary tunnel origins do not preserve another origin’s journal/routines; use stable hosting for a persistent demonstration.

## Tracking evidence

[The generated inventory](TRACKING-READINESS.json) covers all 22 exercise guides. Nine offer experimental rep estimates with eight pose protocols; the others offer illustrated teaching, a camera mirror, and manual counting. Band curls share the experimental elbow-motion protocol. Band rows do not have a validated automatic protocol. A pose model cannot see resistance, band tension/anchor integrity, pain, loading, or every clinical form error.

No new model trained on human exercise videos is deployed. [Dataset research](VIDEO-DATASET-RESEARCH.md) records unresolved data permissions, limited movement coverage, and non-commercial restrictions. [The offline toolkit](../training/README.md) supports permission-checked videos, participant-separated train/validation/test splits, poor-pose abstention, and measured false alarms/missed errors. It does not manufacture labels, treat synthetic landmarks as human accuracy evidence, or reuse private Clinic clips.

Before claiming accuracy, collect permission-cleared, independently labeled footage for each exercise/equipment/view, reserve unseen participants and iPhones, and compare rep counts and specific form errors against qualified observers. No accuracy percentage or claim to maximize recovery is supported by the current evidence.

## Remaining device checks

- Cold launch, Reduce Motion, routine scheduling, weekly goal completion, and reminder delivery.
- HTTPS camera permission allowance/denial, front/back cameras, correction overlay, pause/break/exit, and background cleanup on a physical iPhone.
- Clinician plan/clip workflows with configured staging accounts; widget behavior in a signed native build.
- Stable HTTPS hosting and the submission video/link. This repository update does not publish an App Store release.
