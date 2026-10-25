import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { openSecurePreview } from "../scripts/secure-preview.mjs";
function fixture(emit) {
  const tunnel = new EventEmitter();
  let stops = 0;
  tunnel.stop = () => stops++;
  return {
    createTunnel: (_origin, options) => {
      assert.ok(
        Object.keys(options).every((key) => key.startsWith("--")),
        "The cloudflared wrapper requires CLI flags with -- prefixes.",
      );
      setImmediate(() => emit(tunnel));
      return tunnel;
    },
    stops: () => stops,
  };
}
test("HTTPS startup waits for both an assigned address and a connected tunnel", async () => {
  const f = fixture((t) => {
    t.emit("connected", {});
    t.emit("url", "https://example-preview.trycloudflare.com");
  });
  const controller = new AbortController();
  const preview = await openSecurePreview("http://127.0.0.1:5173", {
    createTunnel: f.createTunnel,
    signal: controller.signal,
  });
  assert.equal(preview.url, "https://example-preview.trycloudflare.com");
  controller.abort();
  assert.equal(f.stops(), 1);
});
test("invalid addresses, timeout, and cancellation stop the tunnel", async () => {
  for (const emit of [
    (t) => t.emit("url", "http://example.invalid"),
    () => {},
  ]) {
    const f = fixture(emit);
    await assert.rejects(
      openSecurePreview("http://127.0.0.1:5173", {
        createTunnel: f.createTunnel,
        timeoutMs: 20,
      }),
    );
    assert.equal(f.stops(), 1);
  }
  const controller = new AbortController(),
    f = fixture(() => controller.abort());
  await assert.rejects(
    openSecurePreview("http://127.0.0.1:5173", {
      createTunnel: f.createTunnel,
      signal: controller.signal,
    }),
    /canceled/,
  );
  assert.equal(f.stops(), 1);
});
test("a tunnel failure after startup is reported to its owner", async () => {
  let tunnel,
    failures = 0;
  const f = fixture((t) => {
    tunnel = t;
    t.emit("url", "https://example-preview.trycloudflare.com");
    t.emit("connected", {});
  });
  const preview = await openSecurePreview("http://127.0.0.1:5173", {
    createTunnel: f.createTunnel,
    onExit: () => failures++,
  });
  tunnel.emit("exit", 1);
  assert.equal(failures, 1);
  preview.stop();
  tunnel.emit("exit", 0);
  assert.equal(failures, 1);
});
