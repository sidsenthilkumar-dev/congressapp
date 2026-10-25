# Movement coaching coverage

Nine of 22 exercise guides expose **experimental rep estimates**, using eight motion protocols. Every other exercise offers a camera mirror, manual counting, an illustration, and the interactive teaching steps. A body-pose model cannot reliably measure every ankle, neck, stretching, balance, or assisted movement. Manual movements never show fabricated automatic form scores.

| Exercises | View | Estimated signal | Important blind spots |
| --- | --- | --- | --- |
| Seated knee extension | Side | Knee bend/return | Pain, loading, clinically appropriate range |
| Bicep curl; band curl | Side | Elbow cycles; upper-arm drift | Grip, band tension/anchor, resistance |
| Shoulder side raise | Front | Arm angle; trunk lean | Shoulder mechanics, pain, safe limits |
| Supported mini-squat | Side | Knee bend/return | Balance, depth alignment, loading, support |
| Supported sit-to-stand | Side | Seated-to-upright knee cycle | Actual chair contact, chair stability, falls |
| Supported sideways leg lift | Front | Hip angle; trunk lean | Pelvic rotation, balance, support contact |
| Wall press-up | Side | Elbow cycles; broad body alignment | Wall/hand contact and pressure |
| Assisted dowel shoulder lift | Side | Arm lift/return | Bar pressure, assistance, safe range |
| All other guides | User-selected mirror | User counts manually | No automatic form assessment |

The local MediaPipe Pose configuration now uses model complexity 1, higher detection/tracking thresholds, finite-coordinate checks, visible opposing shoulders for view checks, minimum projected limb size, locked side selection, frame-gap resets, image-aspect correction, time-based smoothing, and endpoint dwell. Counts require an out-and-return cycle. The first two camera cycles require at least 3 seconds; later cycles require at least 1.2 seconds. Timing is an engineering gate, not a clinical dosing recommendation. Manual practice is explicitly self-reported.

Poor framing, visibility, view, lighting, or detected misalignment pause counting immediately. Sustained issues show an animated guide inside the camera panel. Generic direction illustrations are not exact biomechanical models or personalized range targets. The two original unverified guides and four equipment/hamstring adaptations retain their review-pending labels; sixteen general guides still link to previously checked NHS instructions.

Synthetic-landmark tests exercise complete cycles, occlusion, invalid values, view and alignment gates, and slow practice. A synthetic video test loads the real local model and runs inference, and another records/cleans up an actual browser MediaRecorder stream. These tests do not establish real-person accuracy, safe technique, injury prevention, or acceptable iPhone frame rate. No accuracy percentage can be stated from them. Physical-device and human-observer validation across supported movements, ranges, body types, clothing, occlusion, lighting, and cameras remains required.

## Sources checked on October 25, 2026

- [NHS — Sprains and strains](https://www.nhs.uk/conditions/sprains-and-strains/): successfully fetched and read. Worsening pain/swelling, impaired weight bearing, fever, and concerning changes need medical attention. The new check-in deliberately does not diagnose or generate an injury treatment protocol.
- [NHS — Strength exercises](https://www.nhs.uk/live-well/exercise/strength-exercises/): successfully fetched and read. Existing general curl, mini-squat, sit-to-stand, and other instructions remain general adult guidance. This does not verify the new band or dowel adaptations.
- Expo documentation pages were blocked by the cloud network proxy. Native integration was checked against the integrity-verified installed Expo SDK 58 type declarations and native source, including `expo-camera`'s iOS MOV output, mute/record limits, notifications, file sharing, and WebView permission properties. An iOS bundle export is a build check, not a physical-device test.

The rep-tracking repair stabilizes automatic side selection across small confidence changes, prefers a framed working limb, tolerates frame intervals up to 1.2 seconds before clearing the cycle, and measures cycle time from actual departure rather than discarding movement inside the broad rest band. Return must approach the observed starting angle; a long wait before a rapid movement does not satisfy slow practice. A camera-side selector lets users change the working side without closing the view. Tracking-loss recovery requires sustained clear observations and recalibration; form warnings do not count as lost tracking. No model weights or clinical range recommendations were changed.
