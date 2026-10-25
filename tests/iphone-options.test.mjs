import { test } from "node:test";
import assert from "node:assert/strict";
import { iphoneTarget } from "../scripts/iphone-options.mjs";
test("normal startup uses HTTPS; insecure screen preview must be explicitly selected", () => {
  assert.equal(iphoneTarget([], {}).mode, "https");
  assert.equal(iphoneTarget(["--https"], {}).mode, "https");
  assert.equal(iphoneTarget(["--lan-web"], {}).mode, "lan");
  assert.throws(() => iphoneTarget(["--https", "--lan-web"], {}));
});
test("a hosted project HTTPS URL skips local website mode", () => {
  const url = "https://sidsenthilkumar-dev.github.io/congressapp/";
  assert.deepEqual(iphoneTarget([], { REBOUND_APP_URL: url }), {
    mode: "hosted",
    url,
  });
  for (const url of [
    "http://192.168.1.1:5173/",
    "https://user:secret@example.com/",
    "https://example.com/?key=secret",
    "https://example.com/congressapp",
  ])
    assert.throws(() => iphoneTarget([], { REBOUND_APP_URL: url }));
});
