import assert from "node:assert/strict";
import test from "node:test";

import {
  getBrowserSessionTermination,
  isAllowedAppRequest,
  isGuardedProviderRequest
} from "./browser-session.mjs";

const guardedPaths = [
  "/api/generate",
  "/api/ideate",
  "/api/record-hygiene/analyze",
  "/api/accepted-segment-change-review/analyze",
  "/api/settings/openrouter/models"
];

test("blocks every local provider-send POST endpoint", () => {
  for (const path of guardedPaths) {
    assert.equal(isGuardedProviderRequest("POST", `http://127.0.0.1:4173${path}`), true);
  }
});

test("no longer guards the retired Segment Reconciliation provider endpoint", () => {
  assert.equal(
    isGuardedProviderRequest("POST", "http://127.0.0.1:4173/api/segment-reconciliation/analyze"),
    false
  );
});

test("does not block safe methods or unrelated local endpoints", () => {
  assert.equal(isGuardedProviderRequest("GET", "http://127.0.0.1:4173/api/generate"), false);
  assert.equal(
    isGuardedProviderRequest("PUT", "http://127.0.0.1:4173/api/settings/openrouter"),
    false
  );
  assert.equal(isGuardedProviderRequest("POST", "http://127.0.0.1:4173/api/projects"), false);
});

test("blocks direct OpenRouter requests regardless of method", () => {
  assert.equal(isGuardedProviderRequest("GET", "https://openrouter.ai/api/v1/models"), true);
  assert.equal(
    isGuardedProviderRequest("POST", "https://api.openrouter.ai/api/v1/chat/completions"),
    true
  );
});

test("allows only the app origin and its same-host websocket", () => {
  const base = "http://127.0.0.1:4173";
  assert.equal(isAllowedAppRequest(base, `${base}/assets/app.js`), true);
  assert.equal(isAllowedAppRequest(base, "ws://127.0.0.1:4173/events"), true);
  assert.equal(isAllowedAppRequest(base, "http://127.0.0.1:4174/"), false);
  assert.equal(isAllowedAppRequest(base, "https://example.com/"), false);
  assert.equal(isAllowedAppRequest(base, "wss://example.com/events"), false);
});

test("treats only shutdown.request as an expected browser-session termination", () => {
  assert.deepEqual(getBrowserSessionTermination("shutdown-request"), {
    trigger: "shutdown-request",
    expected: true,
    exitCode: 0,
    message: "Browser session closed after shutdown.request."
  });
  assert.deepEqual(getBrowserSessionTermination("SIGTERM"), {
    trigger: "signal:SIGTERM",
    expected: false,
    exitCode: 2,
    message: "Browser session received SIGTERM before shutdown.request."
  });
  assert.deepEqual(getBrowserSessionTermination("SIGINT"), {
    trigger: "signal:SIGINT",
    expected: false,
    exitCode: 2,
    message: "Browser session received SIGINT before shutdown.request."
  });
  assert.deepEqual(getBrowserSessionTermination("browser-context-close"), {
    trigger: "browser-context-close",
    expected: false,
    exitCode: 2,
    message: "Browser context closed before shutdown.request."
  });
  assert.throws(
    () => getBrowserSessionTermination("unknown"),
    /Unknown browser-session termination trigger/
  );
});
