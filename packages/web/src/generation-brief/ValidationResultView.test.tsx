// @vitest-environment jsdom

import type { Diagnostic, ValidationResult } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ValidationResultView } from "./ValidationResultView.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ValidationResultView", () => {
  it("renders blockers and collapsible warnings from the provided result", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    renderView({
      blockers: [diagnostic("blocker", "local-prose-scope-violation", "generationSession.manual_directive.must_render")],
      warnings: [diagnostic("warning", "prompt-middle-salience-risk", "records")],
      isBlocked: true
    });

    expect(screen.getByText("Generation is blocked.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Blockers (1)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "local-prose-scope-violation" })).toBeTruthy();
    expect(screen.getByText("Warnings (1)")).toBeTruthy();

    fireEvent.click(screen.getByText("Warnings (1)"));

    expect(screen.getByRole("heading", { name: "Warnings" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "prompt-middle-salience-risk" })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("focuses field diagnostics and navigates record diagnostics", async () => {
    const onFocusField = vi.fn();
    const recordId = "019b0298-5c00-7000-8000-000000000001";

    renderView(
      {
        blockers: [
          diagnostic("blocker", "missing-manual-directive", "generationSession.manual_moment_directive.must_render"),
          {
            ...diagnostic("blocker", "cast-missing-core-dossier", "CAST MEMBER"),
            affected: [{ recordId, field: "CAST MEMBER" }]
          }
        ],
        warnings: [],
        isBlocked: true
      },
      { onFocusField }
    );

    fireEvent.click(screen.getByRole("button", { name: "missing-manual-directive" }));
    expect(onFocusField).toHaveBeenCalledWith("generationSession.manual_moment_directive.must_render");

    fireEvent.click(screen.getByRole("button", { name: "cast-missing-core-dossier" }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe(`/records?recordId=${recordId}`);
    });
  });
});

function renderView(result: ValidationResult, props: { onFocusField?: (field: string) => void } = {}) {
  return render(
    <MemoryRouter initialEntries={["/generation-brief"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <section className="configPanel validationPanel" aria-labelledby="validation-panel-title">
                <h3 id="validation-panel-title">VALIDATION</h3>
                <ValidationResultView result={result} {...(props.onFocusField ? { onFocusField: props.onFocusField } : {})} />
              </section>
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

function diagnostic(severity: "blocker" | "warning", code: string, field: string): Diagnostic {
  return {
    severity,
    code,
    message: `${code} message`,
    affected: [{ field }],
    whyItMatters: `${code} rationale`,
    suggestedActions: ["revise"]
  };
}
