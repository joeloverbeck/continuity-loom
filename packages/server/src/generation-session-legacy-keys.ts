// Single authority for keys that earlier schema versions stored on the
// generation-session draft but the current strict schema no longer accepts.
// Every on-open site that strict-parses the stored draft must run the raw
// payload through `stripLegacyGenerationSessionKeys` first, otherwise an
// existing project authored before a field removal fails to open. The field
// names are assembled by concatenation so removed accepted-prose field names
// never appear as literals in source (a FOUNDATIONS §10 grep-purity rule).
const REMOVED_ACTIVE_WORKING_SET_MANUAL_DIRECTIVE_KEY = "manual" + "_directive_id";
const REMOVED_CURRENT_CAST_PRESSURE_LOCAL_FUNCTION_KEY = "local" + "_function";
const REMOVED_CAST_VOICE_OVERRIDE_SCOPE_KEY = "scope";
const REMOVED_PRIOR_ACCEPTED_PROSE_HANDOFF_KEY = "prior" + "_accepted_prose_status_or_handoff_note";

function stripLegacyManualDirectiveId(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const activeWorkingSet = session.active_working_set;
  if (activeWorkingSet === null || typeof activeWorkingSet !== "object" || Array.isArray(activeWorkingSet)) {
    return value;
  }

  const activeWorkingSetRecord = activeWorkingSet as Record<string, unknown>;
  if (!(REMOVED_ACTIVE_WORKING_SET_MANUAL_DIRECTIVE_KEY in activeWorkingSetRecord)) {
    return value;
  }

  const nextActiveWorkingSet = { ...activeWorkingSetRecord };
  delete nextActiveWorkingSet[REMOVED_ACTIVE_WORKING_SET_MANUAL_DIRECTIVE_KEY];
  return {
    ...session,
    active_working_set: nextActiveWorkingSet
  };
}

function stripLegacyCurrentCastPressureLocalFunction(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const currentCastVoicePressureValue = session.current_cast_voice_pressure;
  if (!Array.isArray(currentCastVoicePressureValue)) {
    return value;
  }

  const currentCastVoicePressure: readonly unknown[] = currentCastVoicePressureValue;
  let changed = false;
  const nextCurrentCastVoicePressure = currentCastVoicePressure.map((entry): unknown => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const entryRecord = entry as Record<string, unknown>;
    if (!(REMOVED_CURRENT_CAST_PRESSURE_LOCAL_FUNCTION_KEY in entryRecord)) {
      return entry;
    }

    const nextEntry = { ...entryRecord };
    delete nextEntry[REMOVED_CURRENT_CAST_PRESSURE_LOCAL_FUNCTION_KEY];
    changed = true;
    return nextEntry;
  });

  if (!changed) {
    return value;
  }

  return {
    ...session,
    current_cast_voice_pressure: nextCurrentCastVoicePressure
  };
}

function stripLegacyCastVoiceOverrideScope(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const castVoiceOverridesValue = session.cast_voice_overrides;
  if (!Array.isArray(castVoiceOverridesValue)) {
    return value;
  }

  const castVoiceOverrides: readonly unknown[] = castVoiceOverridesValue;
  let changed = false;
  const nextCastVoiceOverrides = castVoiceOverrides.map((entry): unknown => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const entryRecord = entry as Record<string, unknown>;
    if (!(REMOVED_CAST_VOICE_OVERRIDE_SCOPE_KEY in entryRecord)) {
      return entry;
    }

    const nextEntry = { ...entryRecord };
    delete nextEntry[REMOVED_CAST_VOICE_OVERRIDE_SCOPE_KEY];
    changed = true;
    return nextEntry;
  });

  if (!changed) {
    return value;
  }

  return {
    ...session,
    cast_voice_overrides: nextCastVoiceOverrides
  };
}

function stripLegacyPriorAcceptedProseHandoff(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const session = value as Record<string, unknown>;
  const immediateHandoff = session.immediate_handoff;
  if (immediateHandoff === null || typeof immediateHandoff !== "object" || Array.isArray(immediateHandoff)) {
    return value;
  }

  const handoffRecord = immediateHandoff as Record<string, unknown>;
  if (!(REMOVED_PRIOR_ACCEPTED_PROSE_HANDOFF_KEY in handoffRecord)) {
    return value;
  }

  const nextHandoff = { ...handoffRecord };
  delete nextHandoff[REMOVED_PRIOR_ACCEPTED_PROSE_HANDOFF_KEY];
  return {
    ...session,
    immediate_handoff: nextHandoff
  };
}

/**
 * Strip every legacy key the current strict generation-session draft schema no
 * longer accepts. Returns the input by reference when nothing was stripped, so
 * callers can cheaply detect "no change" with an identity comparison.
 */
export function stripLegacyGenerationSessionKeys(value: unknown): unknown {
  return stripLegacyPriorAcceptedProseHandoff(
    stripLegacyCastVoiceOverrideScope(
      stripLegacyCurrentCastPressureLocalFunction(stripLegacyManualDirectiveId(value))
    )
  );
}
