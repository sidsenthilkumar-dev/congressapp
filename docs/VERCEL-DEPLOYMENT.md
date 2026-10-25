# Deploy Rebound to Vercel

The production configuration is prepared in `vercel.json`. The current application source is on **`rebound-mvp`**, not `main`. Vercel should build this repository’s root directory as a Vite project.

## Account handoff

No Vercel token, linked project, or cached Vercel login was available in the cloud workspace. Vercel CLI 65.2.0 was installed and login was attempted, but authentication failed; direct requests to Vercel’s account/API endpoints returned a network-proxy `403 Forbidden`. The production build succeeds locally. A live Vercel deployment has **not** been verified or claimed.

Deploy the exact prepared branch through Vercel’s browser flow:

<https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsidsenthilkumar-dev%2Fcongressapp%2Ftree%2Frebound-mvp>

This flow may offer to create a repository copy in the account you choose. To retain the existing repository connection instead, open <https://vercel.com/new>, import **sidsenthilkumar-dev/congressapp**, and choose **rebound-mvp** as the source/production branch. Do not deploy the older `main` version by accident. Review the project/account choice and click Deploy.

Use these settings; the committed configuration supplies the build settings:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | Repository root (`.`) |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | `dist` |
| Environment variables for core UI/camera | None |

The install hook prepares the local pose runtime and model files. The build uses root-domain paths, without GitHub Pages’ `/congressapp/` prefix. The camera permission policy permits the site itself and disables microphone capture; exercise coaching uses silent video. There is no catch-all rewrite that could substitute HTML for a missing WASM/model file. `.vercelignore` excludes unrelated development folders and local environment files from CLI uploads. Credentials are never part of this repository.

## Verify after deployment

Use the actual HTTPS production URL shown by Vercel; no `vercel.app` hostname is invented here. Open the site in Safari and a desktop browser, then test an individually cleared camera movement. Check camera permission, full-screen view/counter, correction cues, pause/exit, and background cleanup. These are device checks, not a claim of validated human accuracy.

Connect an updated Expo Go client from the repository root:

```sh
REBOUND_APP_URL=https://YOUR-ACTUAL-PROJECT.vercel.app/ npm run iphone
```

The hosted mode starts Expo Go and points the client at that HTTPS site. Do not use `http://192.168…:5173` for live camera capture. Saved data belongs to the particular website origin; previous local, tunnel, Pages, and Vercel origins are separate recovery spaces.

Clinic and optional AI explanations require separately configured services as described in `CLINIC-SETUP.md`. Never place a service-role key or AI provider key in a `VITE_` variable.
