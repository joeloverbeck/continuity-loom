import assert from "node:assert/strict";
import test from "node:test";

import { isAllowedAppRequest, isGuardedProviderRequest } from "./browser-session.mjs";

const guardedPaths = [
  "/api/generate",
  "/api/ideate",
  "/api/record-hygiene/analyze",
  "/api/segment-reconciliation/analyze",
  "/api/settings/openrouter/models"
];

test("blocks every local provider-send POST endpoint", () => {
  for (const path of guardedPaths) {
    assert.equal(isGuardedProviderRequest("POST", `http://127.0.0.1:4173${path}`), true);
  }
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
