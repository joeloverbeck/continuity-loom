// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getProject, type ProjectOpenState } from "../api.js";
import { ProjectOpenProvider, useProjectOpen } from "./project-open.js";

vi.mock("../api.js", () => ({
  getProject: vi.fn()
}));

const projectStatus = {
  folderPath: "/tmp/loom/alpha",
  title: "Alpha",
  projectUuid: "018f9c47-81f1-7cc0-9559-6bb9865ee7d9",
  databaseFilename: "loom.sqlite",
  appSchemaVersion: 1,
  storeUserVersion: 1,
  compatibility: "ok" as const
} satisfies ProjectOpenState;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProjectOpenProvider", () => {
  it("derives closed state from the project status response", async () => {
    vi.mocked(getProject).mockResolvedValue({ open: false });

    renderProvider();

    expect(await screen.findByText("closed")).toBeTruthy();
  });

  it("derives open state from a ProjectStatus response", async () => {
    vi.mocked(getProject).mockResolvedValue(projectStatus);

    renderProvider();

    expect(await screen.findByText("open")).toBeTruthy();
  });

  it("refreshes project-open state on demand", async () => {
    vi.mocked(getProject).mockResolvedValueOnce({ open: false }).mockResolvedValueOnce(projectStatus);

    renderProvider();

    expect(await screen.findByText("closed")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Refresh project open" }));

    expect(await screen.findByText("open")).toBeTruthy();
    expect(getProject).toHaveBeenCalledTimes(2);
  });
});

function renderProvider() {
  return render(
    <ProjectOpenProvider>
      <ProjectOpenProbe />
    </ProjectOpenProvider>
  );
}

function ProjectOpenProbe(): React.JSX.Element {
  const { isProjectOpen, refreshProjectOpen } = useProjectOpen();

  return (
    <>
      <output>{isProjectOpen === undefined ? "loading" : isProjectOpen ? "open" : "closed"}</output>
      <button type="button" onClick={refreshProjectOpen}>
        Refresh project open
      </button>
    </>
  );
}
