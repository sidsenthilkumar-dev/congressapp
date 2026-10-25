# Rebound — Congressional App Challenge presentation

Prepared for **Ritvik Saidapur** and **Siddharth Senthilkumar**, **NC-04**. No school was supplied, so none was invented.

## Open in Canva

1. Download `Rebound-Congressional-App-Challenge.pptx` to your computer. Use this PowerPoint file for editing; the PDF is the viewing/backup version.
2. In Canva, import/upload the PPTX as a presentation. The deck is widescreen 16:9. Headings, body text, cards, lines, and the video placeholder are editable objects; app previews and logos are images.
3. Check the fonts: **Manrope** for headings and **DM Sans** for body text. Select those fonts if Canva substitutes another font. Review the imported deck before presenting because Canva can change text wrapping or shape positioning.
4. Open **slide 9**, delete the placeholder elements, upload your demo recording, and fit it to the marked 16:9 region. No video is embedded yet. Keep a local copy of your demo as a playback backup.
5. Copy the presenter script from `Speaker-notes.md` into Canva’s notes if the PowerPoint notes do not transfer. Apply a simple Fade/Dissolve transition in Canva if desired; video and transition playback must be checked on the actual presenting device.

`Rebound-Congressional-App-Challenge.pdf` is a matching 12-page backup. `Rebound-slide-preview.png` is a contact sheet; the `previews/` folder contains individual slide images.

## Slide order

1. Title, presenters, NC-04
2. The problem: clarity, confidence, consistency
3. The solution: plan, practice, reflect
4. Weekly goal and reminders
5. Coach and illustrated movement library
6. Full-screen camera and correction interface
7. Privacy and care
8. Technical architecture and local pose processing
9. **Video demonstration placeholder**
10. Engineering evidence and next steps
11. Closing
12. Source and tool credits

## Demo suggestions

Use your own actual recording. A suggested 60–90 second sequence is: weekly goal/next routine → a supported, individually cleared movement → camera setup and slow practice → pause/correction behavior if available → save a session and show the record. This is a suggested presentation segment, not an official competition duration rule. Label simulations and demonstrate actual behavior rather than claiming unmeasured accuracy.

This deck does not establish current Congressional App Challenge rules or eligibility. Verify current district submission instructions and video requirements separately. It includes an explicit OpenAI Codex assistance credit and avoids invented interviews, patient outcomes, accuracy percentages, clinician endorsements, or claims of original student implementation work that was not established in the conversation.

## Asset provenance and scope

- **Rebound icon:** `public/icons/rebound-512.png` in this repository, copied into `assets/rebound-icon.png`.
- **CAC logo:** the `CAC-logo.svg` asset in the `congressionalappchallenge/houseofcode2024` repository: <https://github.com/congressionalappchallenge/houseofcode2024/blob/main/frontend/src/assets/CAC-logo.svg>. The PNG is a raster rendering of the original SVG, with colors and aspect ratio preserved. Used for event identification; no Congressional App Challenge or U.S. government endorsement of Rebound is implied. Brand rights remain with their owners.
- **Native UI previews:** browser renderings of the current `PatientShell`, `RecoveryHome`, `WeeklyGoal`, and `CoachLibrary` React Native components, with React Native Web and a DOM SVG adapter. They are not physical-iPhone screenshots. Example data displays a hypothetical 1/3 weekly goal and one logged session, not real patient usage or a measured health outcome. Native platform font/rendering can differ.
- **Camera UI:** actual web coach interface with the camera feed and overlay canvas visually omitted for the presentation. Synthetic landmarks opened the correction panel. This is a UI test illustration, not a human-video accuracy result. It does not use patient footage.
- **Website:** current production-preview interface, no patient data.
- **Fonts:** Manrope and DM Sans from the repository’s installed Fontsource packages. Their SIL Open Font License notices are preserved in `assets/fonts/`. The TTFs support PDF generation; the PPTX uses editable font names rather than embedded font binaries.
- **Technical and validation facts:** app source, `docs/SUBMISSION-STATUS.md`, and `docs/TRACKING-READINESS.json` as of commit `6753c32`. Nine of 22 guides have experimental estimates, and the others are mirror/manual. No new human-video model or real-person accuracy percentage is claimed. Live Clinic service configuration, stable hosting, signed iOS builds, and physical-device validation remain separate work.

## Rebuild the files

The assets and fonts are included; no app source modifications or service credentials are needed.

```sh
python3 -m venv .venv-presentation
.venv-presentation/bin/pip install -r presentation/requirements.txt
.venv-presentation/bin/python presentation/build.py
```

The script creates both exports from shared layouts, checks that elements stay inside the slides, writes speaker notes, and renders PNG previews. This checks document structure and the matching PDF. Canva’s import rendering must still be inspected in Canva.
