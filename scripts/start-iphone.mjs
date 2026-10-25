import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const mobile = fileURLToPath(new URL("../mobile/", import.meta.url));

function runNpm(cwd, args = ["ci"]) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      args,
      {
        cwd,
        stdio: "inherit",
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              "Dependency installation stopped. Resolve the npm error above and run npm run iphone again.",
            ),
          ),
    );
  });
}

function lanAddress() {
  const interfaces = Object.entries(networkInterfaces());
  interfaces.sort(([a], [b]) => (a === "en0" ? -1 : b === "en0" ? 1 : 0));
  for (const [, addresses] of interfaces) {
    for (const address of addresses || []) {
      if (address.family !== "IPv4" || address.internal) continue;
      if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address))
        return address.address;
    }
  }
  throw new Error(
    "Connect your Mac and iPhone to the same Wi-Fi, then run npm run iphone again. No private network address was found.",
  );
}

function freePort(preferred) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" && preferred)
        freePort(0).then(resolve, reject);
      else reject(error);
    });
    server.listen(preferred, "0.0.0.0", () => {
      const port = server.address().port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function main() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13))
    throw new Error(
      "Install Node.js LTS 22.13+ or 24.3+ before starting the iPhone client.",
    );
  if (!existsSync(new URL("../mobile/package-lock.json", import.meta.url)))
    throw new Error(
      "This download is missing mobile/. Download the latest rebound-mvp branch into a new folder.",
    );
  const address = lanAddress();
  const secure = process.argv.includes("--https");
  if (process.argv.includes("--check")) {
    console.log(
      `iPhone launcher ready. Project: ${root}\nPrivate network: ${address}\nHTTPS camera preview: ${secure ? "enabled (temporary public static preview)" : "off"}\nBoth package lockfiles found: ${existsSync(new URL("../package-lock.json", import.meta.url))}`,
    );
    return;
  }
  if (!process.argv.includes("--skip-install")) {
    console.log("Preparing the website and iPhone dependencies…");
    await runNpm(root);
    await runNpm(mobile);
    if (secure)
      await runNpm(
        fileURLToPath(new URL("../tools/https-preview/", import.meta.url)),
        ["ci", "--ignore-scripts"],
      );
  }
  if (secure) {
    console.log(
      "Building a static preview. --https shares it through a temporary public Cloudflare URL until you stop this Terminal. Camera frames stay on the phone; this is not a permanent deployment.",
    );
    await runNpm(root, ["run", "build"]);
  }
  const webPort = await freePort(5173);
  const expoPort = await freePort(8081);
  let website = `http://${address}:${webPort}`;
  const viteEntry = fileURLToPath(
    new URL("../node_modules/vite/bin/vite.js", import.meta.url),
  );
  const expoEntry = fileURLToPath(
    new URL("../mobile/node_modules/expo/bin/cli", import.meta.url),
  );
  if (!existsSync(viteEntry) || !existsSync(expoEntry))
    throw new Error(
      "Dependencies are missing. Run npm run iphone without --skip-install.",
    );
  let expo;
  let tunnel;
  const abort = new AbortController();
  let webFailure;
  const web = spawn(
    process.execPath,
    [
      viteEntry,
      ...(secure ? ["preview"] : []),
      "--host",
      secure ? "127.0.0.1" : "0.0.0.0",
      "--port",
      String(webPort),
      "--strictPort",
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  web.stdout.pipe(process.stdout);
  web.stderr.pipe(process.stderr);
  web.on("error", (error) => {
    webFailure = error;
    expo?.kill("SIGTERM");
  });
  web.on("exit", (code) => {
    webFailure = new Error(
      `The website server stopped (${code ?? "interrupted"}). Run npm run iphone again.`,
    );
    expo?.kill("SIGTERM");
  });
  let stopping = false;
  const stop = () => {
    stopping = true;
    abort.abort();
    tunnel?.stop();
    expo?.kill("SIGINT");
    web.kill("SIGTERM");
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
      if (webFailure) throw webFailure;
      try {
        const response = await fetch(`http://127.0.0.1:${webPort}`, {
          signal: AbortSignal.timeout(750),
        });
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (stopping) return;
    if (!ready)
      throw new Error(
        "The website did not start. Check the server output above.",
      );
    if (secure) {
      const { openSecurePreview } = await import("./secure-preview.mjs");
      tunnel = await openSecurePreview(`http://127.0.0.1:${webPort}`, {
        signal: abort.signal,
        onExit: () => {
          webFailure = new Error(
            "The HTTPS tunnel disconnected. Restart npm run iphone -- --https.",
          );
          expo?.kill("SIGTERM");
        },
      });
      website = tunnel.url;
      let reachable = false;
      for (let attempt = 0; attempt < 12 && !abort.signal.aborted; attempt++) {
        try {
          const response = await fetch(website, {
            signal: AbortSignal.any([abort.signal, AbortSignal.timeout(2000)]),
          });
          if (response.ok) {
            reachable = true;
            break;
          }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!reachable)
        throw new Error(
          "The HTTPS preview is not reachable yet. Restart the launcher or use a hosted HTTPS address.",
        );
    }
    if (webFailure) throw webFailure;
    console.log(
      `\nWebsite ready: ${website}\nScan the Expo QR code below with your iPhone Camera.\nThe iPhone app will use this website address automatically.\nKeep this Terminal open. Press Ctrl+C to stop both servers.\n${secure ? "HTTPS is ready for camera permission and on-device coaching." : "For live camera coaching, restart with npm run iphone -- --https."}\n`,
    );
    const code = await new Promise((resolve, reject) => {
      expo = spawn(
        process.execPath,
        [
          expoEntry,
          "start",
          "--go",
          "--lan",
          "--clear",
          "--port",
          String(expoPort),
        ],
        {
          cwd: mobile,
          stdio: "inherit",
          env: {
            ...process.env,
            EXPO_PUBLIC_APP_URL: website,
            REACT_NATIVE_PACKAGER_HOSTNAME: address,
          },
        },
      );
      expo.on("error", reject);
      expo.on("exit", resolve);
    });
    if (!stopping && webFailure) throw webFailure;
    if (!stopping && code !== 0)
      throw new Error(
        "Expo stopped. Check the Expo error above and run npm run iphone again.",
      );
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
    expo?.kill("SIGTERM");
    tunnel?.stop();
    web.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
