// @vitest-environment jsdom

import {
  buildValidationSnapshot,
  compilePrompt,
  type CompileResult,
  type GenerationReadiness,
  type ReadinessDiagnostic,
  type ValidationRecord
} from "@loom/core";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { compile, readiness } from "../api.js";
import { PromptPreviewView } from "./PromptPreviewView.js";

vi.mock("../api.js", () => ({
  compile: vi.fn(),
  readiness: vi.fn()
}));

const writeText = vi.fn();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  writeText.mockReset();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText }
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("PromptPreviewView", () => {
  it("renders blocked readiness without rendering a prompt body", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      blockers: [diagnostic({
        severity: "blocker",
        code: "missing-launch-directive",
        legacyCode: "missing-manual-directive",
        title: "Add the launch directive",
        group: "required-before-prompt-generation"
      })]
    }));
    vi.mocked(compile).mockResolvedValue({
      ok: false,
      kind: "validation-blocked",
      validation: { blockers: [], warnings: [], isBlocked: true }
    });

    renderPreview();

    expect(await screen.findByText("Prompt preview is blocked.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Add the launch directive" })).toBeTruthy();
    expect(screen.queryByTestId("prompt-body")).toBeNull();
  });

  it("renders warning-only readiness outside an unchanged prompt body", async () => {
    const prompt = "<role>\nWrite locally.\n<final_output_instruction>";
    vi.mocked(readiness).mockResolvedValue(readinessFixture({
      warnings: [diagnostic({
        severity: "warning",
        code: "cast-salience-risk",
        legacyCode: "cast-salience-risk",
        title: "Long cast context may dilute local voice emphasis",
        group: "prompt-length-salience-risk",
        affected: [{ kind: "record", recordId: "cast-a", displayLabel: "Mara Vale" }]
      })]
    }));
    vi.mocked(compile).mockResolvedValue(compileResult(prompt));

    renderPreview();

    expect(await screen.findByRole("heading", { name: "Recommended before sending" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Long cast context may dilute local voice emphasis" })).toBeTruthy();
    const promptBody = screen.getByTestId("prompt-body");
    expect(promptBody.textContent).toBe(prompt);
    expect(promptBody.textContent).not.toContain("cast-salience-risk");
    expect(promptBody.textContent).not.toContain("Mara Vale");

    const technicalDetails = screen.getAllByText("Technical details")[0]?.closest("details");
    expect(technicalDetails).toBeTruthy();
    expect(within(technicalDetails as HTMLElement).getAllByText("cast-salience-risk").length).toBeGreaterThan(0);
  });

  it("renders clean readiness with ready affordance and prompt metadata outside the body", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));
    vi.mocked(compile).mockResolvedValue(compileResult("<role>\nWrite locally.\n<final_output_instruction>"));

    renderPreview();

    expect(await screen.findByText("Ready to generate.")).toBeTruthy();
    const promptBody = screen.getByTestId("prompt-body");
    expect(promptBody.textContent).toContain("<role>");
    expect(promptBody.textContent).toContain("<final_output_instruction>");
    expect(promptBody.textContent).not.toContain("template-1");
    expect(promptBody.textContent).not.toContain("fingerprint-1");

    const metadata = screen.getByLabelText("Prompt metadata");
    expect(within(metadata).getByText("template-1")).toBeTruthy();
    expect(within(metadata).getByText("compiler-1")).toBeTruthy();
    expect(within(metadata).getByText("contract-1")).toBeTruthy();
    expect(within(metadata).getByText("fingerprint-1")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
    expect(screen.queryByTestId("candidate-body")).toBeNull();
  });

  it("copies, searches, clears, and leaves browser storage untouched", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    const indexedDbOpen = vi.fn();
    vi.stubGlobal("indexedDB", { open: indexedDbOpen });
    const prompt = "<role>\nA long prompt line.\nAnother prompt line.";
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));
    vi.mocked(compile).mockResolvedValue(compileResult(prompt));
    writeText.mockResolvedValue(undefined);

    renderPreview();

    expect(await screen.findByTestId("prompt-body")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(prompt));
    expect(await screen.findByText("Prompt copied.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search within prompt"), { target: { value: "prompt" } });
    expect(await screen.findByText("2 matches")).toBeTruthy();
    expect(screen.getAllByText("prompt")).toHaveLength(2);
    const nextMatch = screen.getByRole("button", { name: "Next" });
    fireEvent.click(nextMatch);
    const matchNavigation = screen.getByLabelText("Prompt match navigation");
    expect(matchNavigation.previousElementSibling?.textContent).toContain("Current match 2 of 2");
    expect(screen.getByTestId("prompt-body").querySelector("mark[aria-current='true']")?.textContent).toBe("prompt");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByTestId("prompt-body")).toBeNull();
    expect(screen.queryByText("fingerprint-1")).toBeNull();
    expect(screen.getByText("No prompt is currently compiled.")).toBeTruthy();
    expect(storageSetItem).not.toHaveBeenCalled();
    expect(indexedDbOpen).not.toHaveBeenCalled();
  });

  it("refreshes the preview and replaces stale compiled state", async () => {
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));
    vi.mocked(compile)
      .mockResolvedValueOnce(compileResult("<role>\nFIRST"))
      .mockResolvedValueOnce(compileResult("<role>\nSECOND"));

    renderPreview();

    expect(await screen.findByText(/FIRST/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Refresh preview" }));

    expect(await screen.findByText(/SECOND/)).toBeTruthy();
    expect(screen.queryByText(/FIRST/)).toBeNull();
    expect(compile).toHaveBeenCalledTimes(2);
    expect(readiness).toHaveBeenCalledTimes(2);
  });

  it("clears stale prompt bytes for a required CAST MEMBER reference blocker and recovers accessibly", async () => {
    const castMemberId = "019b0298-5c00-7000-8000-0000000003b0";
    vi.mocked(readiness)
      .mockResolvedValueOnce(readinessFixture({}))
      .mockResolvedValueOnce(readinessFixture({
        blockers: [diagnostic({
          severity: "blocker",
          code: "record-reference-unselected-required",
          legacyCode: "record-reference-unselected-required",
          title: "Record Reference Unselected Required",
          group: "required-before-prompt-generation",
          affected: [{
            kind: "record",
            recordId: castMemberId,
            displayLabel: "Iven Rook dossier",
            fieldPath: "CAST MEMBER.entity_id"
          }],
          actions: [{ kind: "open-record", target: castMemberId, label: "Open Iven Rook dossier" }]
        })]
      }))
      .mockResolvedValueOnce(readinessFixture({}));
    vi.mocked(compile)
      .mockResolvedValueOnce(compileResult("<role>\nFIRST", "fingerprint-first"))
      .mockResolvedValueOnce({
        ok: false,
        kind: "validation-blocked",
        validation: {
          blockers: [{
            severity: "blocker",
            code: "record-reference-unselected-required",
            message: "Required CAST MEMBER reference is unselected.",
            affected: [],
            whyItMatters: "The cast dossier needs its linked entity.",
            suggestedActions: ["revise"]
          }],
          warnings: [],
          isBlocked: true
        }
      })
      .mockResolvedValueOnce(compileResult("<role>\nSECOND", "fingerprint-second"));

    renderPreview();
    expect(await screen.findByText(/FIRST/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Refresh preview" }));

    expect(await screen.findByRole("heading", { name: "Record Reference Unselected Required" })).toBeTruthy();
    expect(screen.queryByTestId("prompt-body")).toBeNull();
    expect(screen.queryByText(/FIRST/)).toBeNull();
    expect(screen.queryByText("fingerprint-first")).toBeNull();
    const repairAction = screen.getByRole("button", { name: "Open Iven Rook dossier" });
    repairAction.focus();
    expect(document.activeElement).toBe(repairAction);

    fireEvent.click(screen.getByRole("button", { name: "Refresh preview" }));

    expect(await screen.findByText(/SECOND/)).toBeTruthy();
    expect(screen.getByText("fingerprint-second")).toBeTruthy();
    expect(screen.queryByText(/FIRST/)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Record Reference Unselected Required" })).toBeNull();
    expect(compile).toHaveBeenCalledTimes(3);
    expect(readiness).toHaveBeenCalledTimes(3);
  });

  it("shows a selected non-person entity's material-pressure description while excluding a person entity", async () => {
    // #113 (F004): Prompt Preview coverage. The preview renders the real compiled non-person entity
    // description but never the person entity's short_description, which the compiler excludes.
    const prompt = compiledEntityPrompt();
    vi.mocked(readiness).mockResolvedValue(readinessFixture({}));
    vi.mocked(compile).mockResolvedValue(compileResult(prompt));

    renderPreview();

    const promptBody = await screen.findByTestId("prompt-body");
    expect(promptBody.textContent).toContain(
      "Harbor Board - institution; A licensing board that can revoke the dock permit tonight."
    );
    expect(promptBody.textContent).not.toContain(
      "An offstage supervisor whose certification deadline drives the refusal."
    );
  });

  it.each([
    [{ ok: false as const, kind: "no-open-project", message: "No open project." }, "Open a project first."],
    [
      { ok: false as const, kind: "malformed-validation-source", message: "Validation source is malformed." },
      "Validation source is malformed."
    ]
  ])("renders structured errors without a prompt element", async (response, message) => {
    vi.mocked(readiness).mockResolvedValue(response);
    vi.mocked(compile).mockResolvedValue(compileResult("<role>"));

    renderPreview();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByTestId("prompt-body")).toBeNull();
  });
});

function renderPreview() {
  return render(
    <MemoryRouter>
      <PromptPreviewView />
    </MemoryRouter>
  );
}

function entityMeta(id: string, displayLabel: string): NonNullable<ValidationRecord["metadata"]> {
  return {
    id,
    type: "test",
    displayLabel,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z",
    archived: false
  };
}

function compiledEntityPrompt(): string {
  const nonPersonId = "019b0298-5c00-7000-8000-0000000003a0";
  const personId = "019b0298-5c00-7000-8000-0000000003a1";
  const records: ValidationRecord[] = [
    {
      id: nonPersonId,
      type: "ENTITY",
      metadata: entityMeta(nonPersonId, "Harbor Board"),
      payload: {
        id: nonPersonId,
        display_name: "Harbor Board",
        entity_kind: "institution",
        roles_in_story: ["authority"],
        short_description: "A licensing board that can revoke the dock permit tonight."
      }
    },
    {
      id: personId,
      type: "ENTITY",
      metadata: entityMeta(personId, "Iven"),
      payload: {
        id: personId,
        display_name: "Iven",
        entity_kind: "person",
        roles_in_story: [],
        short_description: "An offstage supervisor whose certification deadline drives the refusal."
      }
    }
  ];

  return compilePrompt(
    buildValidationSnapshot({
      records,
      generationSession: { current_cast_voice_pressure: [], cast_voice_overrides: [] },
      storyConfig: {},
      versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
    })
  ).prompt;
}

function compileResult(prompt: string, fingerprint = "fingerprint-1"): CompileResult {
  return {
    prompt,
    metadata: {
      versions: {
        template: "template-1",
        compiler: "compiler-1",
        contract: "contract-1"
      },
      fingerprint,
      lengthEstimate: prompt.length,
      tokenEstimate: 7
    }
  };
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
      ? { headline: "Prompt preview is blocked", nextAction: "Fix blockers." }
      : warnings.length > 0
        ? { headline: "Ready with recommendations", nextAction: "Review warnings if useful." }
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
    actions: input.actions ?? [{ kind: "copy-technical-json", label: "Copy technical JSON" }],
    dedupeKey: `${input.severity}:${input.code}`,
    sortKey: `${input.severity}:${input.code}`,
    technical: {
      legacyCode: input.legacyCode,
      ruleId: input.legacyCode,
      rawPaths: input.affected?.flatMap((target) => target.fieldPath ? [target.fieldPath] : []) ?? []
    }
  };
}
