import type { GenerationSessionDraft } from "./generation-brief-draft.js";

export type ConsumedGenerationGuidancePath =
  | "manual_moment_directive.must_render[]"
  | "manual_moment_directive.may_render_if_naturally_caused[]"
  | "manual_moment_directive.do_not_force[]"
  | "current_cast_voice_pressure[]"
  | "cast_voice_overrides[]"
  | "generation_validation_focus.validation_focus_tags.expected_local_modes[]"
  | "generation_validation_focus.validation_focus_tags.possible_durable_changes[]"
  | "stop_guidance.soft_unit_guidance";

export interface ConsumedGenerationGuidanceEntry {
  id: string;
  fieldPath: ConsumedGenerationGuidancePath;
  value: string;
}

export function listConsumedGenerationGuidance(
  draft: GenerationSessionDraft
): readonly ConsumedGenerationGuidanceEntry[] {
  return [
    ...stringListEntries(
      "manual_moment_directive.must_render[]",
      draft.manual_moment_directive?.must_render
    ),
    ...stringListEntries(
      "manual_moment_directive.may_render_if_naturally_caused[]",
      draft.manual_moment_directive?.may_render_if_naturally_caused
    ),
    ...stringListEntries(
      "manual_moment_directive.do_not_force[]",
      draft.manual_moment_directive?.do_not_force
    ),
    ...objectEntries("current_cast_voice_pressure[]", draft.current_cast_voice_pressure, "cast_member_id"),
    ...objectEntries("cast_voice_overrides[]", draft.cast_voice_overrides, "cast_member_id"),
    ...stringListEntries(
      "generation_validation_focus.validation_focus_tags.expected_local_modes[]",
      draft.generation_validation_focus?.validation_focus_tags?.expected_local_modes
    ),
    ...stringListEntries(
      "generation_validation_focus.validation_focus_tags.possible_durable_changes[]",
      draft.generation_validation_focus?.validation_focus_tags?.possible_durable_changes
    ),
    ...singleStringEntry("stop_guidance.soft_unit_guidance", draft.stop_guidance?.soft_unit_guidance)
  ];
}

export function applyConsumedGenerationGuidanceRemoval(
  draft: GenerationSessionDraft,
  selectedEntryIds: readonly string[]
): GenerationSessionDraft {
  const updated = structuredClone(draft);
  const selected = new Set(selectedEntryIds);

  removeSelectedStringList(
    updated.manual_moment_directive?.must_render,
    "manual_moment_directive.must_render[]",
    selected
  );
  removeSelectedStringList(
    updated.manual_moment_directive?.may_render_if_naturally_caused,
    "manual_moment_directive.may_render_if_naturally_caused[]",
    selected
  );
  removeSelectedStringList(
    updated.manual_moment_directive?.do_not_force,
    "manual_moment_directive.do_not_force[]",
    selected
  );
  removeSelectedObjectGuidance(updated.current_cast_voice_pressure, "current_cast_voice_pressure[]", selected);
  removeSelectedObjectGuidance(updated.cast_voice_overrides, "cast_voice_overrides[]", selected);
  removeSelectedStringList(
    updated.generation_validation_focus?.validation_focus_tags?.expected_local_modes,
    "generation_validation_focus.validation_focus_tags.expected_local_modes[]",
    selected
  );
  removeSelectedStringList(
    updated.generation_validation_focus?.validation_focus_tags?.possible_durable_changes,
    "generation_validation_focus.validation_focus_tags.possible_durable_changes[]",
    selected
  );

  if (updated.stop_guidance && selected.has(entryId("stop_guidance.soft_unit_guidance", 0))) {
    updated.stop_guidance.soft_unit_guidance = "";
  }

  return updated;
}

function stringListEntries(
  fieldPath: ConsumedGenerationGuidancePath,
  values: readonly string[] | undefined
): ConsumedGenerationGuidanceEntry[] {
  return (values ?? []).flatMap((value, index) => {
    const trimmed = value.trim();
    return trimmed ? [{ id: entryId(fieldPath, index), fieldPath, value: trimmed }] : [];
  });
}

function singleStringEntry(
  fieldPath: ConsumedGenerationGuidancePath,
  value: string | undefined
): ConsumedGenerationGuidanceEntry[] {
  const trimmed = value?.trim();
  return trimmed ? [{ id: entryId(fieldPath, 0), fieldPath, value: trimmed }] : [];
}

function objectEntries<T extends Record<string, unknown>>(
  fieldPath: ConsumedGenerationGuidancePath,
  values: readonly T[] | undefined,
  identityKey: keyof T
): ConsumedGenerationGuidanceEntry[] {
  return (values ?? []).flatMap((value, index) => {
    const guidanceValues = Object.entries(value)
      .filter(([key]) => key !== identityKey)
      .flatMap(([, nested]) => readableValues(nested));
    return guidanceValues.length > 0
      ? [{ id: entryId(fieldPath, index), fieldPath, value: guidanceValues.join("; ") }]
      : [];
  });
}

function readableValues(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(readableValues);
  }
  return [];
}

function removeSelectedStringList(
  values: string[] | undefined,
  fieldPath: ConsumedGenerationGuidancePath,
  selected: ReadonlySet<string>
): void {
  if (!values) {
    return;
  }
  const retained = values.filter((_value, index) => !selected.has(entryId(fieldPath, index)));
  values.splice(0, values.length, ...retained);
}

function removeSelectedObjectGuidance<T extends { cast_member_id?: string }>(
  values: T[] | undefined,
  fieldPath: ConsumedGenerationGuidancePath,
  selected: ReadonlySet<string>
): void {
  if (!values) {
    return;
  }
  values.forEach((value, index) => {
    if (selected.has(entryId(fieldPath, index))) {
      const castMemberId = value.cast_member_id;
      for (const key of Object.keys(value)) {
        delete value[key as keyof T];
      }
      if (castMemberId) {
        value.cast_member_id = castMemberId;
      }
    }
  });
}

function entryId(fieldPath: ConsumedGenerationGuidancePath, index: number): string {
  return `${fieldPath}:${index}`;
}
