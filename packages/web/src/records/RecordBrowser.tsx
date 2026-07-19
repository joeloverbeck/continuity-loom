import {
  allTypesColumns,
  compareSeverityDesc,
  eligibleReferenceTargets,
  getColumnManifest,
  getEditorDescriptor,
  recordTypes,
  type ColumnDescriptor
} from "@loom/core";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  getRecord,
  getWorkingSet,
  listRecords,
  setWorkingSet,
  type RecordDetail,
  type RecordSummary
} from "../api.js";
import {
  browsePrimaryLabel,
  browseSecondaryLabel,
  browseUnavailableMessage
} from "./browse-identity.js";
import { CastMemberEditor } from "./CastMemberEditor.js";
import { RecordEditor } from "./RecordEditor.js";

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
    const textMatches = q
      ? [record.displayLabel, record.id, browsePrimaryLabel(record), browseSecondaryLabel(record)]
          .some((value) => value.toLowerCase().includes(q))
      : true;
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

function isRecordType(value: string | null): value is string {
  return value !== null && recordTypes.includes(value);
}

function mostPopulatedType(records: readonly RecordSummary[]): string {
  const counts = new Map<string, number>();

  for (const record of records) {
    counts.set(record.type, (counts.get(record.type) ?? 0) + 1);
  }

  return recordTypes.reduce(
    (bestType, recordType) => ((counts.get(recordType) ?? 0) > (counts.get(bestType) ?? 0) ? recordType : bestType),
    ""
  );
}

const severityColumnKeys = new Set(["salience", "urgency", "intensity"]);

function severityColumnForType(recordType: string): string | null {
  return (
    getColumnManifest(recordType)?.additionalColumns.find((column) => severityColumnKeys.has(column.fieldKey))?.fieldKey ??
    null
  );
}

function valueForSort(record: RecordSummary, fieldKey: string): string | null {
  if (fieldKey === "salience" || fieldKey === "urgency") {
    return record[fieldKey];
  }

  return record.displayValues?.[fieldKey] ?? null;
}

function hasProjectedDisplayValues(records: readonly RecordSummary[]): boolean {
  return records.some((record) => record.displayValues !== undefined);
}

function recordTypeDescription(recordType: string): string {
  return `${titleCase(recordType)} records hold the ${recordType.toLowerCase()} continuity details for the current story state.`;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.replace(/^\w/, (match) => match.toUpperCase()))
    .join(" ");
}

function toRecordSummary(record: RecordDetail): RecordSummary {
  return {
    id: record.id,
    type: record.type,
    displayLabel: record.displayLabel,
    ...(record.fullDisplayLabel === undefined ? {} : { fullDisplayLabel: record.fullDisplayLabel }),
    status: record.status,
    salience: record.salience,
    urgency: record.urgency,
    ...(record.displayValues === undefined ? {} : { displayValues: record.displayValues }),
    ...(record.browseIdentity === undefined ? {} : { browseIdentity: record.browseIdentity }),
    archived: record.archived,
    userOrder: record.userOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function fullDisplayLabel(record: RecordDetail | RecordSummary): string {
  return record.fullDisplayLabel ?? record.displayLabel;
}

function detailPrimaryLabel(record: RecordDetail | RecordSummary): string {
  return record.type === "CAST MEMBER" ? browsePrimaryLabel(record) : fullDisplayLabel(record);
}

function displayCell(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "—";
}

function columnClassName(column: ColumnDescriptor): string | undefined {
  if (column.align === "right") {
    return "numericCell";
  }

  if (column.kind === "boolean" || column.kind === "ordinal") {
    return "compactCell";
  }

  return undefined;
}

function buildDisplayValueColumn(column: ColumnDescriptor): ColumnDef<RecordSummary> {
  return {
    id: column.fieldKey,
    header: column.header,
    accessorFn: (record) => record.displayValues?.[column.fieldKey] ?? null,
    cell: ({ getValue }) => displayCell(getValue())
  };
}

function buildRecordColumns(typeFilter: string): Array<ColumnDef<RecordSummary>> {
  if (!typeFilter) {
    return allTypesColumns.map((column) => ({
      id: column.fieldKey,
      header: column.header,
      accessorFn: (record) => record[column.fieldKey as keyof RecordSummary] ?? null,
      cell: ({ getValue }) => displayCell(getValue())
    }));
  }

  const manifest = getColumnManifest(typeFilter);

  return [
    {
      id: "displayLabel",
      accessorKey: "displayLabel",
      header: manifest?.primaryLabelHeader ?? "Label",
      cell: ({ row }) => row.original.displayLabel
    },
    ...(manifest?.additionalColumns.map(buildDisplayValueColumn) ?? [])
  ];
}

function classNameForColumn(typeFilter: string, columnId: string): string | undefined {
  const sourceColumns = typeFilter ? getColumnManifest(typeFilter)?.additionalColumns ?? [] : allTypesColumns;
  const descriptor = sourceColumns.find((column) => column.fieldKey === columnId);

  return descriptor ? columnClassName(descriptor) : undefined;
}

export function RecordBrowser(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get("type");
  const defaultTypeResolvedRef = useRef(isRecordType(initialType));
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [referenceTargets, setReferenceTargets] = useState<RecordSummary[]>([]);
  const [referenceTargetsLoaded, setReferenceTargetsLoaded] = useState(false);
  const [workingSetIds, setWorkingSetIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordDetail | RecordSummary | null>(null);
  const [genericEditorRecord, setGenericEditorRecord] = useState<{ recordType: string; record?: RecordDetail } | null>(null);
  const [castEditorRecord, setCastEditorRecord] = useState<RecordDetail | null | undefined>(undefined);
  const [castPrerequisiteStep, setCastPrerequisiteStep] = useState<
    "checking" | "explanation" | "create-entity" | null
  >(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: isRecordType(initialType) ? initialType : "",
    status: "",
    q: "",
    refRole: "",
    targetId: "",
    groupBy: "",
    includeArchived: false,
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
        if (!active) {
          return;
        }

        if (response.ok) {
          setReferenceTargets(response.records);
        } else {
          setReferenceTargets([]);
        }
        setReferenceTargetsLoaded(true);
      })
      .catch(() => {
        if (active) {
          setReferenceTargets([]);
          setReferenceTargetsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (castPrerequisiteStep !== "checking" || !referenceTargetsLoaded) {
      return;
    }

    if (eligibleReferenceTargets("entity_id", referenceTargets).length > 0) {
      setCastPrerequisiteStep(null);
      setCastEditorRecord(null);
      return;
    }

    setCastPrerequisiteStep("explanation");
  }, [castPrerequisiteStep, referenceTargets, referenceTargetsLoaded]);

  useEffect(() => {
    let active = true;

    void listRecords({
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.refRole ? { refRole: filters.refRole } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {}),
      ...(filters.includeArchived ? { includeArchived: true } : {})
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
        if (!defaultTypeResolvedRef.current && hasProjectedDisplayValues(response.records)) {
          defaultTypeResolvedRef.current = true;
          const defaultType = mostPopulatedType(response.records);

          if (defaultType) {
            setFilters((current) => ({ ...current, type: defaultType }));
          }
        }
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
  }, [filters.type, filters.status, filters.q, filters.refRole, filters.targetId, filters.includeArchived]);

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (filters.type) {
        next.set("type", filters.type);
      } else {
        next.delete("type");
      }

      if (next.toString() === current.toString()) {
        return current;
      }

      return next;
    });
  }, [filters.type, setSearchParams]);

  const workingSetIdSet = useMemo(() => new Set(workingSetIds), [workingSetIds]);
  const filteredRecords = useMemo(() => filterLocally(records, filters, workingSetIdSet), [records, filters, workingSetIdSet]);
  const usesProjectedDisplayValues = hasProjectedDisplayValues(records);
  const groupedRecords = useMemo(() => {
    if (!filters.groupBy) {
      if (!usesProjectedDisplayValues) {
        return filteredRecords;
      }

      const severityField = filters.type ? severityColumnForType(filters.type) : null;

      return [...filteredRecords].sort((left, right) => {
        if (severityField) {
          const severityComparison = compareSeverityDesc(valueForSort(left, severityField), valueForSort(right, severityField));

          if (severityComparison !== 0) {
            return severityComparison;
          }
        }

        return right.updatedAt.localeCompare(left.updatedAt) || browsePrimaryLabel(left).localeCompare(browsePrimaryLabel(right)) || left.id.localeCompare(right.id);
      });
    }

    return [...filteredRecords].sort((left, right) => {
      const leftValue = String(left[filters.groupBy as "salience" | "urgency"] ?? "");
      const rightValue = String(right[filters.groupBy as "salience" | "urgency"] ?? "");
      return leftValue.localeCompare(rightValue) || browsePrimaryLabel(left).localeCompare(browsePrimaryLabel(right)) || left.id.localeCompare(right.id);
    });
  }, [filteredRecords, filters.groupBy, filters.type, usesProjectedDisplayValues]);

  const columns = useMemo(() => buildRecordColumns(filters.type), [filters.type]);
  const showScopedEmptyState = !notice && filters.type && groupedRecords.length === 0;

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
      if (!referenceTargetsLoaded) {
        setCastPrerequisiteStep("checking");
        return;
      }

      if (eligibleReferenceTargets("entity_id", referenceTargets).length === 0) {
        setCastPrerequisiteStep("explanation");
        return;
      }

      setCastPrerequisiteStep(null);
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

  if (castPrerequisiteStep === "checking") {
    return (
      <section className="surface recordBrowser" aria-labelledby="cast-prerequisite-check-title">
        <h2 id="cast-prerequisite-check-title">Checking CAST MEMBER prerequisites</h2>
        <p role="status">Checking for an eligible ENTITY record.</p>
      </section>
    );
  }

  if (castPrerequisiteStep === "explanation") {
    return (
      <section className="surface recordBrowser" aria-labelledby="cast-prerequisite-title">
        <p className="eyebrow">CAST MEMBER prerequisite</p>
        <h2 id="cast-prerequisite-title">ENTITY required before CAST MEMBER</h2>
        <p role="status" className="status statusWarning">
          An ENTITY owns the durable character identity. A CAST MEMBER is a distinct durable dossier that must link
          to an explicitly authored ENTITY; the app will not infer either record from prose or assistance.
        </p>
        <div className="buttonRow">
          <button type="button" onClick={() => setCastPrerequisiteStep("create-entity")}>Create ENTITY</button>
          <button type="button" className="secondaryButton" onClick={() => setCastPrerequisiteStep(null)}>
            Back to records
          </button>
        </div>
      </section>
    );
  }

  if (castPrerequisiteStep === "create-entity") {
    return (
      <section className="surface recordBrowser" aria-labelledby="records-title">
        <button type="button" className="linkButton" onClick={() => setCastPrerequisiteStep("explanation")}>
          Back to prerequisite
        </button>
        <RecordEditor
          recordType="ENTITY"
          headingEyebrow="Create prerequisite ENTITY"
          referenceRecords={referenceTargets}
          onSaved={(savedRecord) => {
            handleSavedRecord(savedRecord);
            setCastPrerequisiteStep(null);
            setCastEditorRecord(null);
          }}
        />
      </section>
    );
  }

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
            <label className="checkboxField">
              <input
                type="checkbox"
                checked={filters.includeArchived}
                onChange={(event) => setFilters((current) => ({ ...current, includeArchived: event.target.checked }))}
              />
              Include archived
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

          {showScopedEmptyState ? (
            <div className="emptyState">
              <p className="status">No {filters.type} records.</p>
              <p className="muted">{recordTypeDescription(filters.type)}</p>
              <button type="button" onClick={() => openCreateForm(filters.type)}>
                Create {filters.type}
              </button>
            </div>
          ) : (
            <div className="recordTableScroll">
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
                        <td key={cell.id} className={classNameForColumn(filters.type, cell.column.id)}>
                          {cell.column.id === "displayLabel" ? (
                          <button
                            type="button"
                            className="linkButton"
                            title={row.original.type === "CAST MEMBER" ? browsePrimaryLabel(row.original) : fullDisplayLabel(row.original)}
                            {...(row.original.type === "CAST MEMBER"
                              ? { "aria-label": `${browsePrimaryLabel(row.original)}${browseSecondaryLabel(row.original) ? ` ${browseSecondaryLabel(row.original)}` : ""}` }
                              : {})}
                            onClick={() => void selectRecord(row.original)}
                          >
                              <span className="recordPrimaryLabel">{browsePrimaryLabel(row.original)}</span>
                              {browseSecondaryLabel(row.original) ? (
                                <span className="recordSecondaryLabel">{browseSecondaryLabel(row.original)}</span>
                              ) : null}
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
          )}
        </div>

        <aside className="detailPane" aria-label="Record detail">
          {selectedRecord ? (
            <>
              <p className="eyebrow">{selectedRecord.type}</p>
              <h3>{detailPrimaryLabel(selectedRecord)}</h3>
              {browseSecondaryLabel(selectedRecord) ? (
                <p className="recordSecondaryLabel">{browseSecondaryLabel(selectedRecord)}</p>
              ) : null}
              {browseUnavailableMessage(selectedRecord) ? (
                <p className="status statusWarning">{browseUnavailableMessage(selectedRecord)}</p>
              ) : null}
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
              {selectedRecord.type === "CAST MEMBER" && "payload" in selectedRecord ? (
                <details className="technicalPayload">
                  <summary>Technical payload</summary>
                  <pre className="payloadPreview">{JSON.stringify(selectedRecord.payload, null, 2)}</pre>
                </details>
              ) : null}
              {selectedRecord.type !== "CAST MEMBER" && "payload" in selectedRecord ? (
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
