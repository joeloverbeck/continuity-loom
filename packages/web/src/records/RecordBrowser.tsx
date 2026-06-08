import { getEditorDescriptor, recordTypes } from "@loom/core";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getRecord,
  getWorkingSet,
  listRecords,
  setWorkingSet,
  type RecordDetail,
  type RecordSummary
} from "../api.js";
import { CastMemberEditor } from "./CastMemberEditor.js";
import { RecordEditor } from "./RecordEditor.js";

const columns: Array<ColumnDef<RecordSummary>> = [
  { accessorKey: "type", header: "Type" },
  { accessorKey: "displayLabel", header: "Label" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "salience", header: "Salience" },
  { accessorKey: "urgency", header: "Urgency" },
  {
    accessorKey: "archived",
    header: "Archived",
    cell: ({ row }) => (row.original.archived ? "yes" : "no")
  }
];

function descriptorHasField(recordType: string, fieldName: "salience" | "urgency"): boolean {
  return getEditorDescriptor(recordType)?.fields.some((field) => field.name === fieldName) ?? false;
}

function filterLocally(
  records: readonly RecordSummary[],
  filters: { type: string; status: string; q: string; workingSetOnly: boolean },
  workingSetIds: ReadonlySet<string>
): RecordSummary[] {
  const q = filters.q.trim().toLowerCase();

  return records.filter((record) => {
    const typeMatches = filters.type ? record.type === filters.type : true;
    const statusMatches = filters.status ? record.status === filters.status : true;
    const textMatches = q ? record.displayLabel.toLowerCase().includes(q) || record.id.toLowerCase().includes(q) : true;
    const workingSetMatches = filters.workingSetOnly ? workingSetIds.has(record.id) : true;

    return typeMatches && statusMatches && textMatches && workingSetMatches;
  });
}

function groupingOptions(typeFilter: string): Array<"salience" | "urgency"> {
  const candidateTypes = typeFilter ? [typeFilter] : recordTypes;

  return (["salience", "urgency"] as const).filter((field) =>
    candidateTypes.some((recordType) => descriptorHasField(recordType, field))
  );
}

function toRecordSummary(record: RecordDetail): RecordSummary {
  return {
    id: record.id,
    type: record.type,
    displayLabel: record.displayLabel,
    status: record.status,
    salience: record.salience,
    urgency: record.urgency,
    archived: record.archived,
    userOrder: record.userOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function RecordBrowser(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [referenceTargets, setReferenceTargets] = useState<RecordSummary[]>([]);
  const [workingSetIds, setWorkingSetIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordDetail | RecordSummary | null>(null);
  const [genericEditorRecord, setGenericEditorRecord] = useState<{ recordType: string; record?: RecordDetail } | null>(null);
  const [castEditorRecord, setCastEditorRecord] = useState<RecordDetail | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    q: "",
    refRole: "",
    targetId: "",
    groupBy: "",
    workingSetOnly: false
  });

  useEffect(() => {
    let active = true;

    void getWorkingSet()
      .then((response) => {
        if (active && response.ok) {
          setWorkingSetIds(response.selectedRecordIds);
        }
      })
      .catch(() => {
        if (active) {
          setWorkingSetIds([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void listRecords({})
      .then((response) => {
        if (active && response.ok) {
          setReferenceTargets(response.records);
        }
      })
      .catch(() => {
        if (active) {
          setReferenceTargets([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void listRecords({
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.refRole ? { refRole: filters.refRole } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {})
    })
      .then((response) => {
        if (!active) {
          return;
        }

        if (!response.ok) {
          setNotice(response.message);
          setRecords([]);
          setSelectedRecord(null);
          return;
        }

        setNotice(null);
        setRecords(response.records);
        setSelectedRecord((current) => current ?? response.records[0] ?? null);
      })
      .catch(() => {
        if (active) {
          setNotice("Could not load records.");
          setRecords([]);
          setSelectedRecord(null);
        }
      });

    return () => {
      active = false;
    };
  }, [filters.type, filters.status, filters.q, filters.refRole, filters.targetId]);

  const workingSetIdSet = useMemo(() => new Set(workingSetIds), [workingSetIds]);
  const filteredRecords = useMemo(() => filterLocally(records, filters, workingSetIdSet), [records, filters, workingSetIdSet]);
  const groupedRecords = useMemo(() => {
    if (!filters.groupBy) {
      return filteredRecords;
    }

    return [...filteredRecords].sort((left, right) => {
      const leftValue = String(left[filters.groupBy as "salience" | "urgency"] ?? "");
      const rightValue = String(right[filters.groupBy as "salience" | "urgency"] ?? "");
      return leftValue.localeCompare(rightValue) || left.displayLabel.localeCompare(right.displayLabel) || left.id.localeCompare(right.id);
    });
  }, [filteredRecords, filters.groupBy]);

  const table = useReactTable({
    data: groupedRecords,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  async function selectRecord(record: RecordSummary): Promise<void> {
    setSelectedRecord(record);
    const response = await getRecord(record.id);

    if (response.ok) {
      setSelectedRecord(response.record);
    }
  }

  async function toggleWorkingSet(recordId: string): Promise<void> {
    const nextIds = workingSetIdSet.has(recordId)
      ? workingSetIds.filter((id) => id !== recordId)
      : [...workingSetIds, recordId];
    setWorkingSetIds(nextIds);
    const response = await setWorkingSet(nextIds);

    if (!response.ok) {
      setNotice(response.message);
      setWorkingSetIds(workingSetIds);
      return;
    }

    setWorkingSetIds(response.selectedRecordIds);
  }

  function openCreateForm(recordType: string): void {
    if (recordType === "CAST MEMBER") {
      setCastEditorRecord(null);
      return;
    }

    setGenericEditorRecord({ recordType });
  }

  function handleSavedRecord(savedRecord: RecordDetail): void {
    const savedSummary = toRecordSummary(savedRecord);

    setSelectedRecord(savedRecord);
    setRecords((current) => {
      const existingIndex = current.findIndex((record) => record.id === savedRecord.id);

      if (existingIndex === -1) {
        return [savedSummary, ...current];
      }

      return current.map((record) => (record.id === savedRecord.id ? savedSummary : record));
    });
    setReferenceTargets((current) => {
      const existingIndex = current.findIndex((record) => record.id === savedRecord.id);

      if (existingIndex === -1) {
        return [savedSummary, ...current];
      }

      return current.map((record) => (record.id === savedRecord.id ? savedSummary : record));
    });
  }

  const availableGroupingOptions = groupingOptions(filters.type);
  const preselectedRecordId = searchParams.get("recordId");
  const createType = searchParams.get("create");

  useEffect(() => {
    if (!preselectedRecordId) {
      return;
    }

    const target = records.find((record) => record.id === preselectedRecordId);
    if (target) {
      void selectRecord(target);
    }
  }, [preselectedRecordId, records]);

  useEffect(() => {
    if (!createType || !recordTypes.includes(createType)) {
      return;
    }

    openCreateForm(createType);
  }, [createType]);

  if (genericEditorRecord) {
    return (
      <section className="surface recordBrowser" aria-labelledby="records-title">
        <button type="button" className="linkButton" onClick={() => setGenericEditorRecord(null)}>
          Back to records
        </button>
        <RecordEditor
          recordType={genericEditorRecord.recordType}
          {...(genericEditorRecord.record ? { record: genericEditorRecord.record } : {})}
          referenceRecords={referenceTargets}
          onSaved={(savedRecord) => {
            handleSavedRecord(savedRecord);
            setGenericEditorRecord(null);
          }}
        />
      </section>
    );
  }

  if (castEditorRecord !== undefined) {
    return (
      <section className="surface recordBrowser" aria-labelledby="records-title">
        <button type="button" className="linkButton" onClick={() => setCastEditorRecord(undefined)}>
          Back to records
        </button>
        <CastMemberEditor
          {...(castEditorRecord ? { record: castEditorRecord } : {})}
          referenceRecords={referenceTargets}
          onSaved={(savedRecord) => {
            handleSavedRecord(savedRecord);
            setCastEditorRecord(undefined);
          }}
        />
      </section>
    );
  }

  return (
    <section className="surface recordBrowser" aria-labelledby="records-title">
      <div className="projectHeader">
        <p className="eyebrow">Records</p>
        <h2 id="records-title">Records</h2>
      </div>

      <div className="browserLayout">
        <div className="browserMain">
          <div className="toolbar" aria-label="Record filters">
            <label>
              Type
              <select
                value={filters.type}
                onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, groupBy: "" }))}
              >
                <option value="">All types</option>
                {recordTypes.map((recordType) => (
                  <option key={recordType} value={recordType}>
                    {recordType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <input
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              />
            </label>
            <label>
              Search
              <input
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              />
            </label>
            <label>
              Reference role
              <input
                value={filters.refRole}
                onChange={(event) => setFilters((current) => ({ ...current, refRole: event.target.value }))}
              />
            </label>
            <label>
              Reference target
              <input
                value={filters.targetId}
                onChange={(event) => setFilters((current) => ({ ...current, targetId: event.target.value }))}
              />
            </label>
            <label>
              Working set
              <select
                value={filters.workingSetOnly ? "selected" : "all"}
                onChange={(event) => setFilters((current) => ({ ...current, workingSetOnly: event.target.value === "selected" }))}
              >
                <option value="all">All records</option>
                <option value="selected">Selected only</option>
              </select>
            </label>
            <label>
              Group by
              <select
                value={filters.groupBy}
                onChange={(event) => setFilters((current) => ({ ...current, groupBy: event.target.value }))}
              >
                <option value="">None</option>
                {availableGroupingOptions.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="createRail" aria-label="Create from template">
            {recordTypes.map((recordType) => (
              <button
                key={recordType}
                type="button"
                onClick={() => openCreateForm(recordType)}
              >
                Create {recordType}
              </button>
            ))}
          </div>

          {notice ? (
            <p role="alert" className="status statusError">
              {notice}
            </p>
          ) : null}

          <table className="recordTable">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <th>Working Set</th>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button type="button" onClick={() => void toggleWorkingSet(row.original.id)}>
                      {workingSetIdSet.has(row.original.id) ? "Selected" : "Add"}
                    </button>
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {cell.column.id === "displayLabel" ? (
                        <button type="button" className="linkButton" onClick={() => void selectRecord(row.original)}>
                          {row.original.displayLabel}
                        </button>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="detailPane" aria-label="Record detail">
          {selectedRecord ? (
            <>
              <p className="eyebrow">{selectedRecord.type}</p>
              <h3>{selectedRecord.displayLabel}</h3>
              <dl className="runtimeGrid">
                <div>
                  <dt>ID</dt>
                  <dd>{selectedRecord.id}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedRecord.status ?? "none"}</dd>
                </div>
                <div>
                  <dt>Archived</dt>
                  <dd>{selectedRecord.archived ? "yes" : "no"}</dd>
                </div>
              </dl>
              {"payload" in selectedRecord ? (
                <pre className="payloadPreview">{JSON.stringify(selectedRecord.payload, null, 2)}</pre>
              ) : null}
              {selectedRecord.type === "CAST MEMBER" && "payload" in selectedRecord ? (
                <button type="button" onClick={() => setCastEditorRecord(selectedRecord)}>
                  Edit CAST MEMBER
                </button>
              ) : null}
              {selectedRecord.type !== "CAST MEMBER" && "payload" in selectedRecord ? (
                <button
                  type="button"
                  onClick={() => setGenericEditorRecord({ recordType: selectedRecord.type, record: selectedRecord })}
                >
                  Edit Record
                </button>
              ) : null}
            </>
          ) : (
            <p className="muted">No record selected.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
