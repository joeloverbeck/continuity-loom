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
import { FieldHelp } from "../field-help/FieldHelp.js";
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

function BriefFieldHelp({ path, label }: { path: string; label: string }): React.JSX.Element {
  return <FieldHelp fieldPath={`GENERATION BRIEF.${path}`} fieldLabel={label} />;
}

function focusableElement(element: HTMLElement): HTMLElement | undefined {
  return element.matches("input, textarea, select, button, [tabindex]:not([tabindex='-1'])") ? element : undefined;
}

function firstFocusableChild(element: HTMLElement): HTMLElement | undefined {
  return element.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]:not([tabindex='-1'])") ?? undefined;
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
      manual_moment_directive: { ...manualDirective, must_render: normalizeLines(manualDirective.must_render) },
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

        <section className="configPanel" aria-labelledby="active-working-set-brief">
          <h3 id="active-working-set-brief">ACTIVE WORKING SET</h3>
          <p className="muted">PROSE MODE source: {proseModeSummary}</p>
          <label>
            selected_pov
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
          </label>
          <BriefFieldHelp path="active_working_set.selected_pov" label="selected_pov" />
        </section>

        <section
          className="configPanel"
          aria-labelledby="current-state-brief"
          data-field="generationSession.current_authoritative_state"
        >
          <h3 id="current-state-brief">CURRENT AUTHORITATIVE STATE</h3>
          <label>
            current_time
            <input
              name="generationSession.current_authoritative_state.current_time"
              value={session.current_authoritative_state?.current_time ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ current_time: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.current_time" label="current_time" />
          <label>
            current_location
            <input
              name="generationSession.current_authoritative_state.current_location"
              value={session.current_authoritative_state?.current_location ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ current_location: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.current_location" label="current_location" />
          <label>
            onstage_entities
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
          </label>
          <BriefFieldHelp path="current_authoritative_state.onstage_entities[]" label="onstage_entities" />
          <label>
            immediate_situation_summary
            <textarea
              name="generationSession.current_authoritative_state.immediate_situation_summary"
              value={session.current_authoritative_state?.immediate_situation_summary ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ immediate_situation_summary: event.target.value })}
            />
          </label>
          <BriefFieldHelp
            path="current_authoritative_state.immediate_situation_summary"
            label="immediate_situation_summary"
          />
          <label>
            offstage_pressuring_entities
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
          </label>
          <BriefFieldHelp
            path="current_authoritative_state.offstage_pressuring_entities[]"
            label="offstage_pressuring_entities"
          />
          <label>
            positions
            <textarea
              name="generationSession.current_authoritative_state.positions"
              value={editableLines(session.current_authoritative_state?.positions)}
              onChange={(event) => updateCurrentAuthoritativeState({ positions: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.positions" label="positions" />
          <label>
            possessions
            <textarea
              name="generationSession.current_authoritative_state.possessions"
              value={editableLines(session.current_authoritative_state?.possessions)}
              onChange={(event) => updateCurrentAuthoritativeState({ possessions: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.possessions" label="possessions" />
          <label>
            visible_conditions
            <textarea
              name="generationSession.current_authoritative_state.visible_conditions"
              value={(session.current_authoritative_state?.visible_conditions ?? []).join("\n")}
              onChange={(event) => updateCurrentAuthoritativeState({ visible_conditions: splitLines(event.target.value) })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.visible_conditions[]" label="visible_conditions" />
          <label>
            environmental_conditions
            <textarea
              name="generationSession.current_authoritative_state.environmental_conditions"
              value={session.current_authoritative_state?.environmental_conditions ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ environmental_conditions: event.target.value })}
            />
          </label>
          <BriefFieldHelp
            path="current_authoritative_state.environmental_conditions"
            label="environmental_conditions"
          />
          <label>
            entity_statuses
            <textarea
              name="generationSession.current_authoritative_state.entity_statuses"
              value={editableLines(session.current_authoritative_state?.entity_statuses)}
              onChange={(event) => updateCurrentAuthoritativeState({ entity_statuses: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.entity_statuses" label="entity_statuses" />
          <label>
            line_of_sight_and_visibility
            <textarea
              name="generationSession.current_authoritative_state.line_of_sight_and_visibility"
              value={session.current_authoritative_state?.line_of_sight_and_visibility ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ line_of_sight_and_visibility: event.target.value })}
            />
          </label>
          <BriefFieldHelp
            path="current_authoritative_state.line_of_sight_and_visibility"
            label="line_of_sight_and_visibility"
          />
          <label>
            routes_and_exits
            <textarea
              name="generationSession.current_authoritative_state.routes_and_exits"
              value={(session.current_authoritative_state?.routes_and_exits ?? []).join("\n")}
              onChange={(event) => updateCurrentAuthoritativeState({ routes_and_exits: splitLines(event.target.value) })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.routes_and_exits[]" label="routes_and_exits" />
          <label>
            available_time
            <input
              name="generationSession.current_authoritative_state.available_time"
              value={session.current_authoritative_state?.available_time ?? ""}
              onChange={(event) => updateCurrentAuthoritativeState({ available_time: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.available_time" label="available_time" />
          <label>
            consent_or_force_conditions
            <input
              name="generationSession.current_authoritative_state.consent_or_force_conditions"
              value={session.current_authoritative_state?.consent_or_force_conditions ?? "none"}
              onChange={(event) => updateCurrentAuthoritativeState({ consent_or_force_conditions: event.target.value })}
            />
          </label>
          <BriefFieldHelp
            path="current_authoritative_state.consent_or_force_conditions"
            label="consent_or_force_conditions"
          />
          <label>
            current_locks
            <textarea
              name="generationSession.current_authoritative_state.current_locks"
              value={(session.current_authoritative_state?.current_locks ?? []).join("\n")}
              onChange={(event) => updateCurrentAuthoritativeState({ current_locks: splitLines(event.target.value) })}
            />
          </label>
          <BriefFieldHelp path="current_authoritative_state.current_locks[]" label="current_locks" />
        </section>

        <section className="configPanel" aria-labelledby="handoff-brief">
          <h3 id="handoff-brief">IMMEDIATE HANDOFF</h3>
          <label>
            recent_causal_context
            <textarea
              name="generationSession.immediate_handoff.recent_causal_context"
              value={immediateHandoff.recent_causal_context}
              onChange={(event) => updateSurface("immediate_handoff", { ...immediateHandoff, recent_causal_context: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="immediate_handoff.recent_causal_context" label="recent_causal_context" />
          <label>
            prior_accepted_prose_status_or_handoff_note
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
          </label>
          <BriefFieldHelp
            path="immediate_handoff.prior_accepted_prose_status_or_handoff_note"
            label="prior_accepted_prose_status_or_handoff_note"
          />
          {pasteWarning ? <p className="status statusWarning">This looks like pasted prose. Use a user-authored handoff note instead.</p> : null}
        </section>

        <section className="configPanel" aria-labelledby="directive-brief">
          <h3 id="directive-brief">MANUAL MOMENT DIRECTIVE</h3>
          <label>
            must_render
            <textarea
              name="generationSession.manual_moment_directive.must_render"
              value={manualDirective.must_render.join("\n")}
              onChange={(event) => updateSurface("manual_moment_directive", { ...manualDirective, must_render: splitLines(event.target.value) })}
            />
          </label>
          <BriefFieldHelp path="manual_moment_directive.must_render[]" label="must_render" />
        </section>

        <section className="configPanel" aria-labelledby="voice-pressure-brief">
          <h3 id="voice-pressure-brief">CURRENT CAST VOICE PRESSURE</h3>
          <label>
            cast_member_id
            <input
              value={currentVoicePressure.cast_member_id}
              onChange={(event) =>
                updateSurface("current_cast_voice_pressure", [{ ...currentVoicePressure, cast_member_id: event.target.value }])
              }
            />
          </label>
          <BriefFieldHelp path="current_cast_voice_pressure[].cast_member_id" label="cast_member_id" />
          <label>
            local_function
            <select
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
          </label>
          <BriefFieldHelp path="current_cast_voice_pressure[].local_function" label="local_function" />
          <label>
            current_voice_pressure
            <textarea
              value={currentVoicePressure.current_voice_pressure}
              onChange={(event) =>
                updateSurface("current_cast_voice_pressure", [{ ...currentVoicePressure, current_voice_pressure: event.target.value }])
              }
            />
          </label>
          <BriefFieldHelp path="current_cast_voice_pressure[].current_voice_pressure" label="current_voice_pressure" />
        </section>

        <section className="configPanel" aria-labelledby="override-brief">
          <h3 id="override-brief">CAST VOICE OVERRIDES</h3>
          <label>
            override_text
            <textarea
              value={voiceOverride.override_text}
              onChange={(event) => updateSurface("cast_voice_overrides", [{ ...voiceOverride, override_text: event.target.value }])}
            />
          </label>
          <BriefFieldHelp path="cast_voice_overrides[].override_text" label="override_text" />
        </section>

        <section className="configPanel" aria-labelledby="validation-focus-brief">
          <h3 id="validation-focus-brief">GENERATION VALIDATION FOCUS</h3>
          <label>
            generation_context
            <select
              value={validationFocusTags.generation_context?.[0] ?? defaultGenerationContext}
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
          </label>
          <BriefFieldHelp
            path="generation_validation_focus.validation_focus_tags.generation_context[]"
            label="generation_context"
          />
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
        </section>

        <section className="configPanel stopGuidancePanel" aria-labelledby="stop-guidance-brief">
          <h3 id="stop-guidance-brief">STOP GUIDANCE</h3>
          <label>
            soft_unit_guidance
            <textarea
              name="generationSession.stop_guidance.soft_unit_guidance"
              value={stopGuidance.soft_unit_guidance}
              onChange={(event) => updateSurface("stop_guidance", { soft_unit_guidance: event.target.value })}
            />
          </label>
          <BriefFieldHelp path="stop_guidance.soft_unit_guidance" label="soft_unit_guidance" />
          {nonLocalStopWarning ? <p className="status statusWarning">This sounds non-local. Keep stop guidance to the next local prose unit.</p> : null}
        </section>
      </div>

      <button type="button" onClick={() => void save()}>Save Generation Brief</button>
    </section>
  );
}
