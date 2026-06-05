import { useEffect, useMemo, useState } from "react";

import { getWorkingSet, listRecords, setWorkingSet, type RecordSummary } from "../api.js";

function groupByType(records: readonly RecordSummary[]): Array<[string, RecordSummary[]]> {
  const groups = new Map<string, RecordSummary[]>();

  for (const record of records) {
    groups.set(record.type, [...(groups.get(record.type) ?? []), record]);
  }

  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

export function WorkingSetView(): React.JSX.Element {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([listRecords({ includeArchived: true }), getWorkingSet()])
      .then(([recordsResponse, workingSetResponse]) => {
        if (!active) {
          return;
        }

        if (recordsResponse.ok) {
          setRecords(recordsResponse.records);
        }

        if (workingSetResponse.ok) {
          setSelectedRecordIds(workingSetResponse.selectedRecordIds);
        }
      })
      .catch(() => {
        if (active) {
          setNotice("Could not load active working set.");
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
            <table className="recordTable">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Status</th>
                  <th>Membership</th>
                </tr>
              </thead>
              <tbody>
                {typeRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.displayLabel}</td>
                    <td>{record.status ?? "none"}</td>
                    <td>
                      <button type="button" onClick={() => void removeRecord(record.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </section>
  );
}
