# Test Rebound on an iPhone

Rebound now includes an Expo iPhone client in `mobile/`. It combines native Recovery and Coach screens with focused, origin-restricted WebView screens, native silent video recording, local iPhone notifications, PDF creation, and the iOS share sheet. It needs a reachable web app; it does not bundle an offline copy of the website.

## One Terminal startup

In a current download of the `rebound-mvp` branch, open Terminal in the project’s main folder and run:

```sh
npm run iphone
```

The launcher checks Node, installs both sets of locked dependencies, chooses available ports, starts the website and Expo Go together, and supplies the Mac’s private network website address to the iPhone client automatically. Keep the Terminal open and scan the Expo QR code using the iPhone Camera. Both devices must be on the same Wi-Fi. This is a LAN screen preview; camera coaching still requires HTTPS and widgets still need a native build. The launcher does not sign in to Expo or Apple accounts, deploy a site, change saved files, or stop other servers. Ctrl+C stops the servers it started. If an Expo sign-in error appears, sign in to the same Expo account in Expo Go and `npx expo login` from `mobile/`.

`npm run iphone -- --check` runs the environment checks without installing or starting servers. After dependencies are installed, `npm run iphone -- --skip-install` starts both servers without reinstalling. The manual two-Terminal workflow below remains available, including for hosted HTTPS addresses.

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

## Native recovery home and widgets

The iPhone client now opens on a React Native recovery home after a short `rebound.` typing animation. It shows the saved recovery focus, actual logged sessions, the next routine, and a compact weekly view. Coach opens with the routine action and a searchable movement library. Native tabs use short transitions and respect Reduce Motion. The web deployment keeps its existing presentation. Clinic, detailed progress, routine editing, check-ins, and guided sessions still use focused WebView screens connected to the same saved data. The mobile client must connect to a web deployment containing the matching native bridge; an older deployment will not supply the recovery snapshot.

The native exercise catalogue is generated from the web catalogue. After editing exercises run `node scripts/export-mobile-catalog.mjs` from the repository root and commit the generated JSON.

Home Screen and Lock Screen widgets are implemented with WidgetKit. **They cannot run in Expo Go.** Session count sharing is off by default. Enable it under **More → Widgets & connection**, then add Rebound through iOS widget customization. Counts are local to this installation/server, not synchronized across Safari or devices. Disabling sharing or changing servers clears the shared counts. No symptoms, injury details, notes, or videos enter the widget store. iOS controls refresh timing; today’s count resets on the next local calendar day, and total counts reflect the latest app update.

For a native build, configure your own unique `ios.bundleIdentifier` and `ios.appleTeamId` in `mobile/app.json`. The dynamic config derives an App Group `group.<bundleIdentifier>` and the widget bundle ID `<bundleIdentifier>.sessions`. Provision that App Group for both targets in your Apple developer account. The `@bacons/apple-targets` plugin creates the extension during prebuild, and Expo autolinking discovers the local `ReboundWidgets` module. On a Mac with current Xcode (16+) and CocoaPods (1.16.2+), run:

```sh
cd mobile
npx expo prebuild --platform ios
npx expo run:ios --device
```

Signing and device provisioning are required. Alternatively use the EAS development build profile after configuring your Apple credentials. Generating Xcode files and exporting JavaScript in Linux does not compile or validate Swift on a device.

Physical-device checks: cold-launch the typing animation; repeat with Reduce Motion; verify the recovery counts match a newly logged session; search Coach and start a cleared routine; open/close the full-screen camera without a native toolbar covering it; background the app; add both widget sizes and Lock Screen variants; verify counts after reopening/logging; disable sharing and confirm widgets clear; change servers and confirm old counts disappear; cross midnight and daylight-saving changes; tap a widget to return to Recovery. Confirm existing recorder review, Clinic uploads, reminders, and sharing still work.
