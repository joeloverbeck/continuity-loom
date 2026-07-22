// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildValidationSnapshot,
  deriveReadiness,
  runValidation,
  type BuildValidationSnapshotInput,
  type GenerationReadiness
} from "@loom/core";

import { RecordEditor } from "./RecordEditor.js";
import { ReadinessChecklist, type ReadinessChecklistActions } from "../readiness/ReadinessChecklist.js";

// PRD #165 / issue #168 (and the corrected field guidance from #167): one browser prompt-preview
// scenario that contrasts a hidden critical FACT against an equivalent SECRET and asserts accessible
// names and keyboard focus for the corrected FACT audience-visibility field guidance and for the
// advisory warning.

afterEach(cleanup);

const povId = "019b0298-5c00-7000-8000-000000000001";
const factId = "019b0298-5c00-7000-8000-000000000f01";
const secretId = "019b0298-5c00-7000-8000-000000000f02";
const premise = "The point-of-view character is secretly immortal.";
const WARNING_TITLE = "Hidden FACT is not concealed from the reader";

function sessionSkeleton() {
  return { current_cast_voice_pressure: [], cast_voice_overrides: [] };
}

function hiddenCriticalFactInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: factId,
        type: "FACT",
        payload: {
          id: factId,
          fact_kind: "hard_canon",
          statement: premise,
          scope: "global",
          known_by: [povId],
          audience_visibility: "hidden",
          salience: "critical"
        }
      }
    ],
    generationSession: sessionSkeleton(),
    storyConfig: {},
    versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
  };
}

function equivalentSecretInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "hidden",
          secret_kind: "body_state",
          secret_claim: premise,
          holders: [povId],
          non_holders_to_protect: "all_except_holders",
          audience_visibility: "hidden",
          pov_access: "knows",
          salience: "critical",
          allowed_surface_cues: ["Never seems to age."],
          forbidden_reveals: ["Do not state it."],
          reveal_permission: "locked",
          reveal_triggers: []
        }
      }
    ],
    generationSession: sessionSkeleton(),
    storyConfig: {},
    versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
  };
}

function readinessFor(input: BuildValidationSnapshotInput): GenerationReadiness {
  const result = runValidation(buildValidationSnapshot(input));
  return deriveReadiness(result, { configured: true }, { hasUnsavedChanges: false }, new Map());
}

const noopActions: ReadinessChecklistActions = {
  onFocusField: vi.fn(),
  onOpenRecord: vi.fn(),
  onOpenProviderSettings: vi.fn(),
  onOpenWorkingSet: vi.fn(),
  onCopyTechnicalJson: vi.fn()
};

function selectedGuidance(): HTMLElement {
  return screen.getByText(
    (_, element) =>
      element?.className === "enumSelectedValue" &&
      (element.textContent ?? "").includes("does not conceal the fact from the reader")
  );
}

describe("hidden critical FACT boundary (PRD #165 / #167 / #168)", () => {
  it("routes the corrected FACT audience-visibility field guidance to the SECRET model with an accessible, focusable control", () => {
    render(
      <RecordEditor
        recordType="FACT"
        referenceRecords={[]}
        payload={{
          id: factId,
          fact_kind: "hard_canon",
          statement: premise,
          scope: "global",
          known_by: [],
          audience_visibility: "hidden",
          salience: "critical"
        }}
      />
    );

    // Accessible name: the control is reachable by its field label, not pointer-only.
    const control = screen.getByLabelText<HTMLSelectElement>(/^audience_visibility/);
    expect(control.value).toBe("hidden");

    // Keyboard focus works.
    control.focus();
    expect(document.activeElement).toBe(control);

    // The corrected guidance tells the truth and routes to the SECRET model.
    const guidance = selectedGuidance();
    expect(guidance.textContent).toContain("model it as a SECRET (pov_access: knows, audience_visibility: hidden)");
  });

  it("surfaces the advisory warning for a hidden critical FACT with an accessible name and a focusable recovery action", () => {
    render(<ReadinessChecklist readiness={readinessFor(hiddenCriticalFactInput())} actions={noopActions} />);

    // Accessible name: the warning is exposed as a level-5 heading with a stable title.
    const heading = screen.getByRole("heading", { level: 5, name: WARNING_TITLE });
    const article = heading.closest("article");
    expect(article).not.toBeNull();
    const card = within(article!);

    // It is classified as a warning, never a blocker.
    expect(card.getByText("Warning")).toBeTruthy();

    // The recovery guidance routes to the SECRET model.
    expect(article!.textContent).toContain("model it as a SECRET (pov_access: knows, audience_visibility: hidden)");

    // Keyboard focus works on the recovery action.
    const recoveryAction = card.getByRole<HTMLButtonElement>("button", { name: /^Open / });
    recoveryAction.focus();
    expect(document.activeElement).toBe(recoveryAction);
  });

  it("does not raise the advisory FACT warning for an equivalent hidden SECRET (contrast)", () => {
    render(<ReadinessChecklist readiness={readinessFor(equivalentSecretInput())} actions={noopActions} />);

    expect(screen.queryByRole("heading", { level: 5, name: WARNING_TITLE })).toBeNull();
  });
});
