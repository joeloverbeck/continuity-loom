import type { MouseEvent, ReactNode } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";

import type { RuntimeStatus } from "../api.js";
import { ProjectPicker } from "../ProjectPicker.js";
import { AcceptedSegmentsView } from "../accepted-segments/AcceptedSegmentsView.js";
import { StoryConfigEditor } from "../config/StoryConfigEditor.js";
import { GenerationBriefView } from "../generation-brief/GenerationBriefView.js";
import { GenerateView } from "../generate/GenerateView.js";
import { PromptPreviewView } from "../preview/PromptPreviewView.js";
import { RecordBrowser } from "../records/RecordBrowser.js";
import { WorkingSetView } from "../working-set/WorkingSetView.js";
import { DurableChangeReminder } from "./DurableChangeReminder.js";
import { ErrorBoundary } from "./ErrorBoundary.js";
import { ProjectOpenProvider, useProjectOpen } from "./project-open.js";
import { ReminderRefreshProvider } from "./reminder-refresh.js";
import { SettingsSurface } from "./SettingsSurface.js";

interface AppShellProps {
  loadState:
    | { status: "loading" }
    | { status: "ready"; runtime: RuntimeStatus }
    | { status: "error" };
}

const primaryRoutes = [
  { to: "/", label: "Project Library", requiresProject: false },
  { to: "/records", label: "Records", requiresProject: true },
  { to: "/working-set", label: "Active Working Set", requiresProject: true },
  { to: "/generation-brief", label: "Generation Brief", requiresProject: true },
  { to: "/preview", label: "Validation / Prompt Preview", requiresProject: true },
  { to: "/generate", label: "Generate / Candidate", requiresProject: true },
  { to: "/accepted-segments", label: "Accepted Segments", requiresProject: true },
  { to: "/story-config", label: "Story Configuration", requiresProject: true },
  { to: "/settings", label: "Settings", requiresProject: false }
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
    <ProjectOpenProvider>
      <AppShellContent loadState={loadState} />
    </ProjectOpenProvider>
  );
}

function AppShellContent({ loadState }: AppShellProps): React.JSX.Element {
  const location = useLocation();
  const { isProjectOpen } = useProjectOpen();

  return (
    <main className="appFrame">
      <aside className="sidebar" aria-label="Primary">
        <RuntimePanel loadState={loadState} />
        <nav className="primaryNav">
          {primaryRoutes.map((route) => {
            const isDisabled = route.requiresProject && isProjectOpen === false;

            return (
              <NavLink
                key={route.to}
                to={route.to}
                end={route.to === "/"}
                {...(isDisabled
                  ? {
                      "aria-disabled": true,
                      className: "disabledNavLink",
                      onClick: preventDisabledNavigation,
                      tabIndex: -1,
                      title: "Open a project first."
                    }
                  : {})}
              >
                {route.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="contentPane">
        <ReminderRefreshProvider>
          <DurableChangeReminder />
          <ErrorBoundary resetKey={`${location.pathname}${location.search}`}>
            <Routes>
              <Route path="/" element={<ProjectPicker />} />
              <Route path="/records" element={<RequireProject><RecordBrowser /></RequireProject>} />
              <Route path="/working-set" element={<RequireProject><WorkingSetView /></RequireProject>} />
              <Route path="/generation-brief" element={<RequireProject><GenerationBriefView /></RequireProject>} />
              <Route path="/preview" element={<RequireProject><PromptPreviewView /></RequireProject>} />
              <Route path="/generate" element={<RequireProject><GenerateView /></RequireProject>} />
              <Route path="/accepted-segments" element={<RequireProject><AcceptedSegmentsView /></RequireProject>} />
              <Route path="/story-config" element={<RequireProject><StoryConfigEditor /></RequireProject>} />
              <Route path="/settings" element={<SettingsSurface />} />
            </Routes>
          </ErrorBoundary>
        </ReminderRefreshProvider>
      </div>
    </main>
  );
}

function preventDisabledNavigation(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
}

function RequireProject({ children }: { children: ReactNode }): React.JSX.Element {
  const { isProjectOpen } = useProjectOpen();

  if (isProjectOpen === undefined) {
    return (
      <section className="projectRequiredPanel" aria-labelledby="project-required-title">
        <h2 id="project-required-title">Checking project status</h2>
        <p className="muted" role="status">Checking for an open project.</p>
      </section>
    );
  }

  if (!isProjectOpen) {
    return (
      <section className="projectRequiredPanel" aria-labelledby="project-required-title">
        <p className="eyebrow">Project required</p>
        <h2 id="project-required-title">Open a project first</h2>
        <p className="muted">This view uses project data.</p>
        <Link to="/">Project Library</Link>
      </section>
    );
  }

  return <>{children}</>;
}
