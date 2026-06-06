import { NavLink, Route, Routes } from "react-router-dom";

import type { RuntimeStatus } from "../api.js";
import { ProjectPicker } from "../ProjectPicker.js";
import { AcceptedSegmentsView } from "../accepted-segments/AcceptedSegmentsView.js";
import { StoryConfigEditor } from "../config/StoryConfigEditor.js";
import { GenerationBriefView } from "../generation-brief/GenerationBriefView.js";
import { GenerateView } from "../generate/GenerateView.js";
import { PromptPreviewView } from "../preview/PromptPreviewView.js";
import { RecordBrowser } from "../records/RecordBrowser.js";
import { WorkingSetView } from "../working-set/WorkingSetView.js";
import { SettingsSurface } from "./SettingsSurface.js";

interface AppShellProps {
  loadState:
    | { status: "loading" }
    | { status: "ready"; runtime: RuntimeStatus }
    | { status: "error" };
}

const primaryRoutes = [
  { to: "/", label: "Project Library" },
  { to: "/records", label: "Records" },
  { to: "/working-set", label: "Active Working Set" },
  { to: "/generation-brief", label: "Generation Brief" },
  { to: "/preview", label: "Validation / Prompt Preview" },
  { to: "/generate", label: "Generate / Candidate" },
  { to: "/accepted-segments", label: "Accepted Segments" },
  { to: "/story-config", label: "Story Configuration" },
  { to: "/settings", label: "Settings" }
] as const;

function RuntimePanel({ loadState }: AppShellProps): React.JSX.Element {
  return (
    <section className="runtimePanel" aria-labelledby="app-title">
      <p className="eyebrow">Local runtime</p>
      <h1 id="app-title">Continuity Loom</h1>
      {loadState.status === "loading" ? <p className="muted">Connecting to local server...</p> : null}
      {loadState.status === "error" ? (
        <p role="alert" className="status statusError">
          Cannot reach local server.
        </p>
      ) : null}
      {loadState.status === "ready" ? (
        <dl className="runtimeGrid" aria-label="Runtime status">
          <div>
            <dt>Health</dt>
            <dd>{loadState.runtime.health.status}</dd>
          </div>
          <div>
            <dt>App version</dt>
            <dd>{loadState.runtime.version.app.version}</dd>
          </div>
          <div>
            <dt>Templates</dt>
            <dd>{loadState.runtime.version.templates.status}</dd>
          </div>
          <div>
            <dt>Compiler</dt>
            <dd>{loadState.runtime.version.compiler.status}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

export function AppShell({ loadState }: AppShellProps): React.JSX.Element {
  return (
    <main className="appFrame">
      <aside className="sidebar" aria-label="Primary">
        <RuntimePanel loadState={loadState} />
        <nav className="primaryNav">
          {primaryRoutes.map((route) => (
            <NavLink key={route.to} to={route.to} end={route.to === "/"}>
              {route.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="contentPane">
        <Routes>
          <Route path="/" element={<ProjectPicker />} />
          <Route path="/records" element={<RecordBrowser />} />
          <Route path="/working-set" element={<WorkingSetView />} />
          <Route path="/generation-brief" element={<GenerationBriefView />} />
          <Route path="/preview" element={<PromptPreviewView />} />
          <Route path="/generate" element={<GenerateView />} />
          <Route path="/accepted-segments" element={<AcceptedSegmentsView />} />
          <Route path="/story-config" element={<StoryConfigEditor />} />
          <Route path="/settings" element={<SettingsSurface />} />
        </Routes>
      </div>
    </main>
  );
}
