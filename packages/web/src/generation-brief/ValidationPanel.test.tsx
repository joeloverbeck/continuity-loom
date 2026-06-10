// @vitest-environment jsdom

import type { GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { readiness } from "../api.js";
import { ValidationPanel } from "./ValidationPanel.js";

vi.mock("../api.js", () => ({
  readiness: vi.fn()
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ValidationPanel", () => {
  it("surfaces readiness failure bodies without rendering the checklist", async () => {
    vi.mocked(readiness).mockResolvedValue({
      ok: false,
      kind: "no-open-project",
      message: "No project is open."
    });

    renderPanel();

    expect((await screen.findByRole("alert")).textContent).toBe("Open a project first.");
    expect(screen.queryByRole("heading", { name: /Ready to generate/ })).toBeNull();
  });

  it("renders dangling selected-record failures with the ids and working-set fix", async () => {
    const missingA = "019b0298-5c00-7000-8000-000000000011";
    const missingB = "019b0298-5c00-7000-8000-000000000012";
    vi.mocked(readiness).mockResolvedValue({
      ok: false,
      kind: "malformed-validation-source",
      message: "Active working set contains stale selected record ids.",
      danglingSelectedRecordIds: [missingA, missingB],
      suggestedAction: "Remove these ids from the active working set."
    });

    renderPanel();

    expect((await screen.findByRole("alert")).textContent).toBe(
      `Active working set contains stale selected record id(s): ${missingA}, ${missingB}. Remove these ids from the active working set.`
    );
    expect(screen.queryByRole("heading", { name: /Ready to generate/ })).toBeNull();
  });

  it("fetches readiness and renders the shared checklist", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [diagnostic({
        severity: "blocker",
        code: "missing-launch-directive",
        legacyCode: "missing-manual-directive",
        title: "Add the launch directive",
        group: "required-before-prompt-generation",
        affected: [{
          kind: "generation-field",
          fieldPath: "generationSession.manual_moment_directive.must_render",
          displayLabel: "Launch directive"
        }],
        actions: [{
          kind: "focus-field",
          label: "Edit launch directive",
          target: "generationSession.manual_moment_directive.must_render"
        }]
      })]
    }));

    renderPanel();

    expect(await screen.findByRole("heading", { name: "Generation is blocked" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Required before prompt generation (1)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit launch directive" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "missing-manual-directive" })).toBeNull();
  });

  it("propagates unsaved draft state into the checklist", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));

    renderPanel({ hasUnsavedChanges: true });

    expect(await screen.findByRole("heading", { name: "Draft has unsaved changes" })).toBeTruthy();
    expect(screen.getByText("This draft has unsaved changes. The readiness checklist may be stale.")).toBeTruthy();
  });

  it("navigates record, settings, and working-set actions", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [
        diagnostic({
          severity: "blocker",
          code: "cast-missing-core-dossier",
          legacyCode: "cast-missing-core-dossier",
          title: "Complete the cast dossier",
          group: "required-before-prompt-generation",
          affected: [{ kind: "record", recordId: recordId, displayLabel: "Mara Vale" }],
          actions: [{ kind: "open-record", label: "Open Mara Vale", target: recordId }]
        }),
        diagnostic({
          severity: "blocker",
          code: "provider-configuration-missing",
          legacyCode: "provider-configuration-missing",
          title: "Configure OpenRouter before generating",
          group: "required-before-prompt-generation",
          actions: [{ kind: "open-provider-settings", label: "Open provider settings", target: "/settings" }]
        }),
        diagnostic({
          severity: "warning",
          code: "stale-selected-record",
          legacyCode: "stale-selected-record",
          title: "Selected record may be stale",
          group: "recommended-for-stronger-output",
          actions: [{ kind: "open-working-set", label: "Review active working set" }]
        })
      ]
    }));

    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Open Mara Vale" }));
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe(`/records?recordId=${recordId}`));

    fireEvent.click(screen.getByRole("button", { name: "Open provider settings" }));
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/settings"));

    fireEvent.click(screen.getByRole("button", { name: "Review active working set" }));
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/working-set"));
  });

  it("focuses field diagnostics and reruns when validation key changes", async () => {
    const onFocusField = vi.fn();
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [diagnostic({
        severity: "blocker",
        code: "missing-launch-directive",
        legacyCode: "missing-manual-directive",
        title: "Add the launch directive",
        group: "required-before-prompt-generation",
        affected: [{
          kind: "generation-field",
          fieldPath: "generationSession.manual_moment_directive.must_render",
          displayLabel: "Launch directive"
        }],
        actions: [{
          kind: "focus-field",
          label: "Edit launch directive",
          target: "generationSession.manual_moment_directive.must_render"
        }]
      })]
    }));

    const { rerender } = renderPanel({ validationKey: 1, onFocusField });

    fireEvent.click(await screen.findByRole("button", { name: "Edit launch directive" }));
    expect(onFocusField).toHaveBeenCalledWith("generationSession.manual_moment_directive.must_render");

    rerender(
      <MemoryRouter initialEntries={["/generation-brief"]}>
        <Routes>
          <Route
            path="*"
            element={<><ValidationPanel validationKey={2} hasUnsavedChanges={false} onFocusField={onFocusField} /><LocationProbe /></>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(readiness).toHaveBeenCalledTimes(2));
  });
});

const recordId = "019b0298-5c00-7000-8000-000000000001";

function renderPanel(props: { validationKey?: number; hasUnsavedChanges?: boolean; onFocusField?: (field: string) => void } = {}) {
  return render(
    <MemoryRouter initialEntries={["/generation-brief"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <ValidationPanel
                validationKey={props.validationKey ?? 0}
                hasUnsavedChanges={props.hasUnsavedChanges ?? false}
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

function readinessFixture(input: {
  blockers?: readonly ReadinessDiagnostic[];
  warnings?: readonly ReadinessDiagnostic[];
}): GenerationReadiness {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];

  return {
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "ready-with-warnings" : "ready",
    canSaveDraft: true,
    canPreview: blockers.length === 0,
    canGenerate: blockers.length === 0,
    blockers,
    warnings,
    provider: { configured: true, blockers: [] },
    unsavedDraft: { hasUnsavedChanges: false, readinessMayBeStale: false },
    summary: blockers.length > 0
      ? { headline: "Generation is blocked", nextAction: "Fix blockers." }
      : { headline: "Ready to generate", nextAction: "Preview and Generate are available." }
  };
}

function diagnostic(input: {
  severity: "blocker" | "warning";
  code: string;
  legacyCode: string;
  title: string;
  group: ReadinessDiagnostic["group"];
  affected?: ReadinessDiagnostic["affected"];
  actions?: ReadinessDiagnostic["actions"];
}): ReadinessDiagnostic {
  return {
    severity: input.severity,
    code: input.code,
    title: input.title,
    group: input.group,
    summary: `${input.title} summary.`,
    whyItMatters: `${input.title} matters.`,
    fastestFix: `${input.title} fastest fix.`,
    affected: input.affected ?? [],
    actions: [
      ...(input.actions ?? []),
      { kind: "copy-technical-json", label: "Copy technical JSON" }
    ],
    dedupeKey: `${input.severity}:${input.code}:${input.title}`,
    sortKey: `${input.severity}:${input.code}:${input.title}`,
    technical: {
      legacyCode: input.legacyCode,
      ruleId: input.legacyCode,
      rawPaths: input.affected?.flatMap((target) => target.fieldPath ? [target.fieldPath] : []) ?? []
    }
  };
}
