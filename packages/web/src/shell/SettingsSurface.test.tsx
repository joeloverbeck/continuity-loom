// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOpenRouterSettings,
  putOpenRouterSettings,
  refreshModels,
  type OpenRouterSettingsResponse
} from "../api.js";
import { SettingsSurface } from "./SettingsSurface.js";

vi.mock("../api.js", () => ({
  getOpenRouterSettings: vi.fn(),
  putOpenRouterSettings: vi.fn(),
  refreshModels: vi.fn()
}));

const getOpenRouterSettingsMock = vi.mocked(getOpenRouterSettings);
const putOpenRouterSettingsMock = vi.mocked(putOpenRouterSettings);
const refreshModelsMock = vi.mocked(refreshModels);

const baseSettings: OpenRouterSettingsResponse = {
  model: "openai/gpt-4.1",
  temperatureMode: "explicit",
  temperature: 0.7,
  proseMaxOutputTokens: 1800,
  assistanceMaxOutputTokens: 5200,
  proseReasoningEffort: "high",
  assistanceReasoningEffort: "low",
  topP: 0.8,
  cachedModels: [{
    id: "openai/gpt-4.1",
    name: "GPT 4.1",
    contextLength: 128000,
    supportedEfforts: ["minimal", "low", "max"]
  }],
  hasOpenRouterCredential: true
};

beforeEach(() => {
  getOpenRouterSettingsMock.mockResolvedValue(baseSettings);
  putOpenRouterSettingsMock.mockImplementation((patch) => {
    const result: OpenRouterSettingsResponse = {
      ...baseSettings,
      ...patch,
      hasOpenRouterCredential: baseSettings.hasOpenRouterCredential
    } as OpenRouterSettingsResponse;
    if (patch.topP === null) {
      delete result.topP;
    }
    if (patch.temperatureMode === "provider_default") {
      delete result.temperature;
    }
    return Promise.resolve(result);
  });
  refreshModelsMock.mockResolvedValue({ ok: true, models: baseSettings.cachedModels ?? [] });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("SettingsSurface", () => {
  it("preserves incompatible class effort intent and offers only canonical supported efforts", async () => {
    render(<SettingsSurface />);

    const proseEffort = await screen.findByLabelText<HTMLSelectElement>("Prose reasoning effort");
    const assistanceEffort = screen.getByLabelText<HTMLSelectElement>("Assistance reasoning effort");
    expect(proseEffort.value).toBe("high");
    expect(assistanceEffort.value).toBe("low");
    expect([...proseEffort.options].map((option) => option.value)).toEqual([
      "high",
      "minimal",
      "low",
      "max"
    ]);
    expect(proseEffort.options[0]?.textContent).toMatch(/high.*unsupported/i);
    expect(document.body.textContent).not.toMatch(/provider_default|none|token budget/i);
    expect(screen.getByRole("status", { name: "Prose ceiling advisory" }).textContent)
      .toContain("2048");
    expect(screen.getByRole("status", { name: "Assistance ceiling advisory" }).textContent)
      .toContain("8192");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Save settings" }).disabled).toBe(false);

    fireEvent.change(proseEffort, { target: { value: "max" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Settings saved.")).toBeTruthy();
    expect(putOpenRouterSettingsMock).toHaveBeenCalledWith(expect.objectContaining({
      proseReasoningEffort: "max",
      assistanceReasoningEffort: "low"
    }));
  });

  it("edits and saves independent Prose and Assistance ceilings", async () => {
    render(<SettingsSurface />);

    const proseCeiling = await screen.findByLabelText<HTMLInputElement>("Prose ceiling");
    const assistanceCeiling = screen.getByLabelText<HTMLInputElement>("Assistance ceiling");
    expect(proseCeiling.getAttribute("aria-describedby")).toBeTruthy();
    expect(assistanceCeiling.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText(/upper bound for Generate prose/i)).toBeTruthy();
    expect(screen.getByText(/upper bound for Ideate, Record Hygiene, Cast Possibilities, and Change Review/i))
      .toBeTruthy();
    expect(screen.getByText(/8192 is a starting allowance, not a guarantee/i)).toBeTruthy();

    fireEvent.change(proseCeiling, { target: { value: "2400" } });
    fireEvent.change(assistanceCeiling, { target: { value: "3072" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Settings saved.")).toBeTruthy();
    expect(putOpenRouterSettingsMock).toHaveBeenCalledWith(expect.objectContaining({
      proseMaxOutputTokens: 2400,
      assistanceMaxOutputTokens: 3072
    }));
  });

  it("loads current settings, edits fields, and saves the non-secret patch", async () => {
    render(<SettingsSurface />);

    const modelInput = await screen.findByLabelText("Model ID");
    fireEvent.change(modelInput, { target: { value: "anthropic/claude-sonnet-4" } });
    fireEvent.change(screen.getByLabelText("Temperature"), { target: { value: "0.4" } });
    fireEvent.change(screen.getByLabelText("Prose ceiling"), { target: { value: "2400" } });
    fireEvent.change(screen.getByLabelText("Assistance ceiling"), { target: { value: "6400" } });
    fireEvent.change(screen.getByLabelText("Top P"), { target: { value: "0.9" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Settings saved.")).toBeTruthy();
    expect(putOpenRouterSettingsMock).toHaveBeenCalledWith({
      model: "anthropic/claude-sonnet-4",
      temperatureMode: "explicit",
      temperature: 0.4,
      proseMaxOutputTokens: 2400,
      assistanceMaxOutputTokens: 6400,
      proseReasoningEffort: "high",
      assistanceReasoningEffort: "low",
      topP: 0.9,
      cachedModels: baseSettings.cachedModels
    });
  });

  it("saves provider-default temperature without a number and explicitly clears blank Top P", async () => {
    render(<SettingsSurface />);

    await screen.findByLabelText("Model ID");
    fireEvent.click(screen.getByRole("radio", { name: "Provider default" }));
    const temperature = screen.getByLabelText<HTMLInputElement>("Temperature");
    expect(temperature.disabled).toBe(true);
    expect(temperature.required).toBe(false);
    expect(screen.getByText(/omits Temperature and cannot know the provider's effective numeric value/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Top P"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Settings saved.")).toBeTruthy();
    expect(putOpenRouterSettingsMock).toHaveBeenCalledWith({
      model: "openai/gpt-4.1",
      temperatureMode: "provider_default",
      proseMaxOutputTokens: 1800,
      assistanceMaxOutputTokens: 5200,
      proseReasoningEffort: "high",
      assistanceReasoningEffort: "low",
      topP: null,
      cachedModels: baseSettings.cachedModels
    });
  });

  it("requires and enables the numeric Temperature only in explicit mode", async () => {
    const providerDefaultSettings: OpenRouterSettingsResponse = {
      model: baseSettings.model,
      temperatureMode: "provider_default",
      proseMaxOutputTokens: baseSettings.proseMaxOutputTokens,
      assistanceMaxOutputTokens: baseSettings.assistanceMaxOutputTokens,
      proseReasoningEffort: baseSettings.proseReasoningEffort,
      assistanceReasoningEffort: baseSettings.assistanceReasoningEffort,
      ...(baseSettings.topP === undefined ? {} : { topP: baseSettings.topP }),
      ...(baseSettings.cachedModels === undefined ? {} : { cachedModels: baseSettings.cachedModels }),
      hasOpenRouterCredential: baseSettings.hasOpenRouterCredential
    };
    getOpenRouterSettingsMock.mockResolvedValue(providerDefaultSettings);
    render(<SettingsSurface />);

    const providerDefault = await screen.findByRole("radio", { name: "Provider default" });
    expect((providerDefault as HTMLInputElement).checked).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>("Temperature").disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Explicit value" }));

    const temperature = screen.getByLabelText<HTMLInputElement>("Temperature");
    expect(temperature.disabled).toBe(false);
    expect(temperature.required).toBe(true);
    expect(temperature.value).toBe("1");
  });

  it("renders credential status from the boolean without a key value", async () => {
    getOpenRouterSettingsMock.mockResolvedValue({
      ...baseSettings,
      model: "model-without-secret",
      hasOpenRouterCredential: true
    });

    const { unmount } = render(<SettingsSurface />);
    expect(await screen.findByText("API key configured")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/sk-or-secret/);

    unmount();
    getOpenRouterSettingsMock.mockResolvedValue({
      ...baseSettings,
      hasOpenRouterCredential: false
    });
    render(<SettingsSurface />);

    expect(await screen.findByText("API key missing")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/sk-or-secret/);
  });

  it("applies a refreshed model choice to the manual model field", async () => {
    refreshModelsMock.mockResolvedValue({
      ok: true,
      models: [{ id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", contextLength: 200000 }]
    });
    render(<SettingsSurface />);

    await screen.findByLabelText("Model ID");
    fireEvent.click(screen.getByRole("button", { name: "Refresh model list" }));
    expect(await screen.findByText("Model list refreshed.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Model list"), { target: { value: "anthropic/claude-sonnet-4" } });
    expect(screen.getByLabelText<HTMLInputElement>("Model ID").value).toBe("anthropic/claude-sonnet-4");
  });

  it("shows refresh failures as a non-blocking notice and keeps manual entry usable", async () => {
    refreshModelsMock.mockResolvedValue({
      ok: false,
      category: "network",
      message: "Could not reach OpenRouter."
    });
    render(<SettingsSurface />);

    const modelInput = await screen.findByLabelText<HTMLInputElement>("Model ID");
    fireEvent.click(screen.getByRole("button", { name: "Refresh model list" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/^Could not reach OpenRouter\./);
    expect(modelInput.disabled).toBe(false);
    fireEvent.change(modelInput, { target: { value: "manual/model" } });
    expect(modelInput.value).toBe("manual/model");
  });

  it("presents safe provider detail, retry timing, and manual recovery accessibly without retrying", async () => {
    refreshModelsMock.mockResolvedValue({
      ok: false,
      category: "rate-limit",
      message: "OpenRouter rate limit reached. Wait before retrying.",
      providerStatus: 429,
      providerReason: "Quota window is still active.",
      retryAfter: 13
    });
    render(<SettingsSurface />);

    await screen.findByLabelText("Model ID");
    fireEvent.click(screen.getByRole("button", { name: "Refresh model list" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "OpenRouter rate limit reached. Wait before retrying. Provider status: 429. " +
      "Provider reason: Quota window is still active. Wait at least 13 seconds, then use the existing action to try again. " +
      "No retry is automatic."
    );
    expect(refreshModelsMock).toHaveBeenCalledTimes(1);
  });
});
