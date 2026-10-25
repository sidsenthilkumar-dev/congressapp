import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const marker = new URL("../public/tracking-build.json", import.meta.url);
if (
  !existsSync(marker) ||
  JSON.parse(readFileSync(marker, "utf8")).trackingFix !==
    "clear-tracking-recovery-v1"
)
  throw Error(
    "This folder does not contain the current tracking fix. Download the latest rebound-mvp source.",
  );
if (process.argv.includes("--check")) {
  console.log(
    "Updated Rebound source ready. Target Vercel project: congress. Sign in with the Vercel account that owns that project.",
  );
  process.exit(0);
}
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function vercel(args, { optional = false, quiet = false } = {}) {
  const result = spawnSync(
    npm,
    ["exec", "--yes", "--package", "vercel@65.2.0", "--", "vercel", ...args],
    { cwd: root, stdio: quiet ? "ignore" : "inherit" },
  );
  if (!optional && (result.error || result.status !== 0))
    throw Error(
      "Vercel could not finish cleanly. Check the account/project message and deployment status in Vercel before retrying.",
    );
  return result.status === 0;
}
try {
  console.log(
    "Deploying the fixed Rebound app. Use the same Vercel account that owns your congress project.",
  );
  if (!vercel(["whoami"], { optional: true, quiet: true })) vercel(["login"]);
  // Let Vercel confirm the account/project instead of guessing a team ID or creating a silent copy.
  vercel(["link", "--project", "congress"]);
  vercel(["deploy", "--prod", "--yes"]);
  console.log(
    "Open the new Production/Aliased HTTPS URL printed by Vercel. Your old versioned URL still refers to its original deployment.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
