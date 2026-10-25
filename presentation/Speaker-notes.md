# Rebound — presenter notes

## 1. Rebound — Small steps. A steadier routine.

Ritvik: Introduce yourselves as Ritvik Saidapur and Siddharth Senthilkumar, presenting Rebound for NC-04. Our goal is to make a clinician-cleared recovery routine easier to understand and follow between appointments. Rebound combines a weekly plan, reminders, guided movement practice, and a personal record. The screen shown here is rendered from our current native components using example data, not a real patient or a clinical result. Do not claim that the prototype speeds healing or replaces a clinician.

## 2. The problem — Recovery needs more than instructions.

Siddharth: Describe a hypothetical person returning from an injury. They may have instructions but still struggle to remember a routine or understand a movement when they are on their own. These three questions explain the design problem we chose. We are not presenting survey findings, measured adherence statistics, or evidence that the app has improved clinical outcomes. The intended audience includes athletes and everyday people following an individually cleared plan.

## 3. The solution — One calm place for the next step.

Ritvik: Walk through the main loop. First, find the next planned routine. Second, use an illustrated movement guide and a camera estimate when the movement is supported. Third, record the session and how the day feels. The website and iPhone client share the app’s saved routines and guided workflows, while the native iPhone home and Coach library have their own presentation. Browser and device storage are separate; this is not automatic cross-device synchronization.

## 4. Weekly goals — A week you can follow.

Siddharth: Point to the weekly progress bar above the green recovery-focus card. The example is one of three planned routines complete. A routine earns credit once on its scheduled local date after the run is finished. Extra sets and duplicate saves do not inflate the goal, and dates before a routine was created are excluded. The plan does not demand catch-up exercise on rest days. The reminder shortcut suggests scheduled routine days, but the user still chooses and confirms notification days and time. Existing native reminders are independent and can still alert after completion.

## 5. The Coach — Learn the movement. Then practice.

Ritvik: Show the native Coach screen: a routine action first, followed by a searchable movement library. The catalog contains 22 guides; that is not a claim to cover every injury. Sixteen guides reference previously checked NHS instructions, while six examples retain review-pending labels. Supported camera movements ask for two slow practice cycles. Equipment examples include bands and a light dowel, but the app cannot determine resistance, band anchoring, or a safe clinical range. Do not describe the illustrations as validated biomechanical simulations.

## 6. The camera — Guidance where you are looking.

Siddharth: Explain that the coach runs pose estimation locally on camera frames, then checks movement geometry and timing. Poor visibility, framing, lighting, or detected misalignment can stop counting and show an illustrated cue. The full-screen view includes a counter, pause/exit controls, inactivity pause, and optional set breaks. This slide is a UI test capture with the camera feed omitted; synthetic landmarks opened the correction panel. It is not human accuracy evidence. Nine guides offer experimental estimates across eight motion protocols. The other guides provide mirror/manual counting. Band curls use elbow checks; band rows do not have a validated automatic protocol.

## 7. Privacy and care — Your camera. Your choice.

Ritvik: Separate live coaching from recording. Enabling the coach does not automatically save or upload video. The native recorder is a separate action with a review step, and uploads require a configured Clinic service, authentication, and a connected clinician. The current repository includes these workflows, but a live clinical service is not deployed by the prototype update. Symptom follow-up is conservative and rule-based by default. Optional AI explanations need configured services and opt-in; they do not create a diagnostic or injury-specific prescription.

## 8. How it works — Built around one shared recovery loop.

Siddharth: Explain the actual architecture. The mobile home and Coach library are React Native. Detailed guides and Clinic workflows use an origin-restricted WebView connected to the web app. A bridge transfers validated recovery snapshots and explicit actions. MediaPipe estimates pose landmarks, and a rule-based tracker checks geometry, visibility, view, and timing. The app does not load a newly trained exercise-video classifier. Supabase integration is optional and must be deployed and configured. AI assistance: OpenAI Codex helped with implementation and debugging. Be ready to explain the system and describe this assistance honestly; verify current district and challenge requirements.

## 9. Video demonstration — See Rebound in action.

Both presenters: This slide reserves a 16:9 region for your actual video. In Canva, delete the placeholder elements, upload your recording, place it inside this area, and preview playback. Suggested sequence, not an official duration rule: about 15 seconds on the weekly plan, 35–45 seconds on a supported exercise/camera and correction, then 15–20 seconds saving and viewing progress. Use only individually cleared movements. If footage uses a simulation, label it. Explain tracking limitations and do not claim measured accuracy. Test playback from the actual presenting device, keep an offline backup, and verify the current Congressional App Challenge video instructions separately.

## 10. Next steps — A strong prototype. A clear next step.

Ritvik: Report the evidence precisely. There are 73 browser cases checked, including the added weekly-goal integration case, plus successful web build, native type-check, and iOS JavaScript export. Those checks include synthetic landmarks and browser streams; they do not establish real-person form accuracy or physical iPhone performance. No new human-video model has been trained or deployed. Dataset permissions and movement mappings remain unresolved. The next steps are qualified human-observer evaluation, physical device checks, and dependable service/hosting setup. Do not call the app clinically validated or fully trained for every exercise.

## 11. Closing — A clearer plan. A steadier routine.

Siddharth: Close with the intended benefit: a clearer plan and a steadier routine between appointments. Invite questions about the weekly goal, the coach, privacy, or how the prototype was built. Avoid turning the product’s goal into a claim of proven injury recovery improvement. If asked about AI accuracy, explain the current experimental coverage and evaluation plan honestly. Thank the audience on behalf of Ritvik Saidapur and Siddharth Senthilkumar, NC-04.

## 12. Appendix — Sources, identity, and tool credits.

Reference links: https://github.com/sidsenthilkumar-dev/congressapp/tree/rebound-mvp ; https://github.com/congressionalappchallenge/houseofcode2024/blob/main/frontend/src/assets/CAC-logo.svg ; https://www.nhs.uk/live-well/exercise/sitting-exercises/ ; https://www.nhs.uk/live-well/exercise/strength-exercises/ ; https://www.nhs.uk/live-well/exercise/flexibility-exercises/ ; https://www.nhs.uk/live-well/exercise/balance-exercises/ ; https://chuoling.github.io/mediapipe/solutions/pose.html ; https://docs.expo.dev/ . The CAC website was not accessible from this cloud environment, so this deck does not assert current competition rules or eligibility. Confirm current requirements with the district office. The presenter supplied the names and NC-04; no school, clinician involvement, interviews, patient results, or original student coding claims have been invented. Logos retain their source colors and proportions.
