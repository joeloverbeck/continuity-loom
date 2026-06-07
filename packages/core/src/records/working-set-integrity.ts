import type { GenerationSessionDraft } from "./generation-brief-draft.js";

export interface WorkingSetPruneResult<Session extends GenerationSessionDraft = GenerationSessionDraft> {
  session: Session;
  removed: string[];
}

function removeDanglingIds(
  ids: readonly string[],
  keepRecordId: (recordId: string) => boolean,
  removed: Set<string>
): string[] {
  return ids.filter((id) => {
    const keep = keepRecordId(id);
    if (!keep) {
      removed.add(id);
    }
    return keep;
  });
}

function isRecordIdPov(value: string | undefined): value is string {
  return value !== undefined && value !== "omniscient";
}

export function pruneWorkingSetReferences(
  session: GenerationSessionDraft,
  keepRecordId: (recordId: string) => boolean
): WorkingSetPruneResult {
  if (!session.active_working_set) {
    return { session, removed: [] };
  }

  const removed = new Set<string>();
  const activeWorkingSet = session.active_working_set;
  const selectedPov = activeWorkingSet.selected_pov;
  const manualDirectiveId = activeWorkingSet.manual_directive_id;

  const prunedSelectedPov =
    isRecordIdPov(selectedPov) && !keepRecordId(selectedPov)
      ? undefined
      : selectedPov;
  if (isRecordIdPov(selectedPov) && prunedSelectedPov === undefined) {
    removed.add(selectedPov);
  }

  const prunedManualDirectiveId =
    manualDirectiveId !== undefined && !keepRecordId(manualDirectiveId)
      ? undefined
      : manualDirectiveId;
  if (manualDirectiveId !== undefined && prunedManualDirectiveId === undefined) {
    removed.add(manualDirectiveId);
  }

  const sessionWithPrunedWorkingSet: GenerationSessionDraft = {
    ...session,
    active_working_set: {
      selected_records: removeDanglingIds(activeWorkingSet.selected_records ?? [], keepRecordId, removed),
      active_onstage_cast_full: (activeWorkingSet.active_onstage_cast_full ?? []).filter((entry) => {
        const keep = keepRecordId(entry.cast_member_id);
        if (!keep) {
          removed.add(entry.cast_member_id);
        }
        return keep;
      }),
      present_minor_cast_compressed: removeDanglingIds(
        activeWorkingSet.present_minor_cast_compressed ?? [],
        keepRecordId,
        removed
      ),
      offstage_relevant_cast: removeDanglingIds(activeWorkingSet.offstage_relevant_cast ?? [], keepRecordId, removed),
      ...(prunedSelectedPov === undefined ? {} : { selected_pov: prunedSelectedPov }),
      ...(prunedManualDirectiveId === undefined ? {} : { manual_directive_id: prunedManualDirectiveId })
    }
  };

  return { session: sessionWithPrunedWorkingSet, removed: [...removed] };
}
