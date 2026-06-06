// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell.js";
import type { RuntimeStatus } from "../api.js";

vi.mock("../ProjectPicker.js", () => ({
  ProjectPicker: () => <h2>Project Library</h2>
}));
vi.mock("../records/RecordBrowser.js", () => ({
  RecordBrowser: () => <h2>Records</h2>
}));
vi.mock("../working-set/WorkingSetView.js", () => ({
  WorkingSetView: () => <h2>Active Working Set</h2>
}));
vi.mock("../generation-brief/GenerationBriefView.js", () => ({
  GenerationBriefView: () => <h2>Generation Brief</h2>
}));
vi.mock("../preview/PromptPreviewView.js", () => ({
  PromptPreviewView: () => <h2>Validation / Prompt Preview</h2>
}));
vi.mock("../generate/GenerateView.js", () => ({
  GenerateView: () => <h2>Generate / Candidate</h2>
}));
vi.mock("../config/StoryConfigEditor.js", () => ({
  StoryConfigEditor: () => <h2>Story Configuration</h2>
}));
vi.mock("./SettingsSurface.js", () => ({
  SettingsSurface: () => <h2>Settings</h2>
}));

afterEach(() => {
  cleanup();
});

describe("AppShell", () => {
  it("promotes Generate / Candidate to an enabled route and leaves Accepted Segments disabled", () => {
    render(
      <MemoryRouter>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    const generateLink = screen.getByRole("link", { name: "Generate / Candidate" });
    expect(generateLink).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate/Candidate" })).toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Accepted Segments" }).disabled).toBe(true);

    fireEvent.click(generateLink);

    expect(screen.getByRole("heading", { name: "Generate / Candidate" })).toBeTruthy();
  });
});

const runtimeStatus: RuntimeStatus = {
  health: { status: "ok" },
  version: {
    app: { name: "Continuity Loom", version: "0.0.0" },
    templates: { version: "0.0.0", status: "stable" },
    compiler: { version: "0.0.0", status: "stable" },
    contract: { version: "1.0.0", status: "stable" }
  }
};
