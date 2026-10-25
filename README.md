# Rebound

A responsive recovery companion for athletes and everyday people. Built with React, TypeScript, Vite, and MediaPipe Pose, with an Expo iPhone client in `mobile/`.

For Mac + Expo Go instructions, see [iPhone testing](docs/IPHONE-TESTING.md). The iPhone client has native Recovery and Coach screens, a typing launch animation, and focused shared screens for detailed workflows. It adds native recording, reminders, PDF creation, sharing, and an opt-in WidgetKit session counter in native builds. Camera coaching needs a reachable HTTPS web deployment; none has been deployed yet.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci --cache /tmp/rebound-npm
npm run dev -- --port 5173
```

The install hook copies the MediaPipe runtime and pose models from the integrity-checked npm package into `public/pose`. No external model host or API key is needed. `npm run build` creates the production site in `dist`; `npm run preview` serves it locally. Deploy `dist` with HTTPS for camera permissions.

## Features

- Responsive recovery dashboard and exercise library with original illustrations
- Searchable catalog of 150 recovery topics across 13 body regions, with an Other / unsure journal path
- Editable recovery area, condition, healing stage, symptoms, side, and personal goal
- Conservative symptom-based safety holds for unclear, serious, acute, and post-surgical cases
- Daily discomfort, energy, and notes journal
- Guided sessions with manual rep counting and session timer
- Experimental on-device rep estimates for nine guides across eight movement protocols; explicit manual camera-mirror guidance for the remaining movements
- Camera setup steps, front/rear camera and side selection, framing and view-angle checks, basic lighting estimate, and stability calibration
- Aspect-corrected joint angles, full out-and-return rep counting, visibility reset, and posture cues
- Animated movement guides, sustained-issue correction panels, and an elbow close-up animation
- Twenty-two movement guides with equipment and stop criteria; sixteen linked to checked NHS instructions and six clearly marked for review
- Band curl, band row, assisted dowel lift, and seated hamstring illustrations requiring individual clinician instruction
- Interactive watch/setup/two-slow-rep lessons and corrections inside the camera panel
- Follow-up soreness check-in with conservative screening and optional authenticated AI explanation
- Clinic plans, individual session instructions/targets, private silent clip review, and optional authenticated sharing
- Bookmarked movements and personal routines with scheduled weekdays and clinician notes
- Sequential routine sessions, per-movement consent, optional clinician-set rep targets, manual undo, and a rest timer
- Web-app manifest and home-screen installation instructions (hosting on HTTPS required)
- Progress history, discomfort chart, active-day calendar, and JSON journal export
- Browser-local journal by default; optional Supabase clinic accounts/private clip storage configured separately

Camera mode requires permission, good lighting, a supported browser with WebAssembly/WebGL, and the working joints in view. Joint-angle cues are estimates, not a clinical evaluation or proof of correct form. Ankle pumps use manual counting. Check-ins and sessions are stored in localStorage for this browser; export before clearing site data. Browser storage is not encrypted and should not be used on a shared device for sensitive records.

## Health boundaries

This prototype provides general movement examples and a personal journal, not diagnosis, injury-specific treatment, or medical advice. Symptoms determine conservative safety holds, never a diagnosis or treatment prescription. General movement examples are shown by body area only for eligible profiles. Clinician-specific, unknown, new/worsening, severe, and concerning symptom profiles cannot start generic sessions, even with the clearance checkbox checked. There is no claim to cover every injury. NHS exercise and symptom guidance was successfully read on October 24, 2026. Sixteen movement guides link to those checked instructions; the two original camera examples retain a visible reference-review-pending label. The expanded catalog has not been clinically reviewed. See [research and publishing notes](docs/RESEARCH-AND-PUBLISHING.md). Obtain professional clearance before exercising after injury. Stop if symptoms worsen. Seek appropriate medical care for severe or sudden pain, new weakness or numbness, chest pain, or breathing difficulty.

## Validation

The production TypeScript/Vite build and browser checks cover journal entry, recovery profile edits, exercise filtering, guided sessions, session persistence after reload, camera permission failure, mobile overflow, all catalog regions, contraindication safety holds, aspect-corrected angle calculations, complete rep cycles across all eight experimental motion protocols, occlusion resets, view-angle and arm-drift rejection, correction previews, and sustained-issue live correction UI. Camera inference is additionally checked with a synthetic video feed; real-person accuracy and clinical validity require further evaluation.

Run `npm test` for the Playwright browser suite. The cloud environment uses system Chromium. On other machines, run `npx playwright install chromium` for standard tests and set `CHROMIUM_PATH` to your installed Chromium path for the synthetic-camera check.

Browser checks use a separate development server on port 5180. Set `REBOUND_TEST_PORT` to use another free port. Normal app development uses Vite's default port 5173.

## Screenshots and motion recording

With the production preview server running on port 4173, run `node scripts/capture-preview.mjs` to capture the actual UI into ignored `artifacts/`. To include a WebM recording, set `CAPTURE_VIDEO=1` and provide Playwright’s FFmpeg helper (`npx playwright install ffmpeg`, or a configured Playwright browser-tools directory). Screenshots contain a clearly labeled guidance preview, not a fabricated camera finding.

## Publishing

The repository includes a web app and an Expo iPhone client; neither a signed iOS IPA nor an App Store submission has been produced. App Store membership has generally cost US$99/year; eligible institutions may qualify for a waiver. Pricing and review requirements must be verified with Apple before submission. A hosted HTTPS web version can be shared without Apple membership and added to a phone’s home screen. This repository has not been deployed or submitted to any store.

## Maintainability

The application is organized into typed domain models, page components, feature modules, camera processing, validated browser storage, and shared UI. `src/main.tsx` is only the entry point. TypeScript strict mode, unused-local checks, and unused-parameter checks run in the production build. See [architecture](docs/ARCHITECTURE.md) for state ownership, boundaries, and validation.

The latest feature captures are generated by `node scripts/capture-update.mjs` against the production preview. The captured routine is explicitly labeled as an example and is created through the actual UI in an isolated browser context.

## Focused MVP workflow

The Today page shows the actual routines scheduled for the current local day, completed routine runs, and unfinished movements that can be resumed. Independent exercise sessions do not count as a completed routine. Routine sessions store stable exercise, routine, and run identifiers. Browser Back and reload preserve the selected page through hash routes.

The Reminders page supports a preferred local time, opt-in browser alerts, generic private alert text, a due inbox, 15-minute snooze, dismissal, and recurrence based on the user's routine weekdays. Reminders are off by default. Permission is requested only after the user selects **Enable browser alerts**. The service worker displays alerts requested by the running app; it does not schedule background wake-ups. Keep the app open for its checks. Background throttling and device notification settings can delay or suppress alerts. Completed routines suppress outstanding reminders; explicit snoozes work across midnight.

For reminders after closing the app, export the recurring `.ics` schedule and import it into a calendar with alerts enabled. Calendar import and alert behavior must be checked on the target device. Pausing the app's schedule does not remove imported events; re-export/update the calendar after changing the schedule. This repository has no backend push scheduler or native notification scheduler.

My progress includes a visit-summary builder with saved clinician questions, a 7/30-day journal range, a readable HTML download, and a browser Print / Save PDF action. Nothing is sent automatically. Questions, journal entries, and sessions remain sensitive browser-local records. The app synchronizes its local records between same-origin tabs, without account or cross-device synchronization.

Visual refinements use shared design tokens, readable contrast, keyboard focus states, larger actions, concise transitions, and labeled mobile navigation. Device reduced-motion preferences are respected; individual session guides also offer a static illustration. PNG icons support home-screen installation. There is no offline-use guarantee.

Read [MVP research](docs/MVP-RESEARCH.md) for the verified NHS, MDN, and W3C sources and the distinction between product rationale and proven clinical benefit. Feature-screen capture: `node scripts/capture-mvp.mjs` with a production preview on port 4173. Set `CAPTURE_VIDEO=1` with the Playwright FFmpeg helper to record an interface walkthrough. The sample routine in captures is explicitly labeled as an example and is created through the real UI, not patient footage or fabricated clinical progress.

## iPhone, Clinic, and tracking expansion

The Expo client opens on a native recovery home and searchable Coach library. A restricted WKWebView connects focused guides, routine editing, Clinic, and progress to the saved app data. It also includes native silent recording, local iPhone schedules, PDF export, share sheets, and an opt-in Home/Lock Screen session widget (native builds only). Run `npm ci` in `mobile/`, then `npx expo start --go` for Expo Go. A reachable web deployment is required; plain LAN HTTP can preview screens, while camera coaching requires HTTPS. See [iPhone testing](docs/IPHONE-TESTING.md).

The default check-in is rule-based and local. Optional AI explanation requires sign-in, explicit opt-in, and a deployed server function with a server-side provider key. It explains a fixed general draft rather than prescribing injury exercises. Live doctor plan delivery and clip uploads require a separately configured Supabase service. See [Clinic setup](docs/CLINIC-SETUP.md).

Run `npm run test:clinic` for six PostgreSQL policy checks, `npm run mobile:typecheck` for native types, and `npm run mobile:bundle` for the iOS JavaScript export. The latter is not a signed native build or a physical-device test. `deno check supabase/functions/recovery-assistant/index.ts` checks the optional server function.

No real-person tracking accuracy, injury-prevention benefit, physical-iPhone camera performance, OS alert display, deployed clinician exchange, or live provider response has been validated. See [tracking coverage](docs/TRACKING-COVERAGE.md).

## Pauses, sets, and form feedback

Supported cyclic camera exercises automatically pause counts and active time after eight seconds without clear joint movement, or three seconds after usable tracking is lost. The preview stays on; exiting/backgrounding stops camera use. Resume is explicit and discards partial rep cycles. Choose an optional rep interval from your existing plan and a break length before starting, or take a break manually. Timed breaks never automatically restart counting. Manual sessions support the same chosen set breaks, while hold-based exercises avoid camera inactivity inference.

Additional pose-based checks identify unexpected elbow/knee bending in supported straight-limb guides and show a correction. These are deterministic checks on the existing pretrained pose model. No new model weights were trained, no clinic footage was reused, and real-person accuracy remains unvalidated. See [form validation and training status](docs/FORM-VALIDATION.md).

See [public video dataset research](docs/VIDEO-DATASET-RESEARCH.md) and the [offline training toolkit](training/README.md) for verified dataset constraints, participant-separated evaluation, and the research-only candidate workflow. No new human-video model is deployed.
