import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  deriveReadiness,
  type Diagnostic,
  type ValidationResult
} from "../src/index.js";

describe("deriveReadiness", () => {
  it("is deterministic for identical validation, provider, draft, and label inputs", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")],
      warnings: [diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a")]
    });
    const labels = new Map([["cast-a", "Mara Vale"]]);

    expect(deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, labels)).toEqual(
      deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, labels)
    );
  });

  it.each([
    [DIAGNOSTIC_CODES.missingManualDirective, "missing-launch-directive"],
    [DIAGNOSTIC_CODES.missingImmediateHandoff, "missing-continuation-handoff"],
    [DIAGNOSTIC_CODES.localProseScopeViolation, "stop-guidance-nonlocal"],
    [DIAGNOSTIC_CODES.castSalienceRisk, "cast-salience-risk"]
  ])("keeps %s as technical legacy code while exposing author-facing code %s", (legacyCode, readinessCode) => {
    const severity = legacyCode === DIAGNOSTIC_CODES.castSalienceRisk ? "warning" : "blocker";
    const validation = validationResult({
      blockers: severity === "blocker" ? [diagnostic(severity, legacyCode, fieldFor(legacyCode))] : [],
      warnings: severity === "warning" ? [diagnostic(severity, legacyCode, "CAST MEMBER", "cast-a")] : []
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map([["cast-a", "Mara Vale"]]));
    const derived = [...readiness.blockers, ...readiness.warnings][0];

    expect(derived?.code).toBe(readinessCode);
    expect(derived?.technical.legacyCode).toBe(legacyCode);
    expect(derived?.technical.ruleId).toBe(legacyCode);
  });

  it("does not let warnings gate save, preview, or generate", () => {
    const validation = validationResult({
      warnings: [diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map([["cast-a", "Mara Vale"]]));

    expect(readiness.status).toBe("ready-with-warnings");
    expect(readiness.canSaveDraft).toBe(true);
    expect(readiness.canPreview).toBe(true);
    expect(readiness.canGenerate).toBe(true);
  });

  it("blocks preview and generate for validation blockers while save remains available", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.status).toBe("blocked");
    expect(readiness.canSaveDraft).toBe(true);
    expect(readiness.canPreview).toBe(false);
    expect(readiness.canGenerate).toBe(false);
  });

  it("uses current-state blocker copy while preserving the dynamic missing-field summary", () => {
    const validation = validationResult({
      blockers: [
        {
          ...diagnostic("blocker", DIAGNOSTIC_CODES.missingCurrentAuthoritativeState, "generationSession.current_authoritative_state"),
          message: "Current authoritative state is missing: current location, onstage entities, immediate situation summary."
        }
      ]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.blockers[0]).toMatchObject({
      code: "missing-current-state",
      title: "Complete the current state",
      group: "required-before-prompt-generation",
      summary: "Current authoritative state is missing: current location, onstage entities, immediate situation summary.",
      fastestFix: "In CURRENT AUTHORITATIVE STATE, fill current_time, current_location, onstage_entities, and immediate_situation_summary."
    });
  });

  it("uses provider configuration only for generate gating", () => {
    const readiness = deriveReadiness(validationResult({}), { configured: false }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.canPreview).toBe(true);
    expect(readiness.canGenerate).toBe(false);
    expect(readiness.provider.configured).toBe(false);
    expect(readiness.provider.blockers[0]).toMatchObject({
      code: "provider-configuration-missing",
      title: "Configure OpenRouter before generating",
      summary: "Prompt preview can still work, but sending needs a local OpenRouter credential.",
      affected: [expect.objectContaining({
        kind: "provider-setting",
        fieldPath: "openrouter.apiKey",
        displayLabel: "OpenRouter API key",
        navTarget: "/settings"
      })],
      actions: [
        { kind: "open-provider-settings", label: "Open provider settings", target: "/settings" },
        { kind: "copy-technical-json", label: "Copy technical JSON" }
      ],
      technical: {
        legacyCode: "provider-configuration-missing",
        ruleId: "provider-configuration-missing",
        rawPaths: ["openrouter.apiKey"]
      }
    });
    expect(readiness.provider.blockers[0]?.dedupeKey).toBe("blocker:provider-configuration-missing");
    expect(readiness.provider.blockers[0]?.sortKey).toBe("0:blocker:provider-configuration-missing");
  });

  it.each([
    ["one validation blocker", validationResult({ blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")] }), true, "1 required item before generation"],
    ["one provider blocker", validationResult({}), false, "1 required item before generation"],
    ["warnings only", validationResult({ warnings: [diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a")] }), true, "Ready with recommendations"],
    ["fully ready", validationResult({}), true, "Ready to generate"]
  ])("summarizes readiness for %s", (_name, validation, providerConfigured, headline) => {
    const readiness = deriveReadiness(validation, { configured: providerConfigured }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.summary.headline).toBe(headline);
  });

  it.each([
    [
      "blocked",
      validationResult({ blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")] }),
      {
        headline: "1 required item before generation",
        nextAction: "Fix the required readiness items, then refresh."
      }
    ],
    [
      "ready with warnings",
      validationResult({ warnings: [diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a")] }),
      {
        headline: "Ready with recommendations",
        nextAction: "Preview and Generate are available; review warnings if stronger output matters."
      }
    ],
    [
      "ready",
      validationResult({}),
      {
        headline: "Ready to generate",
        nextAction: "Preview and Generate are available."
      }
    ]
  ])("uses exact readiness summary copy for %s", (_name, validation, summary) => {
    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.summary).toEqual(summary);
  });

  it("pluralizes the required-item summary when provider and validation blockers are both present", () => {
    const readiness = deriveReadiness(
      validationResult({
        blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")]
      }),
      { configured: false },
      { hasUnsavedChanges: false },
      new Map()
    );

    expect(readiness.summary.headline).toBe("2 required items before generation");
  });

  it("routes fallback blockers to required readiness items", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", "new-validator-code", "versions")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.blockers[0]).toMatchObject({
      code: "new-validator-code",
      title: "New Validator Code",
      group: "required-before-prompt-generation",
      summary: "new-validator-code message",
      fastestFix: "Use suggested action: change-directive.",
      technical: {
        legacyCode: "new-validator-code",
        rawPaths: ["versions"]
      }
    });
  });

  it("routes fallback warnings to recommended readiness items", () => {
    const validation = validationResult({
      warnings: [diagnostic("warning", "new-warning-code", "versions")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.warnings[0]).toMatchObject({
      code: "new-warning-code",
      title: "New Warning Code",
      group: "recommended-for-stronger-output",
      fastestFix: "Use suggested action: revise."
    });
  });

  it("formats fallback titles without empty words from repeated separators", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", "new--validator-code", "versions")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.blockers[0]?.title).toBe("New Validator Code");
    expect(readiness.blockers[0]?.sortKey).toBe("0:blocker:new--validator-code:blocker:new--validator-code:versions:");
  });

  it("sorts readiness diagnostics by blocking group before recommendation groups", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", "zzz-blocker", "versions")],
      warnings: [
        diagnostic("warning", DIAGNOSTIC_CODES.promptMiddleSalienceRisk, "records"),
        diagnostic("warning", DIAGNOSTIC_CODES.localVoicePressureMayHelp, "generationSession.current_cast_voice_pressure")
      ]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect([
      readiness.blockers[0]?.group,
      readiness.warnings[0]?.group,
      readiness.warnings[1]?.group
    ]).toEqual([
      "required-before-prompt-generation",
      "recommended-for-stronger-output",
      "prompt-length-salience-risk"
    ]);
  });

  it("uses generic fallback repair copy when diagnostics have no suggested actions", () => {
    const validation = validationResult({
      blockers: [
        {
          ...diagnostic("blocker", "new-validator-code", "versions"),
          suggestedActions: []
        }
      ]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.blockers[0]?.fastestFix).toBe("Review the technical diagnostic details.");
  });

  it("enriches affected records with injected display labels and groups salience warnings", () => {
    const validation = validationResult({
      warnings: [
        diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a"),
        diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-b")
      ]
    });

    const readiness = deriveReadiness(
      validation,
      { configured: true },
      { hasUnsavedChanges: false },
      new Map([["cast-a", "Mara Vale"]])
    );

    expect(readiness.warnings).toHaveLength(1);
    expect(readiness.warnings[0]?.affected).toEqual([
      expect.objectContaining({ recordId: "cast-a", recordType: "CAST MEMBER", displayLabel: "Mara Vale" }),
      expect.objectContaining({ recordId: "cast-b", recordType: "CAST MEMBER", displayLabel: "CAST MEMBER cast-b" })
    ]);
    expect(readiness.warnings[0]?.technical.rawPaths).toEqual(["CAST MEMBER"]);
    expect(readiness.warnings[0]?.technical.evidence).toEqual([DIAGNOSTIC_CODES.castSalienceRisk + " message"]);
  });

  it("deduplicates repeated affected targets, actions, raw paths, and evidence while preserving distinct targets", () => {
    const first = diagnostic("blocker", "duplicate-code", "generationSession.manual_moment_directive.must_render");
    const second = {
      ...diagnostic("blocker", "duplicate-code", "generationSession.manual_moment_directive.must_render"),
      message: "second duplicate-code message"
    };
    const third = diagnostic("blocker", "duplicate-code", "generationSession.current_authoritative_state.current_location");

    const readiness = deriveReadiness(
      validationResult({ blockers: [first, second, third] }),
      { configured: true },
      { hasUnsavedChanges: false },
      new Map()
    );

    expect(readiness.blockers).toHaveLength(2);
    expect(readiness.blockers[0]?.technical.rawPaths).toEqual(["generationSession.current_authoritative_state.current_location"]);
    expect(readiness.blockers[1]?.affected).toEqual([
      expect.objectContaining({ fieldPath: "generationSession.manual_moment_directive.must_render" })
    ]);
    expect(readiness.blockers[1]?.actions).toEqual([
      { kind: "focus-field", label: "Edit launch directive", target: "generationSession.manual_moment_directive.must_render" },
      { kind: "copy-technical-json", label: "Copy technical JSON" }
    ]);
    expect(readiness.blockers[1]?.technical.rawPaths).toEqual(["generationSession.manual_moment_directive.must_render"]);
    expect(readiness.blockers[1]?.technical.evidence).toEqual([
      "duplicate-code message",
      "second duplicate-code message"
    ]);
  });

  it("maps project and technical affected targets without record actions", () => {
    const validation = validationResult({
      blockers: [
        diagnostic("blocker", "project-code", "storyConfig.default_generation_context"),
        {
          ...diagnostic("blocker", "technical-code", "versions"),
          affected: [{}]
        }
      ]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.blockers).toEqual([
      expect.objectContaining({
        affected: [expect.objectContaining({ kind: "project", displayLabel: "Default Generation Context" })]
      }),
      expect.objectContaining({
        affected: [expect.objectContaining({ kind: "technical" })],
        actions: [{ kind: "copy-technical-json", label: "Copy technical JSON" }]
      })
    ]);
  });

  it.each([
    ["generationSession.immediate_handoff.begin_after", "Edit continuation handoff"],
    ["generationSession.current_authoritative_state.current_location", "Edit current state"],
    ["generationSession.stop_guidance.soft_unit_guidance", "Edit stop guidance"],
    ["generationSession.current_cast_voice_pressure[0].current_voice_pressure", "Edit voice pressure"],
    ["generationSession.generation_validation_focus.validation_focus_tags", "Edit Generation Validation Focus Validation Focus Tags"]
  ])("uses the targeted action label for %s", (field, label) => {
    const readiness = deriveReadiness(
      validationResult({ blockers: [diagnostic("blocker", "label-code", field)] }),
      { configured: true },
      { hasUnsavedChanges: false },
      new Map()
    );

    expect(readiness.blockers[0]?.actions[0]).toEqual({ kind: "focus-field", label, target: field });
  });

  it("formats fallback record labels from uppercase record-type fields and short ids", () => {
    const readiness = deriveReadiness(
      validationResult({
        blockers: [diagnostic("blocker", "record-code", "ENTITY STATUS.location", "shortid")]
      }),
      { configured: true },
      { hasUnsavedChanges: false },
      new Map()
    );

    expect(readiness.blockers[0]?.affected[0]).toMatchObject({
      recordType: "ENTITY STATUS",
      displayLabel: "ENTITY STATUS shortid"
    });
  });

  it.each([
    ["lowercase prefix before uppercase type", "xENTITY STATUS.location"],
    ["lowercase suffix after uppercase type", "ENTITY STATUSx.location"]
  ])("does not infer record type from %s", (_name, field) => {
    const readiness = deriveReadiness(
      validationResult({
        blockers: [diagnostic("blocker", "record-code", field, "abcdefghijk")]
      }),
      { configured: true },
      { hasUnsavedChanges: false },
      new Map()
    );

    expect(readiness.blockers[0]?.affected[0]).toMatchObject({
      displayLabel: "Record abcdefgh"
    });
  });

  it("keeps warning copy non-blocking rationale fields", () => {
    const readiness = deriveReadiness(
      validationResult({ warnings: [diagnostic("warning", DIAGNOSTIC_CODES.promptMiddleSalienceRisk, "records")] }),
      { configured: true },
      { hasUnsavedChanges: false },
      new Map()
    );

    expect(readiness.warnings[0]).toMatchObject({
      code: "prompt-length-risk",
      group: "prompt-length-salience-risk",
      whyThisIsNotBlocking: "The compiler still has enough deterministic continuity authority to produce a prompt.",
      ignoringIsReasonableWhen: "The current local unit does not depend on this nuance."
    });
  });

  it("adds working-set review actions for deselect suggestions and shortens long fallback IDs", () => {
    const validation = validationResult({
      warnings: [
        {
          ...diagnostic("warning", "stale-custom-record", "lowercase.path", "record-identifier-long"),
          suggestedActions: ["deselect"]
        }
      ]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.warnings[0]?.affected[0]).toMatchObject({
      kind: "record",
      displayLabel: "Record record-i"
    });
    expect(readiness.warnings[0]?.actions).toEqual([
      { kind: "open-record", label: "Open Record record-i", target: "record-identifier-long" },
      { kind: "open-working-set", label: "Review active working set" },
      { kind: "copy-technical-json", label: "Copy technical JSON" }
    ]);
  });

  it("marks unsaved drafts as stale without making the draft unsaveable", () => {
    const readiness = deriveReadiness(validationResult({}), { configured: true }, { hasUnsavedChanges: true }, new Map());

    expect(readiness.status).toBe("draft");
    expect(readiness.canSaveDraft).toBe(true);
    expect(readiness.summary).toEqual({
      headline: "Draft has unsaved changes",
      nextAction: "Save the draft before trusting this readiness result."
    });
    expect(readiness.unsavedDraft).toEqual({
      hasUnsavedChanges: true,
      readinessMayBeStale: true
    });
  });
});

function validationResult(input: {
  blockers?: readonly Diagnostic[];
  warnings?: readonly Diagnostic[];
}): ValidationResult {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];

  return {
    blockers,
    warnings,
    isBlocked: blockers.length > 0
  };
}

function diagnostic(
  severity: "blocker" | "warning",
  code: string,
  field: string,
  recordId?: string
): Diagnostic {
  return {
    severity,
    code,
    message: `${code} message`,
    affected: [recordId ? { recordId, field } : { field }],
    whyItMatters: `${code} matters`,
    suggestedActions: severity === "warning" ? ["revise"] : ["change-directive"]
  };
}

function fieldFor(code: string): string {
  if (code === DIAGNOSTIC_CODES.missingImmediateHandoff) {
    return "generationSession.immediate_handoff";
  }
  if (code === DIAGNOSTIC_CODES.localProseScopeViolation) {
    return "generationSession.stop_guidance.soft_unit_guidance";
  }

  return "generationSession.manual_moment_directive.must_render";
}
