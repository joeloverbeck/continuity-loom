import {
  activeWorkingSetSchema,
  generationSessionSchema
} from "@loom/core";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";

import {
  getGenerationBrief,
  getStoryConfig,
  setGenerationBrief
} from "../api.js";

type GenerationSession = z.infer<typeof generationSessionSchema>;
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

function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function proseLikePaste(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 240 || trimmed.split(/[.!?]\s+/).length >= 4 || /\n\n/.test(trimmed);
}

function parseSession(value: unknown): GenerationSession {
  return generationSessionSchema.parse(value ?? {});
}

export function GenerationBriefView(): React.JSX.Element {
  const [session, setSession] = useState<GenerationSession>(() => parseSession({}));
  const [proseModeSummary, setProseModeSummary] = useState("Not configured");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([getGenerationBrief(), getStoryConfig("PROSE MODE")])
      .then(([briefResponse, proseModeResponse]) => {
        if (!active) {
          return;
        }

        if (briefResponse.ok) {
          setSession(parseSession(briefResponse.session));
        } else {
          setNotice(briefResponse.message);
        }

        if (proseModeResponse.ok && typeof proseModeResponse.payload === "object" && proseModeResponse.payload !== null) {
          const payload = proseModeResponse.payload as Record<string, unknown>;
          setProseModeSummary(
            [
              typeof payload.pov_character === "string" ? payload.pov_character : null,
              typeof payload.person === "string" ? payload.person : null,
              typeof payload.tense === "string" ? payload.tense : null
            ].filter(Boolean).join(" / ") || "Configured"
          );
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

  const activeWorkingSet = session.active_working_set ?? {
    selected_records: [],
    active_onstage_cast_full: [],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: []
  };
  const immediateHandoff = session.immediate_handoff ?? {
    recent_causal_context: "",
    last_visible_moment: "",
    prior_accepted_prose_status_or_handoff_note: "none",
    begin_after: ""
  };
  const manualDirective = session.manual_moment_directive ?? {
    must_render: [],
    may_render_if_naturally_caused: [],
    do_not_force: []
  };
  const currentVoicePressure = session.current_cast_voice_pressure[0] ?? {
    cast_member_id: "",
    local_function: "active_speaker",
    current_voice_pressure: "",
    dialogue_pressure: "none",
    pov_narration_pressure: "none",
    nonverbal_or_silence_pressure: "none",
    current_must_preserve: [],
    current_must_avoid: []
  };
  const voiceOverride = session.cast_voice_overrides[0] ?? {
    cast_member_id: currentVoicePressure.cast_member_id,
    scope: "current_generation_only",
    reason: "none",
    applies_to: ["dialogue"],
    override_text: ""
  };
  const validationFocus = session.generation_validation_focus ?? {
    validation_focus_tags: {
      generation_context: ["first_segment"],
      expected_local_modes: [],
      possible_durable_changes: []
    }
  };
  const stopGuidance = session.stop_guidance ?? { soft_unit_guidance: "" };
  const pasteWarning = useMemo(
    () => proseLikePaste(immediateHandoff.prior_accepted_prose_status_or_handoff_note),
    [immediateHandoff.prior_accepted_prose_status_or_handoff_note]
  );
  const nonLocalStopWarning = nonLocalStopPattern.test(stopGuidance.soft_unit_guidance);

  function updateSurface<K extends keyof GenerationSession>(key: K, value: GenerationSession[K]): void {
    setSession((current) => ({ ...current, [key]: value }));
  }

  function updateActiveWorkingSet(value: Partial<ActiveWorkingSet>): void {
    updateSurface("active_working_set", { ...activeWorkingSet, ...value });
  }

  async function save(): Promise<void> {
    setNotice(null);
    const payload: Record<string, unknown> = {
      active_working_set: activeWorkingSet,
      current_authoritative_state: session.current_authoritative_state,
      immediate_handoff: immediateHandoff,
      manual_moment_directive: {
        ...manualDirective,
        must_render: manualDirective.must_render.length > 0 ? manualDirective.must_render : ["Continue the immediate moment."]
      },
      current_cast_voice_pressure: currentVoicePressure.cast_member_id ? [currentVoicePressure] : [],
      cast_voice_overrides: voiceOverride.override_text ? [voiceOverride] : [],
      generation_validation_focus: validationFocus,
      stop_guidance: stopGuidance
    };
    const response = await setGenerationBrief(payload);

    setNotice(response.ok ? "Generation brief saved." : response.message);
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

      <div className="briefStack">
        <section className="configPanel" aria-labelledby="active-working-set-brief">
          <h3 id="active-working-set-brief">ACTIVE WORKING SET</h3>
          <p className="muted">PROSE MODE source: {proseModeSummary}</p>
          <label>
            selected_pov
            <input
              value={activeWorkingSet.selected_pov ?? ""}
              onChange={(event) => updateActiveWorkingSet({ selected_pov: event.target.value || undefined })}
            />
          </label>
        </section>

        <section className="configPanel" aria-labelledby="current-state-brief">
          <h3 id="current-state-brief">CURRENT AUTHORITATIVE STATE</h3>
          <label>
            current_time
            <input
              value={session.current_authoritative_state?.current_time ?? ""}
              onChange={(event) =>
                updateSurface("current_authoritative_state", {
                  current_time: event.target.value,
                  current_location: session.current_authoritative_state?.current_location ?? "",
                  onstage_entities: session.current_authoritative_state?.onstage_entities ?? [],
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
                  current_locks: session.current_authoritative_state?.current_locks ?? []
                })
              }
            />
          </label>
        </section>

        <section className="configPanel" aria-labelledby="handoff-brief">
          <h3 id="handoff-brief">IMMEDIATE HANDOFF</h3>
          <label>
            recent_causal_context
            <textarea
              value={immediateHandoff.recent_causal_context}
              onChange={(event) => updateSurface("immediate_handoff", { ...immediateHandoff, recent_causal_context: event.target.value })}
            />
          </label>
          <label>
            prior_accepted_prose_status_or_handoff_note
            <textarea
              value={immediateHandoff.prior_accepted_prose_status_or_handoff_note}
              onChange={(event) =>
                updateSurface("immediate_handoff", {
                  ...immediateHandoff,
                  prior_accepted_prose_status_or_handoff_note: event.target.value
                })
              }
            />
          </label>
          {pasteWarning ? <p className="status statusWarning">This looks like pasted prose. Use a user-authored handoff note instead.</p> : null}
        </section>

        <section className="configPanel" aria-labelledby="directive-brief">
          <h3 id="directive-brief">MANUAL MOMENT DIRECTIVE</h3>
          <label>
            must_render
            <textarea
              value={manualDirective.must_render.join("\n")}
              onChange={(event) => updateSurface("manual_moment_directive", { ...manualDirective, must_render: lines(event.target.value) })}
            />
          </label>
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
          <label>
            current_voice_pressure
            <textarea
              value={currentVoicePressure.current_voice_pressure}
              onChange={(event) =>
                updateSurface("current_cast_voice_pressure", [{ ...currentVoicePressure, current_voice_pressure: event.target.value }])
              }
            />
          </label>
        </section>

        <section className="configPanel" aria-labelledby="override-brief">
          <h3 id="override-brief">CAST VOICE OVERRIDES</h3>
          <p className="muted">current_generation_only; never written back to CAST MEMBER records.</p>
          <label>
            override_text
            <textarea
              value={voiceOverride.override_text}
              onChange={(event) => updateSurface("cast_voice_overrides", [{ ...voiceOverride, override_text: event.target.value }])}
            />
          </label>
        </section>

        <section className="configPanel" aria-labelledby="validation-focus-brief">
          <h3 id="validation-focus-brief">GENERATION VALIDATION FOCUS</h3>
          <p className="muted">Completeness checks, not plot beats.</p>
          <label>
            generation_context
            <select
              value={validationFocus.validation_focus_tags.generation_context[0]}
              onChange={(event) =>
                updateSurface("generation_validation_focus", {
                  validation_focus_tags: {
                    ...validationFocus.validation_focus_tags,
                    generation_context: [event.target.value as "first_segment" | "continuation_after_accepted_segment"]
                  }
                })
              }
            >
              <option value="first_segment">first_segment</option>
              <option value="continuation_after_accepted_segment">continuation_after_accepted_segment</option>
            </select>
          </label>
        </section>

        <section className="configPanel stopGuidancePanel" aria-labelledby="stop-guidance-brief">
          <h3 id="stop-guidance-brief">STOP GUIDANCE</h3>
          <label>
            soft_unit_guidance
            <textarea
              value={stopGuidance.soft_unit_guidance}
              onChange={(event) => updateSurface("stop_guidance", { soft_unit_guidance: event.target.value })}
            />
          </label>
          {nonLocalStopWarning ? <p className="status statusWarning">This sounds non-local. Keep stop guidance to the next local prose unit.</p> : null}
        </section>
      </div>

      <button type="button" onClick={() => void save()}>Save Generation Brief</button>
    </section>
  );
}
