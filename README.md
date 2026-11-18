# rebound

**congressional app challenge project** · react, typescript, vite, mediapipe pose, expo

i built rebound to make recovery routines easier to follow and track. it combines daily check-ins, guided movements, and experimental camera-based rep counting in a web app, with an expo iphone client. the goal is to give someone a clearer picture of what they've done between appointments, without presenting the app as a replacement for medical care.

**[try the web app](https://congress-two.vercel.app/#today)**

this repository contains the web app and an expo iphone client. the hosted web app is deployed from the separate `congress` repository, so this repository and the live version may differ.

## what it does

- records daily discomfort, energy, and notes.
- lets users edit their recovery profile and browse movement guides by body area.
- provides illustrated exercise instructions, timers, manual rep counting, and routines.
- uses mediapipe pose for experimental camera-based rep estimates and basic form cues on supported movements.
- checks camera framing and pauses tracking when movement or usable joint tracking is lost.
- keeps a progress history and exports journal records and visit summaries.
- includes optional clinic sharing and ai explanations that need separate server configuration.

most journal and session data stays in the browser's localstorage. clearing browser data removes those records, so export anything you want to keep. browser storage is not encrypted; avoid storing sensitive information on a shared device.

## run locally

use node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

open the local address printed by vite. the install script copies the mediapipe runtime and pose models into `public/pose`, so camera tracking does not need a separate model api key.

```sh
npm run build
npm run preview
```

the production build is written to `dist`. a deployed camera session needs https, camera permission, a supported browser, and enough room and light to see the working joints.

## project structure

the web app uses react, typescript, and vite. mediapipe supplies the pretrained pose model; the app applies movement rules to its joint estimates. no new pose-model weights were trained for this project.

- `src/` — web pages, shared components, recovery state, and camera processing
- `mobile/` — expo iphone client
- `public/pose/` — runtime and model assets prepared during installation
- `supabase/` — optional clinic services and ai explanation function
- `tests/` — browser and clinic policy checks
- `docs/` — architecture, sources, setup, and validation notes
- `training/` — research-only offline training toolkit

see [architecture](docs/ARCHITECTURE.md) for the application structure and state ownership.

## checks

```sh
npx playwright install chromium
npm test
npm run test:clinic
npm run mobile:typecheck
npm run mobile:bundle
```

the browser tests use port 5180 by default; set `REBOUND_TEST_PORT` to change it. the synthetic-camera check may need `CHROMIUM_PATH` set to an installed chromium executable. the mobile bundle command creates a javascript export, not a signed ios application or a physical-device test.

## limits and sources

rebound is a prototype for general movement guidance and personal records. it does not diagnose injuries, prescribe treatment, or establish whether someone's exercise form is clinically safe. follow a qualified clinician's instructions after an injury, and stop exercising if symptoms worsen.

camera joint estimates and rep counts can be wrong. real-person tracking accuracy and clinical benefit have not been validated. some guides require individual clinician instructions or further reference review. symptom checks can place a safety hold on generic sessions; they do not provide a diagnosis.

the default check-in is local and rule-based. optional ai explanations require sign-in, explicit opt-in, and a configured server function. clinic exchange requires separately configured supabase services. browser reminders depend on the app remaining open; imported calendar schedules have their own alert settings.

detailed references and limitations:

- [research and publishing notes](docs/RESEARCH-AND-PUBLISHING.md)
- [mvp research](docs/MVP-RESEARCH.md)
- [tracking coverage](docs/TRACKING-COVERAGE.md)
- [form validation and training status](docs/FORM-VALIDATION.md)
- [public video dataset research](docs/VIDEO-DATASET-RESEARCH.md)
- [submission status and remaining validation](docs/SUBMISSION-STATUS.md)

## mobile and deployment

- [iphone testing](docs/IPHONE-TESTING.md)
- [clinic setup](docs/CLINIC-SETUP.md)
- [website release guide](docs/WEBSITE-RELEASE.md)
- [vercel deployment guide](docs/VERCEL-DEPLOYMENT.md)

the iphone client needs a reachable web deployment for shared workflows, with https for camera coaching. there is no signed app store build or offline-use guarantee.
