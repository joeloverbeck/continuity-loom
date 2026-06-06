import type { ProjectStatus } from "@loom/core";
import { FormEvent, useEffect, useState } from "react";

import {
  createBackup,
  createDemoProject,
  createProject,
  getProject,
  openProject,
  type ProjectOperationFailure,
  type ProjectOpenState
} from "./api.js";
import { useReminderRefresh } from "./shell/reminder-refresh.js";

const DEMO_FOLDER_NAME = "letter-under-flour-bin-demo";

type Notice =
  | { tone: "error"; title: string; message: string }
  | { tone: "success"; title: string; message: string };

function isFailure(value: unknown): value is ProjectOperationFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === false
  );
}

function isProjectStatus(value: ProjectOpenState): value is ProjectStatus {
  return !("open" in value);
}

export function ProjectPicker(): React.JSX.Element {
  const [project, setProject] = useState<ProjectOpenState>({ open: false });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  const [createFields, setCreateFields] = useState({
    parentPath: "",
    folderName: "",
    title: "",
    description: ""
  });
  const [openFolderPath, setOpenFolderPath] = useState("");
  const { refreshReminder } = useReminderRefresh();

  const canCreate =
    createFields.parentPath.trim() !== "" &&
    createFields.folderName.trim() !== "" &&
    createFields.title.trim() !== "";
  const canCreateDemo = createFields.parentPath.trim() !== "";
  const canOpen = openFolderPath.trim() !== "";

  useEffect(() => {
    let active = true;

    void getProject()
      .then((status) => {
        if (active) {
          setProject(status);
        }
      })
      .catch(() => {
        if (active) {
          setNotice({
            tone: "error",
            title: "project-status",
            message: "Could not read the active project status."
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice(null);
    setBackupPath(null);

    const result = await createProject({
      parentPath: createFields.parentPath,
      folderName: createFields.folderName,
      title: createFields.title,
      ...(createFields.description ? { description: createFields.description } : {})
    });

    if (isFailure(result)) {
      setNotice({ tone: "error", title: result.kind, message: result.message });
      return;
    }

    setProject(result);
  }

  async function onCreateDemo(): Promise<void> {
    setNotice(null);
    setBackupPath(null);

    const result = await createDemoProject({
      parentPath: createFields.parentPath,
      folderName: DEMO_FOLDER_NAME
    });

    if (isFailure(result)) {
      setNotice({ tone: "error", title: result.kind, message: result.message });
      return;
    }

    setProject(result);
  }

  async function onOpen(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice(null);
    setBackupPath(null);

    const result = await openProject({ folderPath: openFolderPath });

    if (!result.ok) {
      setNotice({ tone: "error", title: result.kind, message: result.message });
      return;
    }

    setProject(result.status);
    refreshReminder();
  }

  async function onBackup(): Promise<void> {
    setNotice(null);
    const result = await createBackup();

    if (isFailure(result)) {
      setNotice({ tone: "error", title: result.kind, message: result.message });
      return;
    }

    setBackupPath(result.backupPath);
    setNotice({
      tone: "success",
      title: "backup-created",
      message: result.backupPath
    });
  }

  return (
    <section className="projectSurface" aria-labelledby="project-title">
      <div className="projectHeader">
        <p className="eyebrow">Project folder</p>
        <h2 id="project-title">Local Project</h2>
      </div>

      <div className="projectGrid">
        <form className="projectForm" onSubmit={(event) => void onCreate(event)}>
          <h3>Create</h3>
          <label>
            Parent path
            <input
              id="project-parent-path"
              name="parentPath"
              required
              value={createFields.parentPath}
              onChange={(event) =>
                setCreateFields((fields) => ({ ...fields, parentPath: event.target.value }))
              }
            />
          </label>
          <label>
            Folder name
            <input
              id="project-folder-name"
              name="folderName"
              required
              value={createFields.folderName}
              onChange={(event) =>
                setCreateFields((fields) => ({ ...fields, folderName: event.target.value }))
              }
            />
          </label>
          <label>
            Title
            <input
              id="project-title-input"
              name="title"
              required
              value={createFields.title}
              onChange={(event) =>
                setCreateFields((fields) => ({ ...fields, title: event.target.value }))
              }
            />
          </label>
          <label>
            Description
            <textarea
              id="project-description"
              name="description"
              value={createFields.description}
              onChange={(event) =>
                setCreateFields((fields) => ({ ...fields, description: event.target.value }))
              }
            />
          </label>
          <button type="submit" disabled={!canCreate}>
            Create Project
          </button>
          <button type="button" disabled={!canCreateDemo} onClick={() => void onCreateDemo()}>
            Create Demo Project
          </button>
        </form>

        <form className="projectForm" onSubmit={(event) => void onOpen(event)}>
          <h3>Open</h3>
          <label>
            Folder path
            <input
              id="project-open-folder-path"
              name="folderPath"
              required
              value={openFolderPath}
              onChange={(event) => setOpenFolderPath(event.target.value)}
            />
          </label>
          <button type="submit" disabled={!canOpen}>
            Open Project
          </button>
        </form>
      </div>

      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`status ${notice.tone === "error" ? "statusError" : "statusSuccess"}`}
        >
          <strong>{notice.title}</strong>: {notice.message}
        </p>
      ) : null}

      <section className="statusPanel" aria-label="Project status">
        {isProjectStatus(project) ? (
          <>
            <dl className="runtimeGrid">
              <div>
                <dt>Open</dt>
                <dd>true</dd>
              </div>
              <div>
                <dt>Title</dt>
                <dd>{project.title}</dd>
              </div>
              {project.isDemoFixture ? (
                <div>
                  <dt>Kind</dt>
                  <dd>Demo sample</dd>
                </div>
              ) : null}
              <div>
                <dt>Compatibility</dt>
                <dd>{project.compatibility}</dd>
              </div>
              <div>
                <dt>Store version</dt>
                <dd>
                  {project.storeUserVersion}/{project.appSchemaVersion}
                </dd>
              </div>
            </dl>
            <p className="projectPath">{project.folderPath}</p>
            <button type="button" onClick={() => void onBackup()}>
              Create Backup Copy
            </button>
            {backupPath ? <p className="projectPath">{backupPath}</p> : null}
          </>
        ) : (
          <p className="muted">No project open.</p>
        )}
      </section>
    </section>
  );
}
