// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell.js";
import { getProject } from "../api.js";
import type { ProjectOpenState, RuntimeStatus } from "../api.js";

const generationBriefMock = vi.hoisted(() => ({
  shouldThrow: false,
  viewRenders: {
    acceptedSegments: 0,
    generate: 0,
    generationBrief: 0,
    ideate: 0,
    preview: 0,
    records: 0,
    storyConfig: 0,
    workingSet: 0
  }
}));

vi.mock("../api.js", () => ({
  getProject: vi.fn()
}));

vi.mock("../ProjectPicker.js", () => ({
  ProjectPicker: () => <h2>Project Library</h2>
}));
vi.mock("../records/RecordBrowser.js", () => ({
  RecordBrowser: () => {
    generationBriefMock.viewRenders.records += 1;
    return <h2>Records</h2>;
  }
}));
vi.mock("../working-set/WorkingSetView.js", () => ({
  WorkingSetView: () => {
    generationBriefMock.viewRenders.workingSet += 1;
    return <h2>Active Working Set</h2>;
  }
}));
vi.mock("../generation-brief/GenerationBriefView.js", () => ({
  GenerationBriefView: () => {
    generationBriefMock.viewRenders.generationBrief += 1;
    if (generationBriefMock.shouldThrow) {
      throw new Error("Generation Brief render failed");
    }

    return <h2>Generation Brief</h2>;
  }
}));
vi.mock("../preview/PromptPreviewView.js", () => ({
  PromptPreviewView: () => {
    generationBriefMock.viewRenders.preview += 1;
    return <h2>Validation / Prompt Preview</h2>;
  }
}));
vi.mock("../generate/GenerateView.js", () => ({
  GenerateView: () => {
    generationBriefMock.viewRenders.generate += 1;
    return <h2>Generate / Candidate</h2>;
  }
}));
vi.mock("../ideate/IdeateView.js", () => ({
  IdeateView: () => {
    generationBriefMock.viewRenders.ideate += 1;
    return <h2>Ideate</h2>;
  }
}));
vi.mock("../accepted-segments/AcceptedSegmentsView.js", () => ({
  AcceptedSegmentsView: () => {
    generationBriefMock.viewRenders.acceptedSegments += 1;
    return <h2>Accepted Segments</h2>;
  }
}));
vi.mock("../config/StoryConfigEditor.js", () => ({
  StoryConfigEditor: () => {
    generationBriefMock.viewRenders.storyConfig += 1;
    return <h2>Story Configuration</h2>;
  }
}));
vi.mock("./SettingsSurface.js", () => ({
  SettingsSurface: () => <h2>Settings</h2>
}));
vi.mock("./DurableChangeReminder.js", () => ({
  DurableChangeReminder: () => <aside aria-label="Durable-change reminder mount" />
}));

beforeEach(() => {
  generationBriefMock.shouldThrow = false;
  resetViewRenders();
  vi.mocked(getProject).mockReset();
  vi.mocked(getProject).mockResolvedValue(projectStatus);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AppShell", () => {
  it("promotes Generate / Candidate, Ideate, and Accepted Segments to enabled routes", async () => {
    render(
      <MemoryRouter>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    const generateLink = screen.getByRole("link", { name: "Generate / Candidate" });
    const ideateLink = screen.getByRole("link", { name: "Ideate" });
    const acceptedSegmentsLink = screen.getByRole("link", { name: "Accepted Segments" });
    expect(generateLink).toBeTruthy();
    expect(ideateLink).toBeTruthy();
    expect(acceptedSegmentsLink).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate/Candidate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Accepted Segments" })).toBeNull();

    fireEvent.click(generateLink);

    expect(await screen.findByRole("heading", { name: "Generate / Candidate" })).toBeTruthy();

    fireEvent.click(ideateLink);

    expect(await screen.findByRole("heading", { name: "Ideate" })).toBeTruthy();

    fireEvent.click(acceptedSegmentsLink);

    expect(await screen.findByRole("heading", { name: "Accepted Segments" })).toBeTruthy();
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

  it("contains a routed view render error while keeping navigation mounted", async () => {
    generationBriefMock.shouldThrow = true;

    render(
      <MemoryRouter initialEntries={["/generation-brief"]}>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    const primaryNav = screen.getByRole("navigation");
    expect(await screen.findByRole("heading", { name: "Something went wrong in this view" })).toBeTruthy();
    expect(within(primaryNav).getByRole("link", { name: "Project Library" })).toBeTruthy();
    expect(within(primaryNav).getByRole("link", { name: "Records" })).toBeTruthy();

    generationBriefMock.shouldThrow = false;
    fireEvent.click(within(primaryNav).getByRole("link", { name: "Project Library" }));

    expect(await screen.findByRole("heading", { name: "Project Library" })).toBeTruthy();
  });

  it("disables project-scoped nav when no project is open", async () => {
    vi.mocked(getProject).mockResolvedValue({ open: false });

    render(
      <MemoryRouter>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    const primaryNav = screen.getByRole("navigation");
    const projectLibraryLink = within(primaryNav).getByRole("link", { name: "Project Library" });
    const settingsLink = within(primaryNav).getByRole("link", { name: "Settings" });
    const guardedLinks = [
      "Records",
      "Active Working Set",
      "Generation Brief",
      "Validation / Prompt Preview",
      "Generate / Candidate",
      "Ideate",
      "Accepted Segments",
      "Story Configuration"
    ].map((name) => within(primaryNav).getByRole("link", { name }));

    await waitFor(() => {
      for (const link of guardedLinks) {
        expect(link.getAttribute("aria-disabled")).toBe("true");
      }
    });

    expect(projectLibraryLink.getAttribute("aria-disabled")).toBeNull();
    expect(settingsLink.getAttribute("aria-disabled")).toBeNull();

    fireEvent.click(guardedLinks[0]!);

    expect(screen.getByRole("heading", { name: "Project Library" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Records" })).toBeNull();
    expect(generationBriefMock.viewRenders.records).toBe(0);
  });

  it.each([
    ["/records", "records"],
    ["/working-set", "workingSet"],
    ["/generation-brief", "generationBrief"],
    ["/preview", "preview"],
    ["/generate", "generate"],
    ["/ideate", "ideate"],
    ["/accepted-segments", "acceptedSegments"],
    ["/story-config", "storyConfig"]
  ] as const)("guards %s when no project is open", async (path, renderKey) => {
    vi.mocked(getProject).mockResolvedValue({ open: false });

    render(
      <MemoryRouter initialEntries={[path]}>
        <AppShell loadState={{ status: "ready", runtime: runtimeStatus }} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Open a project first" })).toBeTruthy();
    expect(generationBriefMock.viewRenders[renderKey]).toBe(0);
  });
});

const projectStatus = {
  folderPath: "/tmp/loom/alpha",
  title: "Alpha",
  projectUuid: "018f9c47-81f1-7cc0-9559-6bb9865ee7d9",
  databaseFilename: "loom.sqlite",
  appSchemaVersion: 1,
  storeUserVersion: 1,
  compatibility: "ok" as const
} satisfies ProjectOpenState;

const runtimeStatus: RuntimeStatus = {
  health: { status: "ok" },
  version: {
    app: { name: "Continuity Loom", version: "0.0.0" },
    templates: { version: "0.0.0", status: "stable" },
    compiler: { version: "0.0.0", status: "stable" },
    contract: { version: "1.0.0", status: "stable" }
  }
};

function resetViewRenders(): void {
  generationBriefMock.viewRenders.acceptedSegments = 0;
  generationBriefMock.viewRenders.generate = 0;
  generationBriefMock.viewRenders.generationBrief = 0;
  generationBriefMock.viewRenders.ideate = 0;
  generationBriefMock.viewRenders.preview = 0;
  generationBriefMock.viewRenders.records = 0;
  generationBriefMock.viewRenders.storyConfig = 0;
  generationBriefMock.viewRenders.workingSet = 0;
}
