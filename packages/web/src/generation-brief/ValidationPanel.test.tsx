// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { validate } from "../api.js";
import { ValidationPanel } from "./ValidationPanel.js";

vi.mock("../api.js", () => ({
  validate: vi.fn()
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ValidationPanel", () => {
  it("surfaces validate failure bodies without rendering validation results", async () => {
    vi.mocked(validate).mockResolvedValue({
      ok: false,
      kind: "no-open-project",
      message: "No project is open."
    });

    renderPanel();

    expect((await screen.findByRole("alert")).textContent).toBe("Open a project first.");
    expect(screen.queryByText(/Generation is not blocked/)).toBeNull();
    expect(screen.queryByRole("heading", { name: /Blockers/ })).toBeNull();
  });

  it("renders blockers and collapsible warnings separately with no override", async () => {
    vi.mocked(validate).mockResolvedValue({
      blockers: [
        diagnostic("blocker", "local-prose-scope-violation", "generationSession.stop_guidance.soft_unit_guidance")
      ],
      warnings: [
        diagnostic("warning", "prompt-middle-salience-risk", "records")
      ],
      isBlocked: true
    });

    renderPanel();

    expect(await screen.findByText("Generation is blocked.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Blockers (1)" })).toBeTruthy();
    expect(screen.getByText("Warnings (1)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /validate anyway|override/i })).toBeNull();
  });

  it("reports warning-only state as not blocked", async () => {
    vi.mocked(validate).mockResolvedValue({
      blockers: [],
      warnings: [diagnostic("warning", "sparse-setting-texture", "records")],
      isBlocked: false
    });

    renderPanel();

    expect(await screen.findByText("Generation is not blocked.")).toBeTruthy();
  });

  it("navigates record diagnostics to the record browser target", async () => {
    const recordId = "019b0298-5c00-7000-8000-000000000001";
    vi.mocked(validate).mockResolvedValue({
      blockers: [
        {
          ...diagnostic("blocker", "cast-missing-core-dossier", "CAST MEMBER"),
          affected: [{ recordId, field: "CAST MEMBER" }]
        }
      ],
      warnings: [],
      isBlocked: true
    });

    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "cast-missing-core-dossier" }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe(`/records?recordId=${recordId}`);
    });
  });

  it("focuses field diagnostics and reruns when validation key changes", async () => {
    const onFocusField = vi.fn();
    vi.mocked(validate).mockResolvedValue({
      blockers: [diagnostic("blocker", "missing-manual-directive", "generationSession.manual_moment_directive.must_render")],
      warnings: [],
      isBlocked: true
    });

    const { rerender } = renderPanel({ validationKey: 1, onFocusField });

    fireEvent.click(await screen.findByRole("button", { name: "missing-manual-directive" }));
    expect(onFocusField).toHaveBeenCalledWith("generationSession.manual_moment_directive.must_render");

    rerender(
      <MemoryRouter initialEntries={["/generation-brief"]}>
        <Routes>
          <Route path="*" element={<><ValidationPanel validationKey={2} onFocusField={onFocusField} /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(validate).toHaveBeenCalledTimes(2));
  });
});

function renderPanel(props: { validationKey?: number; onFocusField?: (field: string) => void } = {}) {
  return render(
    <MemoryRouter initialEntries={["/generation-brief"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <ValidationPanel
                validationKey={props.validationKey ?? 0}
                {...(props.onFocusField ? { onFocusField: props.onFocusField } : {})}
              />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

function LocationProbe(): React.JSX.Element {
  const location = useLocation();

  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function diagnostic(severity: "blocker" | "warning", code: string, field: string) {
  return {
    severity,
    code,
    message: `${code} message`,
    affected: [{ field }],
    whyItMatters: `${code} rationale`,
    suggestedActions: ["revise" as const]
  };
}
