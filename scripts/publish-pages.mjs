import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const repository = "sidsenthilkumar-dev/congressapp";
const branch = "gh-pages";
const base = "/congressapp/";
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw Error(`${command} ${args[0]} failed. ${result.stderr || ""}`);
  return result.stdout?.trim() || "";
}
const work = mkdtempSync(join(tmpdir(), "rebound-pages-"));
try {
  const dry = process.argv.includes("--dry-run");
  if (!dry && run("git", ["status", "--porcelain"]))
    throw Error(
      "Commit the reviewed source changes before publishing so the release revision is accurate.",
    );
  const remote = run("git", ["remote", "get-url", "origin"]);
  if (!remote.endsWith(`${repository}.git`) && !remote.endsWith(repository))
    throw Error("The release remote does not match the Rebound repository.");
  const revision = run("git", ["rev-parse", "HEAD"]);
  const previous = run("git", ["ls-remote", "--heads", "origin", branch]).split(
    /\s/,
  )[0];
  if (previous) {
    run("git", ["fetch", "--no-tags", "origin", branch]);
    const marker = JSON.parse(
      run("git", ["show", `${previous}:rebound-release.json`]),
    );
    if (marker.application !== "Rebound")
      throw Error("The existing Pages branch is not a Rebound release.");
  }
  const output = join(work, "site");
  run(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "build", "--", "--base", base, "--outDir", output],
    { stdio: "inherit" },
  );
  writeFileSync(join(output, ".nojekyll"), "");
  writeFileSync(
    join(output, "rebound-release.json"),
    JSON.stringify(
      {
        application: "Rebound",
        source_revision: revision,
        base_path: base,
        site_url: "https://sidsenthilkumar-dev.github.io/congressapp/",
      },
      null,
      2,
    ) + "\n",
  );
  // A separate index stages only the built static site; the source index/checkout is untouched.
  const env = { ...process.env, GIT_INDEX_FILE: join(work, "index") };
  const git = ["--work-tree", output];
  run("git", [...git, "read-tree", "--empty"], { env });
  run("git", [...git, "add", "--all", "--force"], { env });
  const tree = run("git", [...git, "write-tree"], { env });
  const commit = run(
    "git",
    [
      "commit-tree",
      tree,
      ...(previous ? ["-p", previous] : []),
      "-m",
      `Publish Rebound ${revision.slice(0, 7)}`,
    ],
    { env },
  );
  if (dry) {
    console.log(
      "Static release prepared without publishing. Root files:\n" +
        run("git", ["ls-tree", "--name-only", commit]),
    );
  } else {
    run("git", ["push", "origin", `${commit}:refs/heads/${branch}`], {
      stdio: "inherit",
    });
    console.log(
      "Published static release files to gh-pages. Verify HTTPS at https://sidsenthilkumar-dev.github.io/congressapp/",
    );
    console.log(
      "If the site is not enabled, set repository Settings → Pages → Deploy from a branch → gh-pages / (root).",
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
