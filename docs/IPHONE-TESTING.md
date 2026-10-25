# Test Rebound on an iPhone

Rebound now includes an Expo iPhone client in `mobile/`. It uses the existing responsive app inside an origin-restricted WKWebView, with native silent video recording, local iPhone notifications, PDF creation, and the iOS share sheet. It is a hybrid client, not a rewrite of every screen in React Native. It needs a reachable web app; it does not bundle an offline copy of the website.

## Mac + Expo Go

Install Node.js LTS (22.13+ or 24.3+ for the native package) and the latest Expo Go on your iPhone. Download the current `rebound-mvp` branch, unzip it, and open two Terminal windows in that folder.

Terminal 1, from the repository root:

```sh
npm ci
npm run dev -- --port 5173
```

Terminal 2:

```sh
cd mobile
npm ci
npx expo start
```

Connect both devices to the same Wi-Fi, scan the Expo QR code with the iPhone Camera, then open Expo Go. The native welcome screen asks for the Rebound server address. This QR opens the **iPhone client**; it does not host or tunnel the Vite website. Expo Go must support the SDK version in `mobile/package.json` (currently SDK 58). A development build is the alternative when the installed Expo Go version does not support that SDK.

For a screen preview on the same network, enter the Mac's private LAN address with port 5173, as shown under Network by Vite. Development builds permit private LAN HTTP addresses. `localhost` on the phone refers to the phone, not the Mac. A firewall or isolated Wi-Fi network can block the connection.

**For camera coaching, use a reachable HTTPS deployment.** Plain LAN HTTP is only a screen preview and does not provide a secure camera origin. Build with `npm run build`, then host `dist/` at the root of an HTTPS site. No hosting has been deployed by this change. Include `dist/pose/` on that host; Vite's install hook generates those model assets. You can enter that HTTPS URL in the welcome screen, or set `EXPO_PUBLIC_APP_URL` in `mobile/.env` and restart Expo. This value is public and must never contain an API key.

The native clip recorder requests camera permission separately and can be tested while previewing screens over LAN. It records up to 20 seconds, without microphone audio, then shows a review screen. Attaching the clip transfers it to the in-app Clinic review area; it does not upload it. Native iOS recordings can be MOV files: the bridge, picker, and private bucket preserve the correct MIME type. Larger recordings can be saved through the iOS share sheet and selected as a file.

## What to test on a physical iPhone

- Open each tab, create a routine, save a check-in, reload, and confirm local persistence. WKWebView data and Safari data are separate.
- Open a manual exercise and confirm it says camera mirror/manual count. For an experimental camera exercise, use HTTPS, grant permission, follow the camera view instructions, and confirm poor framing/visibility pauses counting.
- Try the two slow practice cycles within an individually cleared range. Never increase range to obtain a rep. Compare counts with a human observer across different lighting, camera views, bodies, clothing, and supported ranges. No real-person accuracy estimate exists yet.
- Background the app during coaching and recording. Camera use should stop. Check silent recording, discard, review, attach, private upload, account isolation, disconnect, and deletion with real staging patient/clinician accounts.
- Open the native **Alerts** control, choose weekdays/time, and opt in. Lock the phone and verify actual delivery. Focus and OS settings can suppress presentation. The native weekly schedule is independent of web/calendar reminders and does not cancel itself after a completed routine. Cancel it from Alerts when no longer needed.
- Export the journal, calendar, visit summary, and PDF. The native share sheet lets the user choose a destination. Nothing sends automatically.

## Development builds and App Store work

`mobile/eas.json` includes development, simulator preview, and production profiles. Replace `dev.rebound.recovery` with your own bundle identifier before registering a release. With your own Expo/EAS and Apple credentials, a typical development workflow is:

```sh
cd mobile
npx eas-cli login
npx eas-cli build --platform ios --profile development
npx expo start --dev-client
```

Apple signing, device registration, membership, privacy disclosures, clinical review, and review requirements are separate prerequisites. Expo Go is for development. This change produces a checked iOS JavaScript bundle, not a signed IPA or App Store submission. Xcode, an iOS simulator, and a physical iPhone are unavailable in the cloud workspace used for implementation.

The website also needs a production HTTPS host. Live Clinic and optional AI explanation require the services described in [CLINIC-SETUP.md](CLINIC-SETUP.md).
