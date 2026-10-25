import { existsSync } from "node:fs";
import { createRequire } from "node:module";

/** Temporary HTTPS for a built static preview. Never tunnels the Vite development server. */
export async function openSecurePreview(
  origin,
  { signal, onExit = () => {}, timeoutMs = 45000, createTunnel } = {},
) {
  let native;
  if (!createTunnel) {
    const require = createRequire(
      new URL("../tools/https-preview/package.json", import.meta.url),
    );
    try {
      native = require("cloudflared");
    } catch {
      throw new Error(
        "The HTTPS helper is missing. Run npm run iphone -- --https without --skip-install.",
      );
    }
    if (!existsSync(native.bin)) {
      console.log(
        "Installing Cloudflare’s tunnel helper for HTTPS camera previews…",
      );
      try {
        await native.install(native.bin, "2026.10.3");
      } catch {
        throw new Error(
          "Could not download the HTTPS helper from GitHub. Check your internet connection or use a hosted HTTPS app address.",
        );
      }
    }
  }
  signal?.throwIfAborted();
  const options = {
    "--no-autoupdate": true,
    "--http-host-header": "localhost",
    "--protocol": "http2",
  };
  const tunnel = createTunnel
    ? createTunnel(origin, options)
    : native.Tunnel.quick(origin, options);
  // Keep late process errors handled even after a failed startup removes its listeners.
  tunnel.on("error", () => {});
  let intentional = false;
  const stop = () => {
    intentional = true;
    tunnel.stop();
  };
  try {
    const url = await new Promise((resolve, reject) => {
      let url,
        connected = false;
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        tunnel.off("url", gotUrl);
        tunnel.off("connected", gotConnection);
        tunnel.off("exit", failed);
        tunnel.off("error", failed);
      };
      const failed = () => {
        cleanup();
        reject(
          new Error(
            "The HTTPS preview could not connect. Check your internet or use a hosted HTTPS app address.",
          ),
        );
      };
      const abort = () => {
        cleanup();
        reject(new Error("HTTPS preview canceled."));
      };
      const ready = () => {
        if (url && connected) {
          cleanup();
          resolve(url);
        }
      };
      const gotUrl = (value) => {
        if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(value)) {
          failed();
          return;
        }
        url = value;
        ready();
      };
      const gotConnection = () => {
        connected = true;
        ready();
      };
      const timer = setTimeout(failed, timeoutMs);
      tunnel.on("url", gotUrl);
      tunnel.on("connected", gotConnection);
      tunnel.on("exit", failed);
      tunnel.on("error", failed);
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
    });
    const failed = () => {
      if (!intentional) onExit();
    };
    tunnel.on("error", failed);
    tunnel.on("exit", failed);
    signal?.addEventListener("abort", stop, { once: true });
    return {
      url,
      stop: () => {
        signal?.removeEventListener("abort", stop);
        stop();
      },
    };
  } catch (error) {
    stop();
    throw error;
  }
}
