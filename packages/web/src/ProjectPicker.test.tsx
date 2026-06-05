// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectPicker } from "./ProjectPicker.js";
import {
  createBackup,
  createProject,
  getProject,
  openProject,
  type BackupResponse,
  type CreateProjectRequest,
  type CreateProjectResponse,
  type OpenProjectRequest,
  type ProjectOpenState
} from "./api.js";

vi.mock("./api.js", () => ({
  createBackup: vi.fn(),
  createProject: vi.fn(),
  getProject: vi.fn(),
  openProject: vi.fn()
}));

const projectStatus = {
  folderPath: "/tmp/loom/alpha",
  title: "Alpha",
  projectUuid: "018f9c47-81f1-7cc0-9559-6bb9865ee7d9",
  databaseFilename: "loom.sqlite",
  appSchemaVersion: 1,
  storeUserVersion: 1,
  compatibility: "ok" as const
};

const getProjectMock = vi.mocked(getProject);
const createProjectMock = vi.mocked(createProject);
const openProjectMock = vi.mocked(openProject);
const createBackupMock = vi.mocked(createBackup);

beforeEach(() => {
  getProjectMock.mockReset();
  getProjectMock.mockResolvedValue({ open: false } satisfies ProjectOpenState);
  createProjectMock.mockReset();
  openProjectMock.mockReset();
  createBackupMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("ProjectPicker", () => {
  it("creates a project and renders returned status", async () => {
    createProjectMock.mockResolvedValue(projectStatus satisfies CreateProjectResponse);

    render(<ProjectPicker />);

    fireEvent.change(screen.getByLabelText("Parent path"), { target: { value: "/tmp/loom" } });
    fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "alpha" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Alpha" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(await screen.findByText("/tmp/loom/alpha")).toBeTruthy();
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("ok")).toBeTruthy();
    expect(createProjectMock).toHaveBeenCalledWith({
      parentPath: "/tmp/loom",
      folderName: "alpha",
      title: "Alpha"
    } satisfies CreateProjectRequest);
  });

  it("renders structured open diagnostics", async () => {
    openProjectMock.mockResolvedValue({
      ok: false,
      kind: "missing-metadata",
      message: "No metadata file."
    });

    render(<ProjectPicker />);

    fireEvent.change(screen.getByLabelText("Folder path"), {
      target: { value: "/tmp/not-project" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Open Project" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "missing-metadata: No metadata file."
    );
    expect(openProjectMock).toHaveBeenCalledWith({
      folderPath: "/tmp/not-project"
    } satisfies OpenProjectRequest);
  });

  it("creates a backup and surfaces the backup path", async () => {
    getProjectMock.mockResolvedValue(projectStatus satisfies ProjectOpenState);
    createBackupMock.mockResolvedValue({
      backupPath: "/tmp/loom/alpha/backups/loom-backup.sqlite"
    } satisfies BackupResponse);

    render(<ProjectPicker />);

    fireEvent.click(await screen.findByRole("button", { name: "Create Backup Copy" }));

    expect(await screen.findByText("/tmp/loom/alpha/backups/loom-backup.sqlite")).toBeTruthy();
    expect(createBackupMock).toHaveBeenCalledTimes(1);
  });
});
