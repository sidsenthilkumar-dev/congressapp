# Rebound

Rebound is a recovery journal and movement guide for athletes and other people working through recovery. It brings check-ins, exercise instructions, routines, and camera-based movement tracking into one app.

**[Try the web app](https://congress-two.vercel.app/#today)**

This repository contains the web app and an Expo iPhone client. The hosted web app is deployed from the separate `congress` repository, so this repository and the live version may differ.

## What it does

- Records daily discomfort, energy, and notes.
- Lets users edit their recovery profile and browse movement guides by body area.
- Provides illustrated exercise instructions, timers, manual rep counting, and routines.
- Uses MediaPipe Pose for experimental camera-based rep estimates and basic form cues on supported movements.
- Checks camera framing and pauses tracking when movement or usable joint tracking is lost.
- Keeps a progress history and exports journal records and visit summaries.
- Includes optional clinic sharing and AI explanations that need separate server configuration.

Most journal and session data stays in the browser's localStorage. Clearing browser data removes those records, so export anything you want to keep. Browser storage is not encrypted; avoid storing sensitive information on a shared device.

## Run locally

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. The install script copies the MediaPipe runtime and pose models into `public/pose`, so camera tracking does not need a separate model API key.

```sh
npm run build
npm run preview
```

The production build is written to `dist`. A deployed camera session needs HTTPS, camera permission, a supported browser, and enough room and light to see the working joints.

## Project structure

The web app uses React, TypeScript, and Vite. MediaPipe supplies the pretrained pose model; the app applies movement rules to its joint estimates. No new pose-model weights were trained for this project.

- `src/` — web pages, shared components, recovery state, and camera processing
- `mobile/` — Expo iPhone client
- `public/pose/` — runtime and model assets prepared during installation
- `supabase/` — optional clinic services and AI explanation function
- `tests/` — browser and clinic policy checks
- `docs/` — architecture, sources, setup, and validation notes
- `training/` — research-only offline training toolkit

See [architecture](docs/ARCHITECTURE.md) for the application structure and state ownership.

## Checks

```sh
npx playwright install chromium
npm test
npm run test:clinic
npm run mobile:typecheck
npm run mobile:bundle
```

The browser tests use port 5180 by default; set `REBOUND_TEST_PORT` to change it. The synthetic-camera check may need `CHROMIUM_PATH` set to an installed Chromium executable. The mobile bundle command creates a JavaScript export, not a signed iOS application or a physical-device test.

## Limits and sources

Rebound is a prototype for general movement guidance and personal records. It does not diagnose injuries, prescribe treatment, or establish whether someone's exercise form is clinically safe. Follow a qualified clinician's instructions after an injury, and stop exercising if symptoms worsen.

Camera joint estimates and rep counts can be wrong. Real-person tracking accuracy and clinical benefit have not been validated. Some guides require individual clinician instructions or further reference review. Symptom checks can place a safety hold on generic sessions; they do not provide a diagnosis.

The default check-in is local and rule-based. Optional AI explanations require sign-in, explicit opt-in, and a configured server function. Clinic exchange requires separately configured Supabase services. Browser reminders depend on the app remaining open; imported calendar schedules have their own alert settings.

Detailed references and limitations:

- [Research and publishing notes](docs/RESEARCH-AND-PUBLISHING.md)
- [MVP research](docs/MVP-RESEARCH.md)
- [Tracking coverage](docs/TRACKING-COVERAGE.md)
- [Form validation and training status](docs/FORM-VALIDATION.md)
- [Public video dataset research](docs/VIDEO-DATASET-RESEARCH.md)
- [Submission status and remaining validation](docs/SUBMISSION-STATUS.md)

## Mobile and deployment

- [iPhone testing](docs/IPHONE-TESTING.md)
- [Clinic setup](docs/CLINIC-SETUP.md)
- [Website release guide](docs/WEBSITE-RELEASE.md)
- [Vercel deployment guide](docs/VERCEL-DEPLOYMENT.md)

The iPhone client needs a reachable web deployment for shared workflows, with HTTPS for camera coaching. There is no signed App Store build or offline-use guarantee.
