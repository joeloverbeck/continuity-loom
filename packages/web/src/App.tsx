import { useEffect, useState } from "react";

import { fetchRuntimeStatus, type RuntimeStatus } from "./api.js";
import { ProjectPicker } from "./ProjectPicker.js";
import "./styles.css";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; runtime: RuntimeStatus }
  | { status: "error" };

export function App(): React.JSX.Element {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    void fetchRuntimeStatus()
      .then((runtime) => {
        if (active) {
          setState({ status: "ready", runtime });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: "error" });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="shell">
      <section className="panel" aria-labelledby="app-title">
        <p className="eyebrow">Local runtime</p>
        <h1 id="app-title">Continuity Loom</h1>
        {state.status === "loading" ? <p className="muted">Connecting to local server...</p> : null}
        {state.status === "error" ? (
          <p role="alert" className="status statusError">
            Cannot reach local server.
          </p>
        ) : null}
        {state.status === "ready" ? (
          <dl className="runtimeGrid" aria-label="Runtime status">
            <div>
              <dt>Health</dt>
              <dd>{state.runtime.health.status}</dd>
            </div>
            <div>
              <dt>App version</dt>
              <dd>{state.runtime.version.app.version}</dd>
            </div>
            <div>
              <dt>Templates</dt>
              <dd>{state.runtime.version.templates.status}</dd>
            </div>
            <div>
              <dt>Compiler</dt>
              <dd>{state.runtime.version.compiler.status}</dd>
            </div>
          </dl>
        ) : null}
      </section>
      <ProjectPicker />
    </main>
  );
}
