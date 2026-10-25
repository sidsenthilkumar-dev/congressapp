# Rebound HTTPS website release

Release target: **https://sidsenthilkumar-dev.github.io/congressapp/**. The source remains on `rebound-mvp`; `gh-pages` contains only compiled static release files. `main` is not changed.

## Hosting activation

The cloud workspace can push repository branches, but GitHub’s Pages settings API and the public `github.io` verification request return `Forbidden`, including after additional network permission was granted. Publishing files does not prove that hosting is active. If the site has not already been activated, the repository owner must open:

<https://github.com/sidsenthilkumar-dev/congressapp/settings/pages>

Under **Build and deployment**, choose **Deploy from a branch**, select **gh-pages**, folder **/ (root)**, and save. GitHub then builds the site. Open the HTTPS target above after that build finishes. This setting cannot be changed from the current workspace’s GitHub API access. This is an access limitation, not a request for a second approval to release.

## Publish a reviewed update

With a clean committed source checkout and repository push access:

```sh
npm ci
npm run release:web -- --dry-run
npm run release:web
```

The release script builds with `/congressapp/` as Vite’s base, includes the local pose assets and license notices, adds `.nojekyll` and a `rebound-release.json` revision marker, then uses a separate Git index to publish only the built files. It does not switch branches, rewrite `main`, force-push, stage source files into the site, or include `.env`/server credentials. It refuses to overwrite an unrelated existing publishing branch. A dry run prepares and lists the artifact tree without pushing it.

Camera runtime URLs, fonts, icons, manifest identity, notification-worker scope, and optional Clinic email redirects respect the application base path. Root-domain deployments remain supported with the default build. Native WebView URL validation also accepts the hosted project path and rejects other applications on the same origin.

## Verify the release path locally

```sh
npm run build -- --base /congressapp/ --outDir /tmp/rebound-prefix-check
npm run preview -- --port 4191 --strictPort --base /congressapp/ --outDir /tmp/rebound-prefix-check
```

In another terminal, `node scripts/verify-pages.mjs` checks the page, icon, manifest, local MediaPipe initialization/inference with a synthetic camera stream, full-screen viewport/counter, stream cleanup, and notification-worker scope under `/congressapp/`. Set `CHROMIUM_PATH` if Chromium is not `/usr/bin/chromium`. These checks are not real-person accuracy or physical-iPhone validation.

The website and iPhone client use the same full-screen camera stage. Browser tests cover phone and desktop viewport bounds, the counter, focus handling, pause/exit, native host permission sequencing, and cleanup. The normal website layout is unchanged.

## Connect Expo Go

Use updated web/mobile source. Once hosting is active:

```sh
REBOUND_APP_URL=https://sidsenthilkumar-dev.github.io/congressapp/ npm run iphone
```

Scan the Expo QR code, allow Camera for Expo Go, then enable the camera in a cleared exercise. The WebView document is HTTPS; Metro can still use the usual `exp://` LAN connection. Published origins, temporary tunnel origins, and old local previews have separate browser journals/routines; the site does not silently migrate local history or sign-ins.

The default `npm run iphone` also now uses HTTPS via a temporary public static preview. HTTP LAN preview is explicitly `npm run iphone -- --lan-web`; live camera coaching is unavailable there. An HTTPS page whose browser does not expose camera capture gets a specific Expo/iOS/Safari instruction instead of incorrectly claiming that its address is HTTP.

This release publishes the client prototype. Live Clinic/AI services still require their own configured authentication and backend. No App Store release or newly trained human-video model is included.
