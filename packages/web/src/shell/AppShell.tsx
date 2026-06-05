import { NavLink, Route, Routes } from "react-router-dom";

import type { RuntimeStatus } from "../api.js";
import { ProjectPicker } from "../ProjectPicker.js";
import { StoryConfigEditor } from "../config/StoryConfigEditor.js";
import { RecordBrowser } from "../records/RecordBrowser.js";

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
  { to: "/story-config", label: "Story Configuration" },
  { to: "/settings", label: "Settings" }
] as const;

const laterPhaseSurfaces = ["Generation Brief", "Validation/Preview", "Generate/Candidate", "Accepted Segments"] as const;

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

function PlaceholderSurface({ title }: { title: string }): React.JSX.Element {
  return (
    <section className="surface" aria-labelledby={`${title.replace(/\W+/g, "-").toLowerCase()}-title`}>
      <div className="projectHeader">
        <p className="eyebrow">Phase 4 surface</p>
        <h2 id={`${title.replace(/\W+/g, "-").toLowerCase()}-title`}>{title}</h2>
      </div>
      <p className="muted">Foundation route ready.</p>
    </section>
  );
}

function SettingsSurface(): React.JSX.Element {
  return (
    <section className="surface" aria-labelledby="settings-title">
      <div className="projectHeader">
        <p className="eyebrow">Local settings</p>
        <h2 id="settings-title">Settings</h2>
      </div>
      <dl className="runtimeGrid" aria-label="Settings status">
        <div>
          <dt>OpenRouter key</dt>
          <dd>Not configured</dd>
        </div>
      </dl>
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
        <div className="laterPhaseList" aria-label="Later phase surfaces">
          {laterPhaseSurfaces.map((surface) => (
            <button key={surface} type="button" disabled>
              {surface}
            </button>
          ))}
        </div>
      </aside>
      <div className="contentPane">
        <Routes>
          <Route path="/" element={<ProjectPicker />} />
          <Route path="/records" element={<RecordBrowser />} />
          <Route path="/working-set" element={<PlaceholderSurface title="Active Working Set" />} />
          <Route path="/story-config" element={<StoryConfigEditor />} />
          <Route path="/settings" element={<SettingsSurface />} />
        </Routes>
      </div>
    </main>
  );
}
