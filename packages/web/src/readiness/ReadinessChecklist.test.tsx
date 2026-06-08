// @vitest-environment jsdom

import type { GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReadinessChecklist, type ReadinessChecklistActions } from "./ReadinessChecklist.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ReadinessChecklist", () => {
  it("renders active groups in spec order without the retired technical diagnostics bucket", () => {
    renderChecklist();

    const groupLabels = [
      screen.getByRole("heading", { name: "Required before prompt generation (3)" }),
      screen.getByRole("heading", { name: "Recommended for stronger output (1)" }),
      screen.getByRole("heading", { name: "Prompt length / salience risks (1)" })
    ];

    expect(groupLabels.map((label) => label.textContent)).toEqual([
      "Required before prompt generation (3)",
      "Recommended for stronger output (1)",
      "Prompt length / salience risks (1)"
    ]);
    expect(screen.queryByText(/^Technical diagnostics \(/)).toBeNull();
    expect(screen.getByRole("heading", { name: "New Validator Code" })).toBeTruthy();
  });

  it("uses author-facing titles and actions instead of raw codes as primary labels", () => {
    renderChecklist();

    expect(screen.getByRole("heading", { name: "Add the launch directive" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit launch directive" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "missing-manual-directive" })).toBeNull();

    const technicalDetails = screen.getAllByText("Technical details")[0]?.closest("details");
    expect(technicalDetails).toBeTruthy();
    expect(within(technicalDetails as HTMLElement).getAllByText("missing-manual-directive").length).toBeGreaterThan(0);
  });

  it("exposes readiness summary, counts, disclosures, and keyboard-reachable actions", () => {
    const actions = actionsFixture();
    renderChecklist({ actions });

    expect(screen.getByRole("status").textContent).toContain("Preview is blocked");
    expect(screen.getByRole("heading", { name: "Required before prompt generation (3)" })).toBeTruthy();

    const editButton = screen.getByRole("button", { name: "Edit launch directive" });
    editButton.focus();
    expect(document.activeElement).toBe(editButton);
    fireEvent.click(editButton);

    expect(actions.onFocusField).toHaveBeenCalledWith("generationSession.manual_moment_directive.must_render");
  });

  it("lets field actions move focus through the supplied callback", () => {
    render(
      <>
        <input aria-label="Launch directive" />
        <ReadinessChecklist
          readiness={readinessFixture()}
          actions={{
            ...actionsFixture(),
            onFocusField: () => screen.getByLabelText("Launch directive").focus()
          }}
        />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit launch directive" }));

    expect(document.activeElement).toBe(screen.getByLabelText("Launch directive"));
  });

  it("emits record, provider, working-set, and copy callbacks without fetching", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const actions = actionsFixture();
    renderChecklist({ actions });

    fireEvent.click(screen.getByRole("button", { name: "Open Mara Vale" }));
    fireEvent.click(screen.getByRole("button", { name: "Open provider settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Review active working set" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Copy technical JSON" })[0] as HTMLElement);

    expect(actions.onOpenRecord).toHaveBeenCalledWith("cast-a");
    expect(actions.onOpenProviderSettings).toHaveBeenCalledOnce();
    expect(actions.onOpenWorkingSet).toHaveBeenCalledOnce();
    expect(actions.onCopyTechnicalJson).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

function renderChecklist(input: { readiness?: GenerationReadiness; actions?: ReadinessChecklistActions } = {}) {
  return render(<ReadinessChecklist readiness={input.readiness ?? readinessFixture()} actions={input.actions ?? actionsFixture()} />);
}

function actionsFixture(): ReadinessChecklistActions {
  return {
    onFocusField: vi.fn(),
    onOpenRecord: vi.fn(),
    onOpenProviderSettings: vi.fn(),
    onOpenWorkingSet: vi.fn(),
    onCopyTechnicalJson: vi.fn()
  };
}

function readinessFixture(): GenerationReadiness {
  const blocker = diagnostic({
    severity: "blocker",
    code: "missing-launch-directive",
    legacyCode: "missing-manual-directive",
    title: "Add the launch directive",
    group: "required-before-prompt-generation",
    affected: [
      {
        kind: "generation-field",
        fieldPath: "generationSession.manual_moment_directive.must_render",
        displayLabel: "Launch directive",
        navTarget: "generationSession.manual_moment_directive.must_render"
      }
    ],
    actions: [
      {
        kind: "focus-field",
        label: "Edit launch directive",
        target: "generationSession.manual_moment_directive.must_render"
      }
    ]
  });
  const recommendation = diagnostic({
    severity: "warning",
    code: "local-voice-pressure-may-help",
    legacyCode: "local-voice-pressure-may-help",
    title: "Local voice pressure may help",
    group: "recommended-for-stronger-output",
    actions: [{ kind: "open-working-set", label: "Review active working set" }]
  });
  const salience = diagnostic({
    severity: "warning",
    code: "cast-salience-risk",
    legacyCode: "cast-salience-risk",
    title: "Long cast context may dilute local voice emphasis",
    group: "prompt-length-salience-risk",
    affected: [
      {
        kind: "record",
        recordId: "cast-a",
        recordType: "CAST MEMBER",
        displayLabel: "Mara Vale",
        navTarget: "/records?recordId=cast-a"
      }
    ],
    actions: [{ kind: "open-record", label: "Open Mara Vale", target: "cast-a" }]
  });
  const technical = diagnostic({
    severity: "blocker",
    code: "new-validator-code",
    legacyCode: "new-validator-code",
    title: "New Validator Code",
    group: "required-before-prompt-generation"
  });
  const provider = diagnostic({
    severity: "blocker",
    code: "provider-configuration-missing",
    legacyCode: "provider-configuration-missing",
    title: "Configure OpenRouter before generating",
    group: "required-before-prompt-generation",
    affected: [{ kind: "provider-setting", fieldPath: "openrouter.apiKey", displayLabel: "OpenRouter API key" }],
    actions: [{ kind: "open-provider-settings", label: "Open provider settings", target: "/settings" }]
  });

  return {
    status: "blocked",
    canSaveDraft: true,
    canPreview: false,
    canGenerate: false,
    blockers: [blocker, technical],
    warnings: [recommendation, salience],
    provider: {
      configured: false,
      blockers: [provider]
    },
    unsavedDraft: {
      hasUnsavedChanges: false,
      readinessMayBeStale: false
    },
    summary: {
      headline: "Preview is blocked",
      nextAction: "Add the launch directive."
    }
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
    dedupeKey: `${input.severity}:${input.code}`,
    sortKey: `${input.severity}:${input.code}`,
    technical: {
      legacyCode: input.legacyCode,
      ruleId: input.legacyCode,
      rawPaths: input.affected?.flatMap((target) => target.fieldPath ? [target.fieldPath] : []) ?? []
    }
  };
}
