# Rep tracking repair

Reported symptom: supported camera exercises did not count and the website showed “tracking is unclear.”

## Reproduced failures

The new regression cases failed before the repair for four reasons:

- A continuous knee cycle was timed only outside a broad rest band. Slow practice could reject a complete movement unless the user artificially held its endpoint.
- Camera updates 700 ms apart reset calibration on every frame because the previous gap limit was 600 ms.
- Small left/right confidence changes switched the automatic candidate on every frame, preventing calibration from finishing.
- Tracking-loss pauses never recovered from new observations. The UI reset the tracker on every paused frame, while calibration/form warnings were incorrectly treated as lost tracking.

## Resulting behavior

Automatic selection remains with a viable side and prefers a fully framed working limb. Missing/invalid samples clear pending cycle state consistently. Counts require an observed out-and-return cycle near the starting position, with the slow-practice timing gate measured from movement departure. Waiting at rest does not make a rapid movement pass.

Pose quality is separate from form feedback. A torso/tempo warning blocks invalid reps as appropriate but does not masquerade as lost body tracking. After tracking is actually lost, clear observations for at least 900 ms allow recovery, discard the partial rep, and recalibrate before counting. Planned breaks and stillness pauses remain under explicit resume control. A new body-side selector and front/side-view label stay visible in the camera header.

The full-camera browser regression loses tracking during a partial rep, reacquires the pose, verifies zero phantom reps, counts a continuous full knee cycle, and checks that a sustained torso warning does not falsely become a tracking-loss pause. Other cases cover automatic-side jitter, cropped limbs, slow frames, fast cycles after a long wait, supported protocol cycles, occlusion, framing, form gates, and camera cleanup. These use synthetic observations/streams and do not establish real-person accuracy. No new model training or clinically prescribed range change is claimed.

## Deploy the corrected source to Vercel

A versioned Vercel deployment URL remains tied to its original build. Refreshing or redeploying that same old snapshot does not necessarily load a newer source commit. The cloud workspace has no Vercel credentials and cannot reach the live Vercel deployment through its network proxy, so source changes are not described as a verified live-site repair.

From the latest downloaded `rebound-mvp` folder on the Mac:

```sh
npm run deploy:vercel
```

This runs the pinned Vercel CLI without a global install, asks for account authorization only if needed, links the existing **congress** project, then deploys the current folder to production. Select the account and existing project that own the app; do not create an unrelated replacement. Open the new Production/Aliased URL Vercel prints, rather than the old versioned address. No password or token needs to be pasted into chat.

The fixed build serves `/tracking-build.json` with `trackingFix: "clear-tracking-recovery-v1"`. If that file is missing or returns an HTML page, the URL is serving an older build.
