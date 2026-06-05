import { describe, expect, it } from "vitest";

import { getSettings } from "./settings.js";

describe("settings boundary", () => {
  it("returns inert static defaults without exposing a secret value", () => {
    expect(getSettings()).toEqual({
      openRouterModel: "unset",
      hasOpenRouterCredential: false
    });
  });
});
