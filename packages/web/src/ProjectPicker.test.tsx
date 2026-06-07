// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectPicker } from "./ProjectPicker.js";
import {
  closeProject,
  createBackup,
  createDemoProject,
  createProject,
  getProject,
  openProject,
  type BackupResponse,
  type CreateDemoProjectRequest,
  type CreateProjectRequest,
  type CreateProjectResponse,
  type OpenProjectRequest,
  type ProjectOpenState
} from "./api.js";
import { useProjectOpen } from "./shell/project-open.js";
import { useReminderRefresh } from "./shell/reminder-refresh.js";

vi.mock("./api.js", () => ({
  closeProject: vi.fn(),
  createBackup: vi.fn(),
  createDemoProject: vi.fn(),
  createProject: vi.fn(),
  getProject: vi.fn(),
  openProject: vi.fn()
}));

vi.mock("./shell/reminder-refresh.js", () => ({
  useReminderRefresh: vi.fn()
}));

vi.mock("./shell/project-open.js", () => ({
  useProjectOpen: vi.fn()
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
const closeProjectMock = vi.mocked(closeProject);
const createProjectMock = vi.mocked(createProject);
const createDemoProjectMock = vi.mocked(createDemoProject);
const openProjectMock = vi.mocked(openProject);
const createBackupMock = vi.mocked(createBackup);
const refreshProjectOpenMock = vi.fn();
const refreshReminderMock = vi.fn();

beforeEach(() => {
  getProjectMock.mockReset();
  getProjectMock.mockResolvedValue({ open: false } satisfies ProjectOpenState);
  closeProjectMock.mockReset();
  closeProjectMock.mockResolvedValue({ open: false });
  createProjectMock.mockReset();
  createDemoProjectMock.mockReset();
  openProjectMock.mockReset();
  createBackupMock.mockReset();
  refreshReminderMock.mockReset();
  refreshProjectOpenMock.mockReset();
  vi.mocked(useProjectOpen).mockReturnValue({
    isProjectOpen: false,
    refreshProjectOpen: refreshProjectOpenMock
  });
  vi.mocked(useReminderRefresh).mockReturnValue({
    refreshReminder: refreshReminderMock,
    refreshSignal: 0
  });
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
    expect(refreshProjectOpenMock).toHaveBeenCalledTimes(1);
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
    expect(refreshReminderMock).not.toHaveBeenCalled();
  });

  it("refreshes durable reminders after opening a project", async () => {
    openProjectMock.mockResolvedValue({
      ok: true,
      status: projectStatus
    });

    render(<ProjectPicker />);

    fireEvent.change(screen.getByLabelText("Folder path"), {
      target: { value: "/tmp/loom/alpha" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Open Project" }));

    expect(await screen.findByText("/tmp/loom/alpha")).toBeTruthy();
    expect(refreshProjectOpenMock).toHaveBeenCalledTimes(1);
    expect(refreshReminderMock).toHaveBeenCalledTimes(1);
  });

  it("creates the demo project from the parent path and renders it as sample data", async () => {
    createDemoProjectMock.mockResolvedValue({
      ...projectStatus,
      title: "The Letter Under the Flour Bin",
      folderPath: "/tmp/loom/letter-under-flour-bin-demo",
      isDemoFixture: true
    } satisfies CreateProjectResponse);

    render(<ProjectPicker />);

    fireEvent.change(screen.getByLabelText("Parent path"), { target: { value: "/tmp/loom" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Demo Project" }));

    expect(await screen.findByText("/tmp/loom/letter-under-flour-bin-demo")).toBeTruthy();
    expect(screen.getByText("The Letter Under the Flour Bin")).toBeTruthy();
    expect(screen.getByText("Demo sample")).toBeTruthy();
    expect(createDemoProjectMock).toHaveBeenCalledWith({
      parentPath: "/tmp/loom",
      folderName: "letter-under-flour-bin-demo"
    } satisfies CreateDemoProjectRequest);
    expect(refreshProjectOpenMock).toHaveBeenCalledTimes(1);
  });

  it("closes an open project and refreshes project-open consumers", async () => {
    getProjectMock.mockResolvedValue(projectStatus satisfies ProjectOpenState);

    render(<ProjectPicker />);

    fireEvent.click(await screen.findByRole("button", { name: "Close Project" }));

    expect(await screen.findByText("No project open.")).toBeTruthy();
    expect(closeProjectMock).toHaveBeenCalledTimes(1);
    expect(refreshProjectOpenMock).toHaveBeenCalledTimes(1);
    expect(refreshReminderMock).toHaveBeenCalledTimes(1);
  });

  it("renders demo create diagnostics through the existing notice path", async () => {
    createDemoProjectMock.mockResolvedValue({
      ok: false,
      kind: "folder-exists",
      message: "A folder named \"letter-under-flour-bin-demo\" already exists."
    });

    render(<ProjectPicker />);

    fireEvent.change(screen.getByLabelText("Parent path"), { target: { value: "/tmp/loom" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Demo Project" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "folder-exists: A folder named \"letter-under-flour-bin-demo\" already exists."
    );
  });

  it("gives create inputs stable name attributes for autofill", () => {
    render(<ProjectPicker />);

    expect(screen.getByLabelText("Parent path").getAttribute("name")).toBe("parentPath");
    expect(screen.getByLabelText("Folder name").getAttribute("name")).toBe("folderName");
    expect(screen.getByLabelText("Title").getAttribute("name")).toBe("title");
    expect(screen.getByLabelText("Description").getAttribute("name")).toBe("description");
    expect(screen.getByLabelText("Folder path").getAttribute("name")).toBe("folderPath");
  });

  it("disables Create until the required fields are filled", () => {
    render(<ProjectPicker />);

    const button = screen.getByRole("button", { name: "Create Project" });
    expect(button.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Parent path"), { target: { value: "/tmp/loom" } });
    fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "alpha" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Alpha" } });

    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("disables Create Demo Project until the parent path is filled", () => {
    render(<ProjectPicker />);

    const button = screen.getByRole("button", { name: "Create Demo Project" });
    expect(button.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Parent path"), { target: { value: "/tmp/loom" } });

    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("renders request validation diagnostics", async () => {
    createProjectMock.mockResolvedValue({
      ok: false,
      kind: "invalid-request",
      message: "Project create request is invalid."
    });

    render(<ProjectPicker />);

    fireEvent.change(screen.getByLabelText("Parent path"), { target: { value: "/tmp/loom" } });
    fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "alpha" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Alpha" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "invalid-request: Project create request is invalid."
    );
  });

  it("renders an actionable create-failure diagnostic", async () => {
    createProjectMock.mockResolvedValue({
      ok: false,
      kind: "parent-missing",
      message: "The parent path does not exist: /tmp/nope"
    });

    render(<ProjectPicker />);

    fireEvent.change(screen.getByLabelText("Parent path"), { target: { value: "/tmp/nope" } });
    fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "alpha" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Alpha" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "parent-missing: The parent path does not exist: /tmp/nope"
    );
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
