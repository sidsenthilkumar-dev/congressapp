# Rebound architecture

The application is a browser-based React/TypeScript application. It has no backend, account service, billing integration, or server-held patient record. Vite produces the static deployment bundle. All application fonts and pose assets are served locally.

## Responsibilities

- `src/main.tsx` initializes fonts, styles, and the React root.
- `src/app/App.tsx` coordinates page selection, dialogs, session completion, and routine sequencing.
- `src/app/AppShell.tsx` owns navigation, the page header, and the notification panel.
- `src/domain/recovery.ts` defines the condition catalog, source provenance, profile types, and conservative exercise-eligibility rules.
- `src/domain/exercises.ts` provides stable exercise IDs, equipment, instructions, stop criteria, camera capabilities, and per-exercise references.
- `src/domain/tracking.ts` is a UI-independent landmark processor. It calculates aspect-corrected angles, calibrates a fixed side, rejects unsuitable input, and recognizes complete rep cycles.
- `src/hooks/useRecoveryData.ts` validates persisted data, owns browser storage, resets general clearance when a profile changes, and updates routines and bookmarks.
- `src/features/recovery` contains the condition library and profile/check-in forms. Forms keep an editable draft and commit on Save.
- `src/features/exercises` contains search, body-area filters, bookmarks, and source details.
- `src/features/movement` contains the camera lifecycle, session timer, rest timer, movement estimates, and animated correction UI.
- `src/features/routines` contains routine editing, selected weekdays, clinician notes, saved movements, and routine cards.
- `src/features/overview` and `src/features/progress` render the journal and dashboard from application state.
- `src/components` contains shared presentation and exercise illustrations.

TypeScript strict checking, unused-local checks, and unused-parameter checks run during every production build. Stable exercise IDs are persisted instead of array positions. Persisted records are validated before rendering. Storage-write failures are shown in the UI. Private notes are rendered as text, never injected as HTML.

## Clinical boundaries

A checked public reference means the source was read and the relevant general movement was compared with it. It does not mean a clinician validated Rebound, that an exercise treats an arbitrary injury, or that an adult movement is appropriate for every child or athlete. Injury selection cannot produce a diagnosis or individual rehabilitation prescription.

Safety holds are resolved before starting a session. A generic clearance checkbox cannot override a hold. Every movement session asks for its own clearance confirmation. Routines only organize selected movements; they do not prescribe dose or authorize activity. Optional rep targets are entered by the user from their own plan. Range estimates must never encourage someone to move farther to trigger a rep.

## Camera and animation

The camera is opened only after consent and is released when the session pauses, its dialog closes, tracking fails, or the component unmounts. Inference is serialized: each frame waits for the previous model call. Basic light checks, landmark visibility, camera-view checks, side locking, and calibration gate automatic counting.

Nine guides expose experimental rep estimates through eight protocols. Other movements explicitly use manual counting. Illustration and correction-preview labels distinguish a demonstration from a live finding. SVG guides honor reduced-motion preferences. Normal camera coaching does not upload frames or record video. Clinic recording is separate and requires review and explicit upload consent. Preview recordings in `artifacts/` are recordings of the interface, not patient footage.

## Testing

The Playwright suite covers catalog/source integrity, eligibility rules, angle mathematics, full rep cycles, occlusion and view errors, real local-model initialization with synthetic camera input, deterministic live correction UI, journal and routine persistence, bookmarks, search, sequential sessions, timers, target reminders, manual undo, cancellation, malformed storage, and mobile overflow.

Real-person camera accuracy, physical-device coverage, clinical validation, and App Store review remain separate release work. Do not describe successful synthetic-input tests as real-person accuracy validation.

## MVP additions

`domain/dailyPlan.ts` derives local-day schedules and actual completed routine runs. `TodayHub.tsx` presents that plan without inventing a recovery score. Sessions carry optional `exerciseId`, `routineId`, `runId`, and `routineFinished` fields; older independent records remain valid and never fabricate routine completion. An unfinished routine can continue from its recorded remaining movements.

`domain/reminders.ts` contains pure time, recurrence, privacy, deduplication, and RFC5545 calendar serialization rules. `useReminders.ts` owns the timer, permission state, persistent inbox, and inter-tab lock. `RemindersPage.tsx` owns preference controls. `public/notification-worker.js` only displays/opens notifications requested by the app; there is no push event subscription or server scheduler. Real iPhone/Android background delivery and calendar import still require device-level release validation.

`domain/visitReport.ts` formats a factual date-filtered report and escapes user-entered content before HTML export. `VisitSummary.tsx` persists clinician questions and exposes deliberate local download/print actions. No implicit sharing occurs.

`usePageNavigation.ts` provides hash-based navigation and browser-history support. `useLocalStorage` listens for same-origin storage changes, which keeps completion and reminder inputs consistent across tabs. Stored data remains local to the browser; this is not multi-device synchronization.

`styles/premium.css` is the final visual layer. It defines shared ink/sage/ivory tokens, readable controls, focus states, motion durations, reduced-motion equivalents, compact labeled navigation, and daily-plan presentation. Static motion controls supplement device preferences. Asset icons are original SVG artwork rendered to PNG by `scripts/generate-app-icons.mjs`.

## iPhone and care modules

`src/domain/checkIn.ts` supplies shared conservative screening to the UI and the optional authenticated Edge Function. `src/domain/clinic.ts` validates bounded plan data independently of service configuration. `src/services/clinic.ts` owns optional Supabase access and private upload finalization. Clinic plan composition, plan cards, and clip recording are separate feature components; source/profile safety holds still apply during sessions.

`mobile/` is a standalone Expo SDK 58 package with its own lockfile. The origin-restricted WebView shares the web screens; native modules handle recording, local weekly alerts, exports, and PDF/share sheets. Bridge requests are user-driven, restricted by origin/type/size, and never automatically upload clips. The website must be reachable, and coaching requires HTTPS. The client does not bundle an offline website or a native pose engine.

The SQL migration uses row-level policies, server-provisioned clinician approval, hashed expiring invitations, connection-scoped plans, private storage, short-lived signed links, and per-user AI request limits. Tests execute the real migration against PGlite fixtures. Deployed Supabase Auth/Storage, actual iPhone behavior, provider responses, account deletion/retention operations, clinical validation, and signing remain release prerequisites.
