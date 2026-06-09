import {
  activeWorkingSetSchema,
  generationSessionDraftSchema
} from "@loom/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { z } from "zod";

import {
  type GenerationBriefDefaults,
  type RecordSummary,
  getGenerationBrief,
  listRecords,
  listStoryConfig,
  setGenerationBrief
} from "../api.js";
import { BriefFieldRow } from "./BriefFieldRow.js";
import { ValidationPanel } from "./ValidationPanel.js";

type GenerationSession = z.infer<typeof generationSessionDraftSchema>;
type ActiveWorkingSet = z.infer<typeof activeWorkingSetSchema>;

const currentCastLocalFunctions = [
  "pov_narrator",
  "active_speaker",
  "active_silent",
  "close_non_pov",
  "present_minor_speaker",
  "physically_active",
  "materially_referenced"
] as const;

const nonLocalStopPattern = /\b(whole chapter|chapter|act|beat|future consequences|alternate options|multiple response points)\b/i;

function splitLines(value: string): string[] {
  return value.split("\n");
}

function normalizeLines(values: readonly string[]): string[] {
  return values.map((line) => line.trim()).filter(Boolean);
}

function editableLines(value: string | readonly string[] | undefined): string {
  return typeof value === "string" ? value : (value ?? []).join("\n");
}

function proseLikePaste(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 240 || trimmed.split(/[.!?]\s+/).length >= 4 || /\n\n/.test(trimmed);
}

function parseSession(value: unknown): GenerationSession {
  return generationSessionDraftSchema.parse(value ?? {});
}

function issuePath(issue: unknown): string {
  if (typeof issue === "object" && issue !== null && "path" in issue) {
    const path = (issue as { path?: unknown }).path;
    if (typeof path === "string") {
      return path;
    }
    if (Array.isArray(path)) {
      return path.map(String).join(".");
    }
  }
  return "(unknown path)";
}

function focusableElement(element: HTMLElement): HTMLElement | undefined {
  return element.matches("input, textarea, select, button, [tabindex]:not([tabindex='-1'])") ? element : undefined;
}

function firstFocusableChild(element: HTMLElement): HTMLElement | undefined {
  return element.querySelector<HTMLElement>("input, textarea, select")
    ?? element.querySelector<HTMLElement>("button, [tabindex]:not([tabindex='-1'])")
    ?? undefined;
}

function briefFieldTarget(
  scrollTarget: HTMLElement,
  focusTarget: HTMLElement | undefined
): { scrollTarget: HTMLElement; focusTarget?: HTMLElement } {
  return focusTarget ? { scrollTarget, focusTarget } : { scrollTarget };
}

function escapeSelectorValue(value: string): string {
  return globalThis.CSS?.escape(value) ?? value.replace(/["\\]/g, "\\$&");
}

function BriefSection({
  title,
  headingId,
  description,
  className = "",
  dataField,
  children
}: {
  title: string;
  headingId: string;
  description: string;
  className?: string;
  dataField?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section
      className={["briefSection", className].filter(Boolean).join(" ")}
      aria-labelledby={headingId}
      data-field={dataField}
    >
      <div className="briefSectionHeader">
        <h3 id={headingId}>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="briefSectionBody">{children}</div>
    </section>
  );
}

export function GenerationBriefView(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<GenerationSession>(() => parseSession({}));
  const [briefDefaults, setBriefDefaults] = useState<GenerationBriefDefaults | null>(null);
  const [proseModePayload, setProseModePayload] = useState<Record<string, unknown> | null>(null);
  const [povEntities, setPovEntities] = useState<RecordSummary[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [shapeIssues, setShapeIssues] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationKey, setValidationKey] = useState(0);
  const focusedFieldParamRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([getGenerationBrief(), listStoryConfig(), listRecords({ type: "ENTITY" })])
      .then(([briefResponse, configResponse, entityResponse]) => {
        if (!active) {
          return;
        }

        if (briefResponse.ok) {
          setSession(parseSession(briefResponse.session));
          setBriefDefaults(briefResponse.defaults);
          setHasUnsavedChanges(false);
          setValidationKey((current) => current + 1);
        } else {
          setNotice(briefResponse.message);
        }

        const proseModePayload = configResponse.ok ? configResponse.configs["PROSE MODE"] : undefined;
        if (typeof proseModePayload === "object" && proseModePayload !== null) {
          setProseModePayload(proseModePayload as Record<string, unknown>);
        }

        if (entityResponse.ok) {
          setPovEntities([...entityResponse.records].sort((left, right) => left.displayLabel.localeCompare(right.displayLabel)));
        }
      })
      .catch(() => {
        if (active) {
          setNotice("Could not load generation brief.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const fieldParam = searchParams.get("field");

  useEffect(() => {
    if (!fieldParam || !briefDefaults || focusedFieldParamRef.current === fieldParam) {
      return;
    }

    focusedFieldParamRef.current = fieldParam;
    focusBriefField(fieldParam);
  }, [briefDefaults, fieldParam]);

  const activeWorkingSet = {
    selected_records: [],
    active_onstage_cast_full: [],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: [],
    ...(session.active_working_set ?? {})
  };
  const selectedPov = activeWorkingSet.selected_pov;
  const povEntityLabels = useMemo(
    () => new Map(povEntities.map((entity) => [entity.id, entity.displayLabel])),
    [povEntities]
  );
  const proseModeSummary = useMemo(() => {
    if (!proseModePayload) {
      return "Not configured";
    }

    const povCharacter = typeof proseModePayload.pov_character === "string" ? proseModePayload.pov_character : null;
    const povLabel = povCharacter ? (povEntityLabels.get(povCharacter) ?? povCharacter) : null;

    return [
      povLabel,
      typeof proseModePayload.person === "string" ? proseModePayload.person : null,
      typeof proseModePayload.tense === "string" ? proseModePayload.tense : null
    ].filter(Boolean).join(" / ") || "Configured";
  }, [proseModePayload, povEntityLabels]);
  const selectedPovHasKnownEntity = selectedPov
    ? selectedPov === "omniscient" || povEntityLabels.has(selectedPov)
    : true;
  const immediateHandoffDraft = session.immediate_handoff ?? {};
  const immediateHandoff = {
    recent_causal_context: immediateHandoffDraft.recent_causal_context ?? "",
    last_visible_moment: immediateHandoffDraft.last_visible_moment ?? "",
    prior_accepted_prose_status_or_handoff_note: immediateHandoffDraft.prior_accepted_prose_status_or_handoff_note ?? "none",
    begin_after: immediateHandoffDraft.begin_after ?? ""
  };
  const manualDirectiveDraft = session.manual_moment_directive ?? {};
  const manualDirective = {
    must_render: manualDirectiveDraft.must_render ?? [],
    may_render_if_naturally_caused: manualDirectiveDraft.may_render_if_naturally_caused ?? [],
    do_not_force: manualDirectiveDraft.do_not_force ?? []
  };
  const currentVoicePressure = session.current_cast_voice_pressure?.[0] ?? {
    cast_member_id: "",
    local_function: "active_speaker",
    current_voice_pressure: "",
    dialogue_pressure: "none",
    pov_narration_pressure: "none",
    nonverbal_or_silence_pressure: "none",
    current_must_preserve: [],
    current_must_avoid: []
  };
  const voiceOverride = session.cast_voice_overrides?.[0] ?? {
    cast_member_id: currentVoicePressure.cast_member_id,
    scope: "current_generation_only",
    reason: "none",
    applies_to: ["dialogue"],
    override_text: ""
  };
  const defaultGenerationContext = briefDefaults?.generation_context.value ?? "first_segment";
  const validationFocus = session.generation_validation_focus ?? {
    validation_focus_tags: {
      generation_context: [defaultGenerationContext],
      expected_local_modes: [],
      possible_durable_changes: []
    }
  };
  const validationFocusTags = validationFocus.validation_focus_tags ?? {
    generation_context: [defaultGenerationContext],
    expected_local_modes: [],
    possible_durable_changes: []
  };
  const generationContext = validationFocusTags.generation_context?.[0] ?? defaultGenerationContext;
  const stopGuidance = { soft_unit_guidance: session.stop_guidance?.soft_unit_guidance ?? "" };
  const pasteWarning = useMemo(
    () => proseLikePaste(immediateHandoff.prior_accepted_prose_status_or_handoff_note),
    [immediateHandoff.prior_accepted_prose_status_or_handoff_note]
  );
  const nonLocalStopWarning = nonLocalStopPattern.test(stopGuidance.soft_unit_guidance);

  function updateSurface<K extends keyof GenerationSession>(key: K, value: GenerationSession[K]): void {
    setSession((current) => ({ ...current, [key]: value }));
    setHasUnsavedChanges(true);
  }

  function updateActiveWorkingSet(value: Partial<ActiveWorkingSet>): void {
    updateSurface("active_working_set", { ...activeWorkingSet, ...value });
  }

  function updateCurrentAuthoritativeState(value: Partial<NonNullable<GenerationSession["current_authoritative_state"]>>): void {
    updateSurface("current_authoritative_state", {
      current_time: session.current_authoritative_state?.current_time ?? "",
      current_location: session.current_authoritative_state?.current_location ?? "",
      onstage_entities: session.current_authoritative_state?.onstage_entities ?? [],
      immediate_situation_summary: session.current_authoritative_state?.immediate_situation_summary ?? "",
      offstage_pressuring_entities: session.current_authoritative_state?.offstage_pressuring_entities ?? [],
      positions: session.current_authoritative_state?.positions ?? "",
      possessions: session.current_authoritative_state?.possessions ?? "",
      visible_conditions: session.current_authoritative_state?.visible_conditions ?? [],
      environmental_conditions: session.current_authoritative_state?.environmental_conditions ?? "",
      entity_statuses: session.current_authoritative_state?.entity_statuses ?? "",
      line_of_sight_and_visibility: session.current_authoritative_state?.line_of_sight_and_visibility ?? "",
      pov_cannot_perceive_now: session.current_authoritative_state?.pov_cannot_perceive_now ?? "",
      routes_and_exits: session.current_authoritative_state?.routes_and_exits ?? [],
      available_time: session.current_authoritative_state?.available_time ?? "",
      consent_or_force_conditions: session.current_authoritative_state?.consent_or_force_conditions ?? "none",
      current_locks: session.current_authoritative_state?.current_locks ?? [],
      ...value
    });
  }

  async function save(): Promise<void> {
    setNotice(null);
    setShapeIssues([]);
    const payload: Record<string, unknown> = {
      active_working_set: activeWorkingSet,
      current_authoritative_state: session.current_authoritative_state,
      immediate_handoff: immediateHandoff,
      manual_moment_directive: {
        ...manualDirective,
        must_render: normalizeLines(manualDirective.must_render),
        may_render_if_naturally_caused: normalizeLines(manualDirective.may_render_if_naturally_caused),
        do_not_force: normalizeLines(manualDirective.do_not_force)
      },
      current_cast_voice_pressure: currentVoicePressure.cast_member_id ? [currentVoicePressure] : [],
      cast_voice_overrides: voiceOverride.override_text ? [voiceOverride] : [],
      generation_validation_focus: validationFocus,
      stop_guidance: stopGuidance
    };
    const response = await setGenerationBrief(payload);

    if (response.ok) {
      setSession(parseSession(response.session));
      setNotice("Draft saved.");
      setHasUnsavedChanges(false);
      setValidationKey((current) => current + 1);
      return;
    }

    setNotice(response.message);
    setShapeIssues(response.kind === "malformed-draft" ? (response.issues ?? []).map(issuePath) : []);
  }

  function focusBriefField(field: string): void {
    const target = resolveBriefFieldTarget(field);

    if (!target) {
      return;
    }

    target.scrollTarget.scrollIntoView({ block: "center" });
    target.focusTarget?.focus();
  }

  function resolveBriefFieldTarget(field: string): { scrollTarget: HTMLElement; focusTarget?: HTMLElement } | null {
    const escapedField = escapeSelectorValue(field);
    const exact = document.querySelector<HTMLElement>(
      `[name="${escapedField}"], [data-field="${escapedField}"]`
    );

    if (exact) {
      return briefFieldTarget(exact, focusableElement(exact) ?? firstFocusableChild(exact));
    }

    const section = Array.from(document.querySelectorAll<HTMLElement>("section[data-field]")).find((element) => {
      const fieldAnchor = element.dataset.field;

      return !!fieldAnchor && (field === fieldAnchor || field.startsWith(`${fieldAnchor}.`));
    });

    if (!section) {
      return null;
    }

    return briefFieldTarget(section, firstFocusableChild(section));
  }

  return (
    <section className="surface generationBriefSurface" aria-labelledby="generation-brief-title">
      <div className="projectHeader">
        <p className="eyebrow">Generation-time workflow</p>
        <h2 id="generation-brief-title">Generation Brief</h2>
      </div>

      {notice ? (
        <p className={notice.endsWith("saved.") ? "status statusSuccess" : "status statusError"} role="status">
          {notice}
        </p>
      ) : null}
      {shapeIssues.length > 0 ? (
        <details>
          <summary>Technical details</summary>
          <ul>
            {shapeIssues.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {hasUnsavedChanges ? (
        <p className="status statusWarning">Displayed readiness may be stale until you save this draft.</p>
      ) : null}

      <div className="briefStack">
        <ValidationPanel validationKey={validationKey} hasUnsavedChanges={hasUnsavedChanges} onFocusField={focusBriefField} />
        <p className="briefRequirednessLegend">
          <strong aria-label="required"> *</strong> required · <span>Conditional</span> · <span>Optional</span>
        </p>

        <BriefSection
          title="Active Working Set"
          headingId="active-working-set-brief"
          description="Selected viewpoint and record authority for the next prompt."
        >
          <p className="muted">PROSE MODE source: {proseModeSummary}</p>
          <BriefFieldRow path="active_working_set.selected_pov" schemaLabel="selected_pov" generationContext={generationContext}>
            <select
              name="generationSession.active_working_set.selected_pov"
              value={selectedPov ?? ""}
              onChange={(event) => updateActiveWorkingSet({ selected_pov: event.target.value || undefined })}
            >
              <option value="">Use PROSE MODE default</option>
              <option value="omniscient">Omniscient</option>
              {selectedPovHasKnownEntity || !selectedPov ? null : (
                <option value={selectedPov}>Unknown entity ({selectedPov.slice(0, 8)})</option>
              )}
              {povEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>{entity.displayLabel}</option>
              ))}
            </select>
          </BriefFieldRow>
        </BriefSection>

        <BriefSection
          title="Current Authoritative State"
          headingId="current-state-brief"
          description="Binding where-things-stand-now facts: time, place, bodies, visibility, constraints, and hard limits."
          dataField="generationSession.current_authoritative_state"
        >
          <BriefFieldRow path="current_authoritative_state.current_time" schemaLabel="current_time" generationContext={generationContext}>
            <input
              name="generationSession.current_authoritative_state.current_time"
              value={session.current_authoritative_state?.current_time ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ current_time: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow path="current_authoritative_state.current_location" schemaLabel="current_location" generationContext={generationContext}>
            <input
              name="generationSession.current_authoritative_state.current_location"
              value={session.current_authoritative_state?.current_location ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ current_location: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow path="current_authoritative_state.onstage_entities[]" schemaLabel="onstage_entities" generationContext={generationContext}>
            <select
              multiple
              name="generationSession.current_authoritative_state.onstage_entities"
              value={session.current_authoritative_state?.onstage_entities ?? []}
              onChange={(event) =>
                updateCurrentAuthoritativeState({
                  onstage_entities: Array.from(event.currentTarget.selectedOptions, (option) => option.value)
                })
              }
            >
              {povEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>{entity.displayLabel}</option>
              ))}
            </select>
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.immediate_situation_summary"
            schemaLabel="immediate_situation_summary"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.current_authoritative_state.immediate_situation_summary"
              value={session.current_authoritative_state?.immediate_situation_summary ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ immediate_situation_summary: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.offstage_pressuring_entities[]"
            schemaLabel="offstage_pressuring_entities"
            generationContext={generationContext}
          >
            <select
              multiple
              name="generationSession.current_authoritative_state.offstage_pressuring_entities"
              value={session.current_authoritative_state?.offstage_pressuring_entities ?? []}
              onChange={(event) =>
                updateCurrentAuthoritativeState({
                  offstage_pressuring_entities: Array.from(event.currentTarget.selectedOptions, (option) => option.value)
                })
              }
            >
              {povEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>{entity.displayLabel}</option>
              ))}
            </select>
          </BriefFieldRow>
          <BriefFieldRow path="current_authoritative_state.positions" schemaLabel="positions" generationContext={generationContext}>
            <textarea
              name="generationSession.current_authoritative_state.positions"
              value={editableLines(session.current_authoritative_state?.positions)}
              onChange={(event) => updateCurrentAuthoritativeState({ positions: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow path="current_authoritative_state.possessions" schemaLabel="possessions" generationContext={generationContext}>
            <textarea
              name="generationSession.current_authoritative_state.possessions"
              value={editableLines(session.current_authoritative_state?.possessions)}
              onChange={(event) => updateCurrentAuthoritativeState({ possessions: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.visible_conditions[]"
            schemaLabel="visible_conditions"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.current_authoritative_state.visible_conditions"
              value={(session.current_authoritative_state?.visible_conditions ?? []).join("\n")}
              onChange={(event) => updateCurrentAuthoritativeState({ visible_conditions: splitLines(event.target.value) })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.environmental_conditions"
            schemaLabel="environmental_conditions"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.current_authoritative_state.environmental_conditions"
              value={session.current_authoritative_state?.environmental_conditions ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ environmental_conditions: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow path="current_authoritative_state.entity_statuses" schemaLabel="entity_statuses" generationContext={generationContext}>
            <textarea
              name="generationSession.current_authoritative_state.entity_statuses"
              value={editableLines(session.current_authoritative_state?.entity_statuses)}
              onChange={(event) => updateCurrentAuthoritativeState({ entity_statuses: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.line_of_sight_and_visibility"
            schemaLabel="line_of_sight_and_visibility"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.current_authoritative_state.line_of_sight_and_visibility"
              value={session.current_authoritative_state?.line_of_sight_and_visibility ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ line_of_sight_and_visibility: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.pov_cannot_perceive_now"
            schemaLabel="pov_cannot_perceive_now"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.current_authoritative_state.pov_cannot_perceive_now"
              value={session.current_authoritative_state?.pov_cannot_perceive_now ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ pov_cannot_perceive_now: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.routes_and_exits[]"
            schemaLabel="routes_and_exits"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.current_authoritative_state.routes_and_exits"
              value={(session.current_authoritative_state?.routes_and_exits ?? []).join("\n")}
              onChange={(event) => updateCurrentAuthoritativeState({ routes_and_exits: splitLines(event.target.value) })}
            />
          </BriefFieldRow>
          <BriefFieldRow path="current_authoritative_state.available_time" schemaLabel="available_time" generationContext={generationContext}>
            <input
              name="generationSession.current_authoritative_state.available_time"
              value={session.current_authoritative_state?.available_time ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ available_time: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="current_authoritative_state.consent_or_force_conditions"
            schemaLabel="consent_or_force_conditions"
            generationContext={generationContext}
          >
            <input
              name="generationSession.current_authoritative_state.consent_or_force_conditions"
              value={session.current_authoritative_state?.consent_or_force_conditions ?? "none"}
              onChange={(event) => updateCurrentAuthoritativeState({ consent_or_force_conditions: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow path="current_authoritative_state.current_locks[]" schemaLabel="current_locks" generationContext={generationContext}>
            <textarea
              name="generationSession.current_authoritative_state.current_locks"
              value={(session.current_authoritative_state?.current_locks ?? []).join("\n")}
              onChange={(event) => updateCurrentAuthoritativeState({ current_locks: splitLines(event.target.value) })}
            />
          </BriefFieldRow>
        </BriefSection>

        <BriefSection
          title="Immediate Handoff"
          headingId="handoff-brief"
          description="User-authored launch context, final visible moment, and exact begin-after instruction."
        >
          <BriefFieldRow path="immediate_handoff.recent_causal_context" schemaLabel="recent_causal_context" generationContext={generationContext}>
            <textarea
              name="generationSession.immediate_handoff.recent_causal_context"
              value={immediateHandoff.recent_causal_context}
              onChange={(event) => updateSurface("immediate_handoff", { ...immediateHandoff, recent_causal_context: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow path="immediate_handoff.last_visible_moment" schemaLabel="last_visible_moment" generationContext={generationContext}>
            <textarea
              name="generationSession.immediate_handoff.last_visible_moment"
              value={immediateHandoff.last_visible_moment}
              onChange={(event) => updateSurface("immediate_handoff", { ...immediateHandoff, last_visible_moment: event.target.value })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="immediate_handoff.prior_accepted_prose_status_or_handoff_note"
            schemaLabel="prior_accepted_prose_status_or_handoff_note"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.immediate_handoff.prior_accepted_prose_status_or_handoff_note"
              value={immediateHandoff.prior_accepted_prose_status_or_handoff_note}
              onChange={(event) =>
                updateSurface("immediate_handoff", {
                  ...immediateHandoff,
                  prior_accepted_prose_status_or_handoff_note: event.target.value
                })
              }
            />
          </BriefFieldRow>
          {pasteWarning ? <p className="status statusWarning">This looks like pasted prose. Use a user-authored handoff note instead.</p> : null}
          <BriefFieldRow path="immediate_handoff.begin_after" schemaLabel="begin_after" generationContext={generationContext}>
            <textarea
              name="generationSession.immediate_handoff.begin_after"
              value={immediateHandoff.begin_after}
              onChange={(event) => updateSurface("immediate_handoff", { ...immediateHandoff, begin_after: event.target.value })}
            />
          </BriefFieldRow>
        </BriefSection>

        <BriefSection
          title="Manual Moment Directive"
          headingId="directive-brief"
          description="Authorial local pressure: what must render, what may render, and what must not be forced."
        >
          <BriefFieldRow path="manual_moment_directive.must_render[]" schemaLabel="must_render" generationContext={generationContext}>
            <textarea
              name="generationSession.manual_moment_directive.must_render"
              value={manualDirective.must_render.join("\n")}
              onChange={(event) => updateSurface("manual_moment_directive", { ...manualDirective, must_render: splitLines(event.target.value) })}
            />
          </BriefFieldRow>
          <BriefFieldRow
            path="manual_moment_directive.may_render_if_naturally_caused[]"
            schemaLabel="may_render_if_naturally_caused"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.manual_moment_directive.may_render_if_naturally_caused"
              value={manualDirective.may_render_if_naturally_caused.join("\n")}
              onChange={(event) =>
                updateSurface("manual_moment_directive", {
                  ...manualDirective,
                  may_render_if_naturally_caused: splitLines(event.target.value)
                })
              }
            />
          </BriefFieldRow>
          <BriefFieldRow path="manual_moment_directive.do_not_force[]" schemaLabel="do_not_force" generationContext={generationContext}>
            <textarea
              name="generationSession.manual_moment_directive.do_not_force"
              value={manualDirective.do_not_force.join("\n")}
              onChange={(event) =>
                updateSurface("manual_moment_directive", {
                  ...manualDirective,
                  do_not_force: splitLines(event.target.value)
                })
              }
            />
          </BriefFieldRow>
        </BriefSection>

        <BriefSection
          title="Current Cast Voice Pressure"
          headingId="voice-pressure-brief"
          description="Temporary voice, dialogue, narration, and silence pressure for this generation only."
        >
          <BriefFieldRow path="current_cast_voice_pressure[].cast_member_id" schemaLabel="cast_member_id" generationContext={generationContext}>
            <input
              name="generationSession.current_cast_voice_pressure.0.cast_member_id"
              value={currentVoicePressure.cast_member_id}
              onChange={(event) =>
                updateSurface("current_cast_voice_pressure", [{ ...currentVoicePressure, cast_member_id: event.target.value }])
              }
            />
          </BriefFieldRow>
          <BriefFieldRow path="current_cast_voice_pressure[].local_function" schemaLabel="local_function" generationContext={generationContext}>
            <select
              name="generationSession.current_cast_voice_pressure.0.local_function"
              value={currentVoicePressure.local_function}
              onChange={(event) =>
                updateSurface("current_cast_voice_pressure", [
                  { ...currentVoicePressure, local_function: event.target.value as typeof currentCastLocalFunctions[number] }
                ])
              }
            >
              {currentCastLocalFunctions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </BriefFieldRow>
          <BriefFieldRow
            path="current_cast_voice_pressure[].current_voice_pressure"
            schemaLabel="current_voice_pressure"
            generationContext={generationContext}
          >
            <textarea
              name="generationSession.current_cast_voice_pressure.0.current_voice_pressure"
              value={currentVoicePressure.current_voice_pressure}
              onChange={(event) =>
                updateSurface("current_cast_voice_pressure", [{ ...currentVoicePressure, current_voice_pressure: event.target.value }])
              }
            />
          </BriefFieldRow>
        </BriefSection>

        <BriefSection
          title="Cast Voice Overrides"
          headingId="override-brief"
          description="Current-generation-only override instructions that never update durable cast records."
        >
          <BriefFieldRow path="cast_voice_overrides[].override_text" schemaLabel="override_text" generationContext={generationContext}>
            <textarea
              name="generationSession.cast_voice_overrides.0.override_text"
              value={voiceOverride.override_text}
              onChange={(event) => updateSurface("cast_voice_overrides", [{ ...voiceOverride, override_text: event.target.value }])}
            />
          </BriefFieldRow>
        </BriefSection>

        <BriefSection
          title="Generation Validation Focus"
          headingId="validation-focus-brief"
          description="Deterministic validation focus tags; these are checks, not story beats."
        >
          <BriefFieldRow
            path="generation_validation_focus.validation_focus_tags.generation_context[]"
            schemaLabel="generation_context"
            generationContext={generationContext}
          >
            <select
              name="generationSession.generation_validation_focus.validation_focus_tags.generation_context"
              value={generationContext}
              onChange={(event) =>
                updateSurface("generation_validation_focus", {
                  validation_focus_tags: {
                    ...validationFocusTags,
                    generation_context: [event.target.value as "first_segment" | "continuation_after_accepted_segment"]
                  }
                })
              }
            >
              <option value="first_segment">first_segment</option>
              <option value="continuation_after_accepted_segment">continuation_after_accepted_segment</option>
            </select>
          </BriefFieldRow>
          {briefDefaults ? (
            <p className="muted">
              Default: {briefDefaults.generation_context.value === "first_segment" ? "first segment" : "continuation after accepted segment"}
              {briefDefaults.generation_context.source === "accepted-segment-count"
                ? briefDefaults.generation_context.acceptedSegmentCount === 0
                  ? " because no accepted prose exists yet."
                  : ` because ${briefDefaults.generation_context.acceptedSegmentCount} accepted segment(s) exist.`
                : " from the saved draft."}
            </p>
          ) : null}
        </BriefSection>

        <BriefSection
          title="Stop Guidance"
          headingId="stop-guidance-brief"
          description="Local stopping point for the next response decision; not downstream plot consequences."
          className="stopGuidancePanel"
        >
          <BriefFieldRow path="stop_guidance.soft_unit_guidance" schemaLabel="soft_unit_guidance" generationContext={generationContext}>
            <textarea
              name="generationSession.stop_guidance.soft_unit_guidance"
              value={stopGuidance.soft_unit_guidance}
              onChange={(event) => updateSurface("stop_guidance", { soft_unit_guidance: event.target.value })}
            />
          </BriefFieldRow>
          {nonLocalStopWarning ? <p className="status statusWarning">This sounds non-local. Keep stop guidance to the next local prose unit.</p> : null}
        </BriefSection>
      </div>

      <button type="button" onClick={() => void save()}>Save Generation Brief</button>
    </section>
  );
}
