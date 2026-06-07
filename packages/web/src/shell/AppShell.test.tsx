// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell.js";
import type { RuntimeStatus } from "../api.js";

const generationBriefMock = vi.hoisted(() => ({
  shouldThrow: false
}));

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
  GenerationBriefView: () => {
    if (generationBriefMock.shouldThrow) {
      throw new Error("Generation Brief render failed");
    }

    return <h2>Generation Brief</h2>;
  }
}));
vi.mock("../preview/PromptPreviewView.js", () => ({
  PromptPreviewView: () => <h2>Validation / Prompt Preview</h2>
}));
vi.mock("../generate/GenerateView.js", () => ({
  GenerateView: () => <h2>Generate / Candidate</h2>
}));
vi.mock("../accepted-segments/AcceptedSegmentsView.js", () => ({
  AcceptedSegmentsView: () => <h2>Accepted Segments</h2>
}));
vi.mock("../config/StoryConfigEditor.js", () => ({
  StoryConfigEditor: () => <h2>Story Configuration</h2>
}));
vi.mock("./SettingsSurface.js", () => ({
  SettingsSurface: () => <h2>Settings</h2>
}));
vi.mock("./DurableChangeReminder.js", () => ({
  DurableChangeReminder: () => <aside aria-label="Durable-change reminder mount" />
}));

beforeEach(() => {
  generationBriefMock.shouldThrow = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AppShell", () => {
  it("promotes Generate / Candidate and Accepted Segments to enabled routes", () => {
    render(
      <MemoryRouter>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    const generateLink = screen.getByRole("link", { name: "Generate / Candidate" });
    const acceptedSegmentsLink = screen.getByRole("link", { name: "Accepted Segments" });
    expect(generateLink).toBeTruthy();
    expect(acceptedSegmentsLink).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate/Candidate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Accepted Segments" })).toBeNull();

    fireEvent.click(generateLink);

    expect(screen.getByRole("heading", { name: "Generate / Candidate" })).toBeTruthy();

    fireEvent.click(acceptedSegmentsLink);

    expect(screen.getByRole("heading", { name: "Accepted Segments" })).toBeTruthy();
  });

  it("mounts the durable-change reminder above routed content", () => {
    render(
      <MemoryRouter>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    const contentPane = screen.getByRole("heading", { name: "Project Library" }).parentElement;
    expect(screen.getByLabelText("Durable-change reminder mount")).toBeTruthy();
    expect(contentPane?.firstElementChild).toBe(screen.getByLabelText("Durable-change reminder mount"));
  });

  it("contains a routed view render error while keeping navigation mounted", () => {
    generationBriefMock.shouldThrow = true;

    render(
      <MemoryRouter initialEntries={["/generation-brief"]}>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    const primaryNav = screen.getByRole("navigation");
    expect(screen.getByRole("heading", { name: "Something went wrong in this view" })).toBeTruthy();
    expect(within(primaryNav).getByRole("link", { name: "Project Library" })).toBeTruthy();
    expect(within(primaryNav).getByRole("link", { name: "Records" })).toBeTruthy();

    generationBriefMock.shouldThrow = false;
    fireEvent.click(within(primaryNav).getByRole("link", { name: "Project Library" }));

    expect(screen.getByRole("heading", { name: "Project Library" })).toBeTruthy();
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
