# Sources, clinical scope, and publishing

## Sources read on October 24, 2026

The NHS pages below were successfully retrieved over HTTPS and read during this update. The original NHS links under `/strength-and-flex-exercise-plan/` returned 404; the current direct exercise URLs below returned 200. Source dates in the app record retrieval, not a new medical review by the source publisher.

| Source                                                                                | Relevant content used                                                                             |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Sitting exercises](https://www.nhs.uk/live-well/exercise/sitting-exercises/)         | Stable-chair setup; chest opening; upper-body turn; hip marching; ankle movement                  |
| [Strength exercises](https://www.nhs.uk/live-well/exercise/strength-exercises/)       | Sit-to-stand, mini-squats, calf raises, sideways/backward leg lifts, wall press-ups, biceps curls |
| [Flexibility exercises](https://www.nhs.uk/live-well/exercise/flexibility-exercises/) | Neck rotation, sideways bend, supported calf stretch                                              |
| [Balance exercises](https://www.nhs.uk/live-well/exercise/balance-exercises/)         | Use of support, one-leg stance, heel-to-toe walking                                               |
| [Sprains and strains](https://www.nhs.uk/conditions/sprains-and-strains/)             | Assessment and acute-injury cautions                                                              |
| [Knee pain](https://www.nhs.uk/conditions/knee-pain/)                                 | Severe pain, inability to bear weight, locking, swelling, heat/fever, and assessment              |
| [Shoulder pain](https://www.nhs.uk/conditions/shoulder-pain/)                         | Gentle comfortable movement, avoiding aggravation, and symptoms needing assessment                |
| [Back pain](https://www.nhs.uk/conditions/back-pain/)                                 | General activity and urgent neurological symptoms                                                 |
| [Neck pain](https://www.nhs.uk/conditions/neck-pain-and-stiff-neck/)                  | Comfortable movement and symptoms requiring professional advice                                   |
| [Wrist pain](https://www.nhs.uk/conditions/hand-pain/wrist-pain/)                     | Gentle movement for mild stiffness, suspected fracture and infection warnings                     |

The NHS knee-exercises-for-runners page was also read. It explicitly states that its exercises are not suitable for people with an existing knee injury. It was therefore **not** used as evidence that the knee-extension camera example treats an injured knee. Two original examples (seated knee extension and shoulder side raise) retain visible reference-review-pending labels and require specific professional clearance.

Sixteen of the 22 movement guides are linked to the checked NHS exercise instructions. The instructions are paraphrased and the diagrams are original. NHS general adult guidance is not automatically appropriate for an injured person, a child, or an athlete with specific restrictions. The app does not copy the source's generic repetition suggestions into an individualized prescription. The user’s treating clinician determines range and dose.

AAOS knee and shoulder conditioning pages were retried and still returned an egress-proxy 403. Their contents remain unverified. The 150-topic condition catalog covers common injuries and recovery situations across 13 regions; adding names is not equivalent to a clinical review of each entry. The catalog, safety routing, diagrams, and app-specific tracking heuristics still need professional review.

## Safety and treatment scope

Symptoms trigger conservative holds, not diagnosis or an automatic treatment plan. Fractures, suspected ruptures, surgical cases, unclear conditions, acute/worsening symptoms, and concerning symptoms cannot start generic sessions. Clearance confirmation does not bypass a hold. Every new session has its own confirmation. “Other” and “not diagnosed / unsure” remain available for journaling without an exercise prescription.

Recovery routines contain movements selected by the user and notes from their own clinician. Days are personal scheduling intentions, not prescribed frequency or background push notifications. Optional rep targets and rest timers are organizational tools, not generated medical doses. New symptoms or worsening pain require appropriate care; the app cannot rule out every serious condition.

## Camera behavior

MediaPipe runs locally. Camera setup checks landmark visibility, framing, view, light, and alignment before counting. A stable side is locked during calibration. Aspect-corrected angle smoothing and full out-and-return cycles reduce duplicate counts; missing or unsuitable input resets the cycle. Nine guides expose experimental automatic rep estimates; all others are labeled manual. Normal coaching frames are neither recorded nor uploaded. Clinic has a separate explicit recording/review/consent workflow; see CLINIC-SETUP.md.

Absolute range and posture thresholds are engineering heuristics. Restricted but clinically appropriate movement may not trigger them. Users must not stretch farther to satisfy a counter; manual counting remains available. Real-person accuracy and physical-phone testing are still necessary. A synthetic video test verifies runtime/model integration, not clinical accuracy.

## Apple distribution

Apple Developer Program membership has generally cost US$99 per year (or local equivalent), even for a free download. Eligible educational institutions, nonprofits, and government entities may qualify for a fee waiver. Individual student status does not automatically waive the fee. Verify current local pricing, eligibility, age/account rules, privacy requirements, and medical-app requirements directly with Apple before enrollment or submission:

- https://developer.apple.com/support/compare-memberships/
- https://developer.apple.com/support/fee-waiver/
- https://developer.apple.com/app-store/review/guidelines/

The repository builds a web app. No signed iOS binary, account enrollment, payment, hosting deployment, or store submission has occurred. A hosted HTTPS version can be shared without Apple membership and added to a phone's home screen. Hosting has its own terms and possible costs. A web-app manifest is supplied; no offline guarantee is made.

The current equipment additions, tracking boundaries, and October 25 source checks are documented in [TRACKING-COVERAGE.md](TRACKING-COVERAGE.md). They are not claims of exercise-specific clinical validation.
