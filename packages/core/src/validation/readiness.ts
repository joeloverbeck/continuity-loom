import { DIAGNOSTIC_CODES, type AffectedReference, type Diagnostic, type SuggestedAction, type ValidationResult } from "./types.js";
import type { PromptKind } from "../compiler/ideation/types.js";
import { blockerApplies } from "./kind-applicability.js";

export type ReadinessStatus = "draft" | "blocked" | "ready-with-warnings" | "ready";

export type ReadinessDiagnosticGroup =
  | "required-before-prompt-generation"
  | "recommended-for-stronger-output"
  | "prompt-length-salience-risk";

export interface AffectedTarget {
  kind: "generation-field" | "record" | "provider-setting" | "project" | "technical";
  fieldPath?: string;
  recordId?: string;
  recordType?: string;
  displayLabel?: string;
  navTarget?: string;
}

export interface DiagnosticAction {
  label: string;
  target?: string;
  kind: "focus-field" | "open-record" | "open-provider-settings" | "open-working-set" | "copy-technical-json";
}

export interface ReadinessDiagnostic {
  severity: "blocker" | "warning";
  code: string;
  title: string;
  group: ReadinessDiagnosticGroup;
  summary: string;
  whyItMatters: string;
  fastestFix: string;
  whenItBecomesBlocking?: string;
  whyThisIsNotBlocking?: string;
  ignoringIsReasonableWhen?: string;
  affected: readonly AffectedTarget[];
  actions: readonly DiagnosticAction[];
  dedupeKey: string;
  sortKey: string;
  technical: {
    legacyCode?: string;
    ruleId?: string;
    rawPaths: readonly string[];
    evidence?: readonly string[];
  };
}

export interface GenerationReadiness {
  status: ReadinessStatus;
  canSaveDraft: true;
  canPreview: boolean;
  canGenerate: boolean;
  blockers: readonly ReadinessDiagnostic[];
  warnings: readonly ReadinessDiagnostic[];
  provider: {
    configured: boolean;
    blockers: readonly ReadinessDiagnostic[];
  };
  unsavedDraft: {
    hasUnsavedChanges: boolean;
    readinessMayBeStale: boolean;
  };
  summary: {
    headline: string;
    nextAction: string;
  };
}

interface ReadinessProviderState {
  configured: boolean;
}

interface ReadinessDraftState {
  hasUnsavedChanges: boolean;
}

interface DiagnosticCopy {
  code: string;
  title: string;
  group: ReadinessDiagnosticGroup;
  summary: string;
  whyItMatters: string;
  fastestFix: string;
  whenItBecomesBlocking?: string;
  whyThisIsNotBlocking?: string;
  ignoringIsReasonableWhen?: string;
}

const PROVIDER_MISSING_CODE = "provider-configuration-missing";

const COPY_TABLE: Readonly<Record<string, DiagnosticCopy>> = Object.freeze({
  [DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch]: {
    code: DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch,
    title: "Generation context does not match accepted segments",
    group: "required-before-prompt-generation",
    summary: "The saved generation context does not match the accepted-segment archive.",
    whyItMatters: "Readiness and prompt compilation must use the lifecycle proved by the accepted-segment archive.",
    fastestFix: "Choose the required Generation context value shown in the blocker and save the draft.",
    whenItBecomesBlocking: "Blocks Preview and Generate whenever the saved context contradicts accepted-segment count."
  },
  [DIAGNOSTIC_CODES.missingManualDirective]: {
    code: "missing-launch-directive",
    title: "Add the launch directive",
    group: "required-before-prompt-generation",
    summary: "The prompt needs your immediate local action or pressure before it can be generated.",
    whyItMatters: "The compiler can describe the current state, but it cannot choose the next authored move for you.",
    fastestFix: "In Launch directive, write one concise instruction such as \"Have Mara test whether the flour bin has been moved.\"",
    whenItBecomesBlocking: "Always blocks Preview and Generate until supplied."
  },
  [DIAGNOSTIC_CODES.missingImmediateHandoff]: {
    code: "missing-continuation-handoff",
    title: "Summarize the handoff from accepted prose",
    group: "required-before-prompt-generation",
    summary: "Continuation generation needs a recent causal bridge because accepted prose is not included in the prompt.",
    whyItMatters: "The model must know where to begin without seeing prior accepted prose.",
    fastestFix: "Add the last visible moment and the begin-after point in record terms, not pasted prose.",
    whenItBecomesBlocking: "Blocks only when generation context is continuation_after_accepted_segment."
  },
  [DIAGNOSTIC_CODES.missingCurrentAuthoritativeState]: {
    code: "missing-current-state",
    title: "Complete the current state",
    group: "required-before-prompt-generation",
    summary: "Current authoritative state is missing required launch context.",
    whyItMatters: "The prompt needs deterministic current time, location, onstage entities, and immediate situation before it can generate local prose.",
    fastestFix: "In CURRENT AUTHORITATIVE STATE, fill current_time, current_location, onstage_entities, and immediate_situation_summary.",
    whenItBecomesBlocking: "Always blocks Preview and Generate until all required current-state fields are supplied."
  },
  [DIAGNOSTIC_CODES.localProseScopeViolation]: {
    code: "stop-guidance-nonlocal",
    title: "Keep stop guidance local",
    group: "required-before-prompt-generation",
    summary: "The stop guidance asks for a chapter, reveal, branch, or downstream consequence.",
    whyItMatters: "Continuity Loom only asks the model for the next local prose unit.",
    fastestFix: "Replace it with a nearby response point, or leave it blank to use the default local stop rule."
  },
  [DIAGNOSTIC_CODES.castSalienceRisk]: {
    code: "cast-salience-risk",
    title: "Long cast context may dilute local voice emphasis",
    group: "prompt-length-salience-risk",
    summary: "Generation can proceed, but a long active cast dossier may make the current speaker's local stress less salient.",
    whyItMatters: "Long-context models can underuse information in the middle of long prompts.",
    whyThisIsNotBlocking: "Durable CAST MEMBER voice anchors are present, so the prompt remains structurally valid.",
    fastestFix: "Add one short current voice/body pressure only for the cast member whose local stress matters most.",
    ignoringIsReasonableWhen: "The scene is quiet, the durable voice anchor is strong, or exact local voice coloring is not important."
  },
  [DIAGNOSTIC_CODES.promptMiddleSalienceRisk]: warningCopy(
    "prompt-length-risk",
    "Prompt length may bury key details",
    "prompt-length-salience-risk",
    "The selected context is large enough to risk lost-in-the-middle behavior.",
    "Trim lower-salience records or add sharper local pins for the current unit."
  ),
  [DIAGNOSTIC_CODES.manyHighSalienceRecords]: warningCopy(
    "many-high-salience-records",
    "Many high-salience records are active",
    "prompt-length-salience-risk",
    "Generation can proceed, but many urgent records may compete for attention.",
    "Narrow the active working set to the records that matter for this local unit."
  ),
  [DIAGNOSTIC_CODES.localVoicePressureMayHelp]: warningCopy(
    "local-voice-pressure-may-help",
    "Local voice pressure may help",
    "recommended-for-stronger-output",
    "Dialogue is structurally ready, but a local voice or body pin may strengthen salience.",
    "Add a brief current voice/body pressure for the active speaker who matters most."
  ),
  [DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk]: warningCopy(
    "ensemble-voice-distinction-risk",
    "Ensemble voices may blur",
    "recommended-for-stronger-output",
    "Generation can proceed, but repeated or absent local voice pins may blur speakers.",
    "Add distinct local voice/body pressure for the ensemble speakers."
  ),
  [DIAGNOSTIC_CODES.sparseSettingTexture]: warningCopy(
    "sparse-setting-texture",
    "Setting texture is sparse",
    "recommended-for-stronger-output",
    "The current unit may have little environmental texture to render.",
    "Add a short current environmental condition or select the relevant location record."
  ),
  [DIAGNOSTIC_CODES.noActiveClockPressure]: warningCopy(
    "no-active-clock-pressure",
    "Local pressure may be under-specified",
    "recommended-for-stronger-output",
    "The launch directive has pressure, but no active clock, obligation, or open thread is selected.",
    "Select the pressure record that should shape the immediate response."
  ),
  [DIAGNOSTIC_CODES.noSampleUtterances]: warningCopy(
    "no-sample-utterances",
    "Sample utterances may help voice",
    "recommended-for-stronger-output",
    "Active cast can generate without sample utterances, but voice examples may sharpen dialogue.",
    "Add or select sample utterances when exact speech texture matters."
  ),
  [DIAGNOSTIC_CODES.lowDramaScenePressure]: warningCopy(
    "low-drama-scene-pressure",
    "Scene pressure may be soft",
    "recommended-for-stronger-output",
    "The prompt is structurally valid, but the local prose pressure may be weak.",
    "Add a sharper immediate pressure, obligation, relationship tension, or open thread."
  ),
  [DIAGNOSTIC_CODES.staleSelectedRecord]: warningCopy(
    "stale-selected-record",
    "Selected record may be stale",
    "recommended-for-stronger-output",
    "A resolved or superseded record is selected and may distract from the current unit.",
    "Deselect it unless it remains relevant to this generation."
  )
});

export function deriveReadiness(
  result: ValidationResult,
  providerState: ReadinessProviderState,
  draftState: ReadinessDraftState,
  labels: ReadonlyMap<string, string>,
  promptKind: PromptKind = "prose"
): GenerationReadiness {
  const blockers = groupDiagnostics(
    result.blockers
      .filter((diagnostic) => blockerApplies(diagnostic.code, promptKind))
      .map((diagnostic) => mapDiagnostic(diagnostic, labels))
  );
  const warnings = groupDiagnostics(result.warnings.map((diagnostic) => mapDiagnostic(diagnostic, labels)));
  const providerBlockers = providerState.configured ? [] : [providerMissingDiagnostic()];
  const canPreview = blockers.length === 0;
  const canGenerate = canPreview && providerBlockers.length === 0;
  const status = deriveStatus(draftState.hasUnsavedChanges, blockers.length, warnings.length);

  return Object.freeze({
    status,
    canSaveDraft: true,
    canPreview,
    canGenerate,
    blockers,
    warnings,
    provider: Object.freeze({
      configured: providerState.configured,
      blockers: Object.freeze(providerBlockers)
    }),
    unsavedDraft: Object.freeze({
      hasUnsavedChanges: draftState.hasUnsavedChanges,
      readinessMayBeStale: draftState.hasUnsavedChanges
    }),
    summary: Object.freeze(readinessSummary(status, blockers.length, warnings.length, providerBlockers.length))
  });
}

function mapDiagnostic(diagnostic: Diagnostic, labels: ReadonlyMap<string, string>): ReadinessDiagnostic {
  const copy = COPY_TABLE[diagnostic.code] ?? fallbackCopy(diagnostic);
  const affected = diagnostic.affected.map((reference) => mapAffected(reference, labels));
  const rawPaths = diagnostic.affected.flatMap((reference) => reference.field ? [reference.field] : []);
  const dedupeKey = diagnostic.severity === "warning"
    ? `${diagnostic.severity}:${diagnostic.code}:${copy.fastestFix}`
    : `${diagnostic.severity}:${diagnostic.code}:${rawPaths.join("|")}:${affected.map((target) => target.recordId ?? "").join("|")}`;

  return Object.freeze({
    severity: diagnostic.severity,
    code: copy.code,
    title: copy.title,
    group: copy.group,
    summary: diagnostic.code === DIAGNOSTIC_CODES.missingCurrentAuthoritativeState
      || diagnostic.code === DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch
      ? diagnostic.message
      : copy.summary,
    whyItMatters: copy.whyItMatters,
    fastestFix: copy.fastestFix,
    ...(copy.whenItBecomesBlocking ? { whenItBecomesBlocking: copy.whenItBecomesBlocking } : {}),
    ...(copy.whyThisIsNotBlocking ? { whyThisIsNotBlocking: copy.whyThisIsNotBlocking } : {}),
    ...(copy.ignoringIsReasonableWhen ? { ignoringIsReasonableWhen: copy.ignoringIsReasonableWhen } : {}),
    affected: Object.freeze(affected),
    actions: Object.freeze(actionsFor(diagnostic.suggestedActions, affected)),
    dedupeKey,
    sortKey: `${groupSortIndex(copy.group)}:${diagnostic.severity}:${copy.code}:${dedupeKey}`,
    technical: Object.freeze({
      legacyCode: diagnostic.code,
      ruleId: diagnostic.code,
      rawPaths: Object.freeze(rawPaths),
      evidence: Object.freeze([diagnostic.message])
    })
  });
}

function groupDiagnostics(diagnostics: readonly ReadinessDiagnostic[]): readonly ReadinessDiagnostic[] {
  const byKey = new Map<string, ReadinessDiagnostic>();

  for (const diagnostic of diagnostics) {
    const existing = byKey.get(diagnostic.dedupeKey);
    if (!existing) {
      byKey.set(diagnostic.dedupeKey, diagnostic);
      continue;
    }

    byKey.set(diagnostic.dedupeKey, mergeDiagnostics(existing, diagnostic));
  }

  return Object.freeze([...byKey.values()].sort((left, right) => left.sortKey.localeCompare(right.sortKey)));
}

function mergeDiagnostics(left: ReadinessDiagnostic, right: ReadinessDiagnostic): ReadinessDiagnostic {
  return Object.freeze({
    ...left,
    affected: Object.freeze(uniqueTargets([...left.affected, ...right.affected])),
    actions: Object.freeze(uniqueActions([...left.actions, ...right.actions])),
    technical: Object.freeze({
      ...left.technical,
      rawPaths: Object.freeze(uniqueStrings([...left.technical.rawPaths, ...right.technical.rawPaths])),
      evidence: Object.freeze(uniqueStrings([...(left.technical.evidence ?? []), ...(right.technical.evidence ?? [])]))
    })
  });
}

function mapAffected(reference: AffectedReference, labels: ReadonlyMap<string, string>): AffectedTarget {
  if (reference.recordId) {
    const recordType = recordTypeFromField(reference.field);
    const displayLabel = labels.get(reference.recordId) ?? fallbackRecordLabel(recordType, reference.recordId);

    return Object.freeze({
      kind: "record" as const,
      recordId: reference.recordId,
      ...(recordType ? { recordType } : {}),
      ...(reference.field ? { fieldPath: reference.field } : {}),
      displayLabel,
      navTarget: `/records?recordId=${encodeURIComponent(reference.recordId)}`
    });
  }

  if (reference.field?.startsWith("generationSession.")) {
    return Object.freeze({
      kind: "generation-field" as const,
      fieldPath: reference.field,
      displayLabel: displayLabelForField(reference.field),
      navTarget: reference.field
    });
  }

  if (reference.field?.startsWith("storyConfig.")) {
    return Object.freeze({
      kind: "project" as const,
      fieldPath: reference.field,
      displayLabel: displayLabelForField(reference.field),
      navTarget: reference.field
    });
  }

  return Object.freeze({
    kind: "technical" as const,
    ...(reference.field ? { fieldPath: reference.field, displayLabel: displayLabelForField(reference.field), navTarget: reference.field } : {})
  });
}

function actionsFor(actions: readonly SuggestedAction[], affected: readonly AffectedTarget[]): readonly DiagnosticAction[] {
  const derived: DiagnosticAction[] = [];

  for (const target of affected) {
    if (target.kind === "generation-field" && target.fieldPath) {
      derived.push({ kind: "focus-field", label: actionLabelForField(target.fieldPath), target: target.fieldPath });
    }
    if (target.kind === "record" && target.recordId) {
      derived.push({ kind: "open-record", label: `Open ${target.displayLabel ?? "record"}`, target: target.recordId });
    }
  }

  if (actions.includes("deselect")) {
    derived.push({ kind: "open-working-set", label: "Review active working set" });
  }

  derived.push({ kind: "copy-technical-json", label: "Copy technical JSON" });

  return uniqueActions(derived);
}

function providerMissingDiagnostic(): ReadinessDiagnostic {
  return Object.freeze({
    severity: "blocker",
    code: PROVIDER_MISSING_CODE,
    title: "Configure OpenRouter before generating",
    group: "required-before-prompt-generation",
    summary: "Prompt preview can still work, but sending needs a local OpenRouter credential.",
    whyItMatters: "Continuity Loom can only send generation requests when the provider is configured locally.",
    fastestFix: "Open settings and add the OpenRouter API key.",
    affected: Object.freeze([
      Object.freeze({
        kind: "provider-setting" as const,
        fieldPath: "openrouter.apiKey",
        displayLabel: "OpenRouter API key",
        navTarget: "/settings"
      })
    ]),
    actions: Object.freeze([
      Object.freeze({ kind: "open-provider-settings" as const, label: "Open provider settings", target: "/settings" }),
      Object.freeze({ kind: "copy-technical-json" as const, label: "Copy technical JSON" })
    ]),
    dedupeKey: `blocker:${PROVIDER_MISSING_CODE}`,
    sortKey: `0:blocker:${PROVIDER_MISSING_CODE}`,
    technical: Object.freeze({
      legacyCode: PROVIDER_MISSING_CODE,
      ruleId: PROVIDER_MISSING_CODE,
      rawPaths: Object.freeze(["openrouter.apiKey"])
    })
  });
}

function deriveStatus(hasUnsavedChanges: boolean, blockerCount: number, warningCount: number): ReadinessStatus {
  if (hasUnsavedChanges) {
    return "draft";
  }

  if (blockerCount > 0) {
    return "blocked";
  }

  return warningCount > 0 ? "ready-with-warnings" : "ready";
}

function readinessSummary(
  status: ReadinessStatus,
  blockerCount: number,
  warningCount: number,
  providerBlockerCount: number
): GenerationReadiness["summary"] {
  if (status === "draft") {
    return {
      headline: "Draft has unsaved changes",
      nextAction: "Save the draft before trusting this readiness result."
    };
  }

  if (blockerCount > 0 || providerBlockerCount > 0) {
    return {
      headline: `${blockerCount + providerBlockerCount} required item${blockerCount + providerBlockerCount === 1 ? "" : "s"} before generation`,
      nextAction: "Fix the required readiness items, then refresh."
    };
  }

  if (warningCount > 0) {
    return {
      headline: "Ready with recommendations",
      nextAction: "Preview and Generate are available; review warnings if stronger output matters."
    };
  }

  return {
    headline: "Ready to generate",
    nextAction: "Preview and Generate are available."
  };
}

function fallbackCopy(diagnostic: Diagnostic): DiagnosticCopy {
  const title = diagnostic.code
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

  return {
    code: diagnostic.code,
    title,
    group: diagnostic.severity === "warning" ? "recommended-for-stronger-output" : "required-before-prompt-generation",
    summary: diagnostic.message,
    whyItMatters: diagnostic.whyItMatters,
    fastestFix: diagnostic.suggestedActions.length > 0 ? `Use suggested action: ${diagnostic.suggestedActions[0]}.` : "Review the technical diagnostic details."
  };
}

function warningCopy(
  code: string,
  title: string,
  group: ReadinessDiagnosticGroup,
  summary: string,
  fastestFix: string
): DiagnosticCopy {
  return {
    code,
    title,
    group,
    summary,
    whyItMatters: "This may weaken local prose output, but it does not make the prompt structurally invalid.",
    whyThisIsNotBlocking: "The compiler still has enough deterministic continuity authority to produce a prompt.",
    fastestFix,
    ignoringIsReasonableWhen: "The current local unit does not depend on this nuance."
  };
}

function groupSortIndex(group: ReadinessDiagnosticGroup): number {
  switch (group) {
    case "required-before-prompt-generation":
      return 0;
    case "recommended-for-stronger-output":
      return 1;
    case "prompt-length-salience-risk":
      return 2;
  }
}

function recordTypeFromField(field?: string): string | undefined {
  if (!field) {
    return undefined;
  }

  const prefix = field.split(".")[0]?.split("/")[0];

  return prefix && /^[A-Z][A-Z ]+$/.test(prefix) ? prefix : undefined;
}

function fallbackRecordLabel(recordType: string | undefined, recordId: string): string {
  return `${recordType ?? "Record"} ${shortId(recordId)}`;
}

function shortId(recordId: string): string {
  return recordId.length > 8 ? recordId.slice(0, 8) : recordId;
}

function displayLabelForField(field: string): string {
  return field
    .replace(/^generationSession\./, "")
    .replace(/^storyConfig\./, "")
    .split(/[._]/)
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function actionLabelForField(field: string): string {
  if (field.includes("generation_context")) {
    return "Edit generation context";
  }
  if (field.includes("manual_moment_directive")) {
    return "Edit launch directive";
  }
  if (field.includes("immediate_handoff")) {
    return "Edit continuation handoff";
  }
  if (field.includes("current_authoritative_state")) {
    return "Edit current state";
  }
  if (field.includes("stop_guidance")) {
    return "Edit stop guidance";
  }
  if (field.includes("current_cast_voice_pressure")) {
    return "Edit voice pressure";
  }

  return `Edit ${displayLabelForField(field)}`;
}

function uniqueTargets(targets: readonly AffectedTarget[]): readonly AffectedTarget[] {
  const seen = new Set<string>();
  const unique: AffectedTarget[] = [];

  for (const target of targets) {
    const key = `${target.kind}:${target.recordId ?? ""}:${target.fieldPath ?? ""}:${target.displayLabel ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(target);
    }
  }

  return unique;
}

function uniqueActions(actions: readonly DiagnosticAction[]): readonly DiagnosticAction[] {
  const seen = new Set<string>();
  const unique: DiagnosticAction[] = [];

  for (const action of actions) {
    const key = `${action.kind}:${action.label}:${action.target ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(action);
    }
  }

  return unique;
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
