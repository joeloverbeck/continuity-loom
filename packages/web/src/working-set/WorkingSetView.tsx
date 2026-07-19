import {
  activeWorkingSetSchema,
  generationSessionDraftSchema,
  whatWillCompile
} from "@loom/core";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";

import {
  getGenerationBrief,
  getWorkingSet,
  listRecords,
  setGenerationBrief,
  setWorkingSet,
  type RecordSummary
} from "../api.js";
import {
  browsePrimaryLabel,
  browseSecondaryLabel,
  browseUnavailableMessage
} from "../records/browse-identity.js";

type ActiveWorkingSet = z.infer<typeof activeWorkingSetSchema>;

const activeLocalFunctions = [
  "pov_narrator",
  "active_speaker",
  "active_silent",
  "close_non_pov",
  "physically_active",
  "materially_referenced"
] as const;

function groupByType(records: readonly RecordSummary[]): Array<[string, RecordSummary[]]> {
  const groups = new Map<string, RecordSummary[]>();

  for (const record of records) {
    groups.set(record.type, [...(groups.get(record.type) ?? []), record]);
  }

  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function defaultActiveWorkingSet(selectedRecordIds: readonly string[]): ActiveWorkingSet {
  return {
    selected_records: [...selectedRecordIds],
    active_onstage_cast_full: [],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: []
  };
}

function loadFailureMessage(surface: string, message: string): string {
  return `${surface} could not load: ${message}`;
}

function castBand(recordId: string, activeWorkingSet: ActiveWorkingSet): "none" | "active" | "present_minor" | "offstage" {
  if (activeWorkingSet.active_onstage_cast_full.some((entry) => entry.cast_member_id === recordId)) {
    return "active";
  }

  if (activeWorkingSet.present_minor_cast_compressed.includes(recordId)) {
    return "present_minor";
  }

  if (activeWorkingSet.offstage_relevant_cast.includes(recordId)) {
    return "offstage";
  }

  return "none";
}

function removeCastFromBands(recordId: string, activeWorkingSet: ActiveWorkingSet): ActiveWorkingSet {
  return {
    ...activeWorkingSet,
    active_onstage_cast_full: activeWorkingSet.active_onstage_cast_full.filter((entry) => entry.cast_member_id !== recordId),
    present_minor_cast_compressed: activeWorkingSet.present_minor_cast_compressed.filter((id) => id !== recordId),
    offstage_relevant_cast: activeWorkingSet.offstage_relevant_cast.filter((id) => id !== recordId)
  };
}

export function WorkingSetView(): React.JSX.Element {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [activeWorkingSet, setActiveWorkingSet] = useState<ActiveWorkingSet>(() => defaultActiveWorkingSet([]));
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([listRecords({ includeArchived: true }), getWorkingSet(), getGenerationBrief()])
      .then(([recordsResponse, workingSetResponse, briefResponse]) => {
        if (!active) {
          return;
        }

        if (recordsResponse.ok) {
          setRecords(recordsResponse.records);
        } else {
          setNotice(loadFailureMessage("Records", recordsResponse.message));
        }

        if (workingSetResponse.ok) {
          setSelectedRecordIds(workingSetResponse.selectedRecordIds);
        } else {
          setNotice(loadFailureMessage("Working-set membership", workingSetResponse.message));
        }

        const selectedIds = workingSetResponse.ok ? workingSetResponse.selectedRecordIds : [];
        if (briefResponse.ok) {
          const session = generationSessionDraftSchema.parse(briefResponse.session);
          const persistedWorkingSet = session.active_working_set
            ? activeWorkingSetSchema.parse(session.active_working_set)
            : undefined;
          setActiveWorkingSet({
            ...defaultActiveWorkingSet(selectedIds),
            ...(persistedWorkingSet ?? {}),
            selected_records: selectedIds
          });
        } else {
          setNotice(loadFailureMessage("Generation brief", briefResponse.message));
          setActiveWorkingSet(defaultActiveWorkingSet(selectedIds));
        }
      })
      .catch(() => {
        if (active) {
          setNotice("Unexpected error while loading active working set.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedRecords = useMemo(() => {
    const selected = new Set(selectedRecordIds);
    return records.filter((record) => selected.has(record.id));
  }, [records, selectedRecordIds]);
  const destinationBuckets = useMemo(
    () => whatWillCompile(selectedRecords, activeWorkingSet),
    [activeWorkingSet, selectedRecords]
  );
  const recordById = useMemo(() => new Map(records.map((record) => [record.id, record])), [records]);

  async function persistActiveWorkingSet(next: ActiveWorkingSet): Promise<void> {
    setActiveWorkingSet(next);
    const response = await setGenerationBrief({ active_working_set: next });

    if (!response.ok) {
      setNotice(response.message);
      setActiveWorkingSet(activeWorkingSet);
    }
  }

  async function assignCastBand(recordId: string, band: "none" | "active" | "present_minor" | "offstage"): Promise<void> {
    const base = removeCastFromBands(recordId, activeWorkingSet);
    const next: ActiveWorkingSet = {
      ...base,
      selected_records: selectedRecordIds,
      ...(band === "active"
        ? {
            active_onstage_cast_full: [
              ...base.active_onstage_cast_full,
              { cast_member_id: recordId, local_function: "active_speaker" as const }
            ]
          }
        : {}),
      ...(band === "present_minor"
        ? { present_minor_cast_compressed: [...base.present_minor_cast_compressed, recordId] }
        : {}),
      ...(band === "offstage"
        ? { offstage_relevant_cast: [...base.offstage_relevant_cast, recordId] }
        : {})
    };

    await persistActiveWorkingSet(next);
  }

  async function updateLocalFunction(recordId: string, localFunction: typeof activeLocalFunctions[number]): Promise<void> {
    await persistActiveWorkingSet({
      ...activeWorkingSet,
      selected_records: selectedRecordIds,
      active_onstage_cast_full: activeWorkingSet.active_onstage_cast_full.map((entry) =>
        entry.cast_member_id === recordId ? { ...entry, local_function: localFunction } : entry
      )
    });
  }

  async function removeRecord(recordId: string): Promise<void> {
    const nextIds = selectedRecordIds.filter((id) => id !== recordId);
    setSelectedRecordIds(nextIds);
    const response = await setWorkingSet(nextIds);

    if (!response.ok) {
      setNotice(response.message);
      setSelectedRecordIds(selectedRecordIds);
      return;
    }

    setSelectedRecordIds(response.selectedRecordIds);
  }

  return (
    <section className="surface workingSetSurface" aria-labelledby="working-set-title">
      <div className="projectHeader">
        <p className="eyebrow">Manual membership</p>
        <h2 id="working-set-title">Active Working Set</h2>
      </div>

      {notice ? (
        <p role="alert" className="status statusError">
          {notice}
        </p>
      ) : null}

      {selectedRecords.length === 0 ? <p className="muted">No records selected.</p> : null}

      <div className="configStack">
        {groupByType(selectedRecords).map(([type, typeRecords]) => (
          <section className="configPanel" key={type} aria-labelledby={`${type.replace(/\W+/g, "-").toLowerCase()}-working-set`}>
            <h3 id={`${type.replace(/\W+/g, "-").toLowerCase()}-working-set`}>{type}</h3>
            <div className="recordTableScroll">
              <table className="recordTable workingSetTable">
                <thead>
                  <tr>
                    <th className="labelCol">Label</th>
                    <th className="statusCol">Status</th>
                    {type === "CAST MEMBER" ? <th className="bandCol">Cast band</th> : null}
                    <th className="membershipCol">Membership</th>
                  </tr>
                </thead>
                <tbody>
                  {typeRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="labelCol">
                        <span className="recordPrimaryLabel">{browsePrimaryLabel(record)}</span>
                        {browseSecondaryLabel(record) ? (
                          <span className="recordSecondaryLabel">{browseSecondaryLabel(record)}</span>
                        ) : null}
                        {browseUnavailableMessage(record) ? (
                          <span className="status statusWarning">{browseUnavailableMessage(record)}</span>
                        ) : null}
                      </td>
                      <td className="statusCol">{record.status ?? "none"}</td>
                      {type === "CAST MEMBER" ? (
                        <td className="bandCol">
                          <label>
                            band
                            <select
                              aria-label={`Cast band for ${browsePrimaryLabel(record)}`}
                              value={castBand(record.id, activeWorkingSet)}
                              onChange={(event) => void assignCastBand(record.id, event.target.value as "none" | "active" | "present_minor" | "offstage")}
                            >
                              <option value="none">Unassigned</option>
                              <option value="active">active/onstage full</option>
                              <option value="present_minor">present-minor compressed</option>
                              <option value="offstage">offstage relevance</option>
                            </select>
                          </label>
                          {castBand(record.id, activeWorkingSet) === "active" ? (
                            <label>
                              local_function
                              <select
                                aria-label={`Local function for ${browsePrimaryLabel(record)}`}
                                value={
                                  activeWorkingSet.active_onstage_cast_full.find((entry) => entry.cast_member_id === record.id)
                                    ?.local_function ?? "active_speaker"
                                }
                                onChange={(event) => void updateLocalFunction(record.id, event.target.value as typeof activeLocalFunctions[number])}
                              >
                                {activeLocalFunctions.map((value) => (
                                  <option key={value} value={value}>{value}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </td>
                      ) : null}
                      <td className="membershipCol">
                        <button type="button" onClick={() => void removeRecord(record.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {destinationBuckets.length > 0 ? (
        <section className="configPanel" aria-labelledby="compile-preview-title">
          <h3 id="compile-preview-title">What Will Compile</h3>
          <div className="configStack">
            {destinationBuckets.map((bucket) => (
              <section key={bucket.familyId} aria-labelledby={`compile-preview-${bucket.familyId}`}>
                <h4 id={`compile-preview-${bucket.familyId}`}>{bucket.label}</h4>
                <ul>
                  {bucket.records.map((record) => {
                    const fullRecord = recordById.get(record.id);
                    const primary = fullRecord ? browsePrimaryLabel(fullRecord) : record.displayLabel;
                    const secondary = fullRecord ? browseSecondaryLabel(fullRecord) : "";
                    return (
                      <li key={record.id}>
                        <span className="recordPrimaryLabel">{primary}</span>
                        {secondary ? <span className="recordSecondaryLabel">{secondary}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
