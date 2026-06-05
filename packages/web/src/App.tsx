import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { fetchRuntimeStatus, type RuntimeStatus } from "./api.js";
import { AppShell } from "./shell/AppShell.js";
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
    <BrowserRouter>
      <AppShell loadState={state} />
    </BrowserRouter>
  );
}
