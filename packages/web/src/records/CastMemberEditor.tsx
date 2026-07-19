import {
  CAST_MEMBER_DRAFT_PROMPT,
  CAST_MEMBER_DRAFT_PROMPT_VERSION,
  buildCastMemberDraftImportReport,
  castMemberSectionModel,
  deriveDisplayLabel,
  mapCastMemberDraftFields,
  parseCastMemberDraftResponse,
  recordTypeRegistry,
  type CastMemberDraftImportReport,
  type CastMemberDraftMapping
} from "@loom/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

import {
  createRecord,
  updateRecord,
  type ApiFailure
} from "../api.js";
import {
  defaultValues,
  FieldRenderer,
  prunePayload,
  serverIssuesByPath,
  type FormValues,
  type RecordEditorProps
} from "./RecordEditor.js";

type CastMemberEditorProps = Omit<RecordEditorProps, "recordType">;

interface PreparedDraftImport {
  report: CastMemberDraftImportReport;
  previousValues: FormValues;
  mergedValues: FormValues;
  overwrittenFields: readonly string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneFormValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneFormValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneFormValue(item)]));
  }

  return value;
}

function hasAuthoredValue(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (isPlainObject(value)) {
    return Object.values(value).some(hasAuthoredValue);
  }

  return value !== undefined && value !== null;
}

function sameFormValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergePresentValue(
  current: unknown,
  incoming: unknown,
  path: string,
  overwrittenFields: string[]
): unknown {
  if (Array.isArray(incoming)) {
    if (hasAuthoredValue(current) && !sameFormValue(current, incoming)) {
      overwrittenFields.push(path);
    }
    return cloneFormValue(incoming);
  }

  if (isPlainObject(incoming)) {
    const currentObject = isPlainObject(current) ? current : {};
    const merged = cloneFormValue(currentObject) as Record<string, unknown>;

    for (const [key, value] of Object.entries(incoming)) {
      const childPath = path ? `${path}.${key}` : key;
      merged[key] = mergePresentValue(currentObject[key], value, childPath, overwrittenFields);
    }

    return merged;
  }

  if (hasAuthoredValue(current) && !sameFormValue(current, incoming)) {
    overwrittenFields.push(path);
  }

  return incoming;
}

function prepareDraftImport(
  currentValues: FormValues,
  mapping: CastMemberDraftMapping
): PreparedDraftImport {
  const overwrittenFields: string[] = [];
  const mergedValues = mergePresentValue(
    currentValues,
    mapping.values,
    "",
    overwrittenFields
  ) as FormValues;

  if (Object.hasOwn(currentValues, "entity_id")) {
    mergedValues.entity_id = (currentValues as Record<string, unknown>).entity_id;
  } else {
    delete mergedValues.entity_id;
  }

  return {
    report: buildCastMemberDraftImportReport(mapping),
    previousValues: cloneFormValue(currentValues) as FormValues,
    mergedValues,
    overwrittenFields
  };
}

function populatedFieldCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((count, item: unknown) => count + populatedFieldCount(item), 0);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).reduce<number>((count, item: unknown) => count + populatedFieldCount(item), 0);
  }

  return value === undefined || value === "" ? 0 : 1;
}

export function CastMemberEditor({
  record,
  payload,
  referenceRecords = [],
  submitLabel,
  headingEyebrow,
  onSubmitPayload,
  onSaved
}: CastMemberEditorProps): React.JSX.Element {
  const sections = castMemberSectionModel();
  const fields = sections.flatMap((section) => section.fields);
  const definition = recordTypeRegistry["CAST MEMBER"];
  const [serverError, setServerError] = useState<ApiFailure | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PreparedDraftImport | null>(null);
  const [importReport, setImportReport] = useState<CastMemberDraftImportReport | null>(null);
  const [preImportValues, setPreImportValues] = useState<FormValues | null>(null);
  const importTitleId = useId();
  const importDescriptionId = useId();
  const importTextareaId = useId();
  const importReportTitleId = useId();
  const importActiveDescriptionId = useId();
  const overwriteTitleId = useId();
  const pasteSurfaceRef = useRef<HTMLTextAreaElement>(null);
  const confirmOverwriteRef = useRef<HTMLButtonElement>(null);
  const copyAttemptRef = useRef(0);
  const serverIssues = useMemo(() => serverIssuesByPath(serverError), [serverError]);
  const resolver = zodResolver(
    z.preprocess((values) => prunePayload(values, fields), definition!.payloadSchema) as never
  ) as Resolver<FormValues>;
  const form = useForm<FormValues>({
    defaultValues: defaultValues(fields, record?.payload ?? payload),
    resolver
  });
  const watchedPayload = form.watch();
  const showLongDossierWarning = populatedFieldCount(record?.payload ?? watchedPayload) >= 24;

  useEffect(() => {
    if (importOpen && !pendingImport) {
      pasteSurfaceRef.current?.focus();
    }
  }, [importOpen, pendingImport]);

  useEffect(() => {
    if (pendingImport) {
      confirmOverwriteRef.current?.focus();
    }
  }, [pendingImport]);

  if (!definition) {
    return (
      <p role="alert" className="status statusError">
        Unsupported record type.
      </p>
    );
  }

  async function onSubmit(values: FormValues): Promise<void> {
    setServerError(null);
    if (onSubmitPayload) {
      const response = await onSubmitPayload(values);

      if (!response.ok) {
        setServerError(response);
        return;
      }

      clearDraftImportSession();
      return;
    }

    const response = record
      ? await updateRecord(record.id, { displayLabel: deriveDisplayLabel("CAST MEMBER", values), payload: values })
      : await createRecord({ type: "CAST MEMBER", displayLabel: deriveDisplayLabel("CAST MEMBER", values), payload: values });

    if (!response.ok) {
      setServerError(response);
      return;
    }

    clearDraftImportSession();
    onSaved?.(response.record);
  }

  async function copyDraftPrompt(): Promise<void> {
    const attempt = copyAttemptRef.current + 1;
    copyAttemptRef.current = attempt;
    setCopyStatus("idle");

    try {
      await navigator.clipboard.writeText(CAST_MEMBER_DRAFT_PROMPT);
      if (copyAttemptRef.current === attempt) {
        setCopyStatus("copied");
      }
    } catch {
      if (copyAttemptRef.current === attempt) {
        setCopyStatus("failed");
      }
    }
  }

  function openDraftImport(): void {
    if (importReport) {
      return;
    }

    setImportText("");
    setImportError(null);
    setPendingImport(null);
    setImportOpen(true);
  }

  function cancelDraftImport(): void {
    setImportOpen(false);
    setImportText("");
    setImportError(null);
    setPendingImport(null);
  }

  function applyDraftImport(prepared: PreparedDraftImport): void {
    form.reset(prepared.mergedValues);
    form.clearErrors();
    setServerError(null);
    setPreImportValues(prepared.previousValues);
    setImportReport(prepared.report);
    setImportOpen(false);
    setImportText("");
    setImportError(null);
    setPendingImport(null);
  }

  function reviewDraftImport(): void {
    setImportError(null);
    setPendingImport(null);

    const parsed = parseCastMemberDraftResponse(importText);
    if (!parsed.ok) {
      setImportError(parsed.message);
      return;
    }

    const mapping = mapCastMemberDraftFields(parsed.value);
    if (mapping.filledFields.length === 0) {
      setImportError("No valid Cast Member fields were found. Correct the response and retry.");
      return;
    }

    const prepared = prepareDraftImport(form.getValues(), mapping);
    if (prepared.overwrittenFields.length > 0) {
      setPendingImport(prepared);
      return;
    }

    applyDraftImport(prepared);
  }

  function discardDraftImport(): void {
    if (preImportValues) {
      form.reset(preImportValues);
      form.clearErrors();
    }

    clearDraftImportSession();
  }

  function clearDraftImportSession(): void {
    setPreImportValues(null);
    setImportReport(null);
    setImportText("");
    setImportError(null);
    setPendingImport(null);
    setImportOpen(false);
  }

  return (
    <form className="recordEditor castMemberEditor" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <div className="projectHeader">
        <p className="eyebrow">{headingEyebrow ?? (record ? "Edit cast dossier" : "Create cast dossier")}</p>
        <h2>CAST MEMBER</h2>
      </div>

      <div className="castEditorNotice" aria-label="Durable dossier boundary">
        <p>
          Identity and voice-anchor sections are the persistent cast dossier. Current voice pressure and temporary
          cast voice overrides belong in the generation-time brief and are not written back here.
        </p>
      </div>

      <section className="castDraftTools" aria-labelledby="cast-draft-tools-title">
        <div>
          <p className="eyebrow">Optional external drafting</p>
          <h3 id="cast-draft-tools-title">Cast Member draft prompt</h3>
          <p>
            Copy static template v{CAST_MEMBER_DRAFT_PROMPT_VERSION}, then use it with your dossier in an external
            LLM. The template contains no project data and is neither canon nor story prose.
          </p>
        </div>
        <div className="castDraftActions">
          <button type="button" onClick={() => void copyDraftPrompt()}>
            Copy Cast Member draft prompt
          </button>
          <button
            type="button"
            onClick={openDraftImport}
            disabled={importReport !== null}
            aria-describedby={importReport ? importActiveDescriptionId : undefined}
          >
            Import Cast Member draft
          </button>
        </div>
        {importReport ? (
          <p id={importActiveDescriptionId} className="muted">
            Create or save the record, or discard the current imported draft, before importing another response.
          </p>
        ) : null}
        {copyStatus === "copied" ? (
          <p className="status statusSuccess" role="status">
            Draft prompt copied. Paste it with your dossier into the external LLM you choose.
          </p>
        ) : null}
        {copyStatus === "failed" ? (
          <p className="status statusError" role="alert">
            Could not copy the Cast Member draft prompt to the clipboard. Retry Copy.
          </p>
        ) : null}
      </section>

      {importReport ? (
        <section
          className="castImportReport"
          aria-labelledby={importReportTitleId}
        >
          <div className="castImportReportHeader">
            <div>
              <p className="eyebrow">Local import review</p>
              <h3 id={importReportTitleId}>Cast Member draft import report</h3>
            </div>
            <button type="button" onClick={discardDraftImport}>
              Discard imported draft
            </button>
          </div>
          <p className="status statusWarning">
            This is an unsaved draft, not a record and not canon. Nothing is written until you choose explicit Save.
          </p>
          <div className="castImportReportBands">
            <section>
              <h4>Filled fields</h4>
              <p>These fields came from the pasted external response.</p>
              {importReport.filledFields.length > 0 ? (
                <ul>
                  {importReport.filledFields.map((path) => <li key={path}>{path}</li>)}
                </ul>
              ) : <p>None.</p>}
            </section>
            <section>
              <h4>Skipped fields</h4>
              <p>Skipped values were not added to the form.</p>
              {importReport.skippedFields.length > 0 ? (
                <ul>
                  {importReport.skippedFields.map((field, index) => (
                    <li key={`${field.path}-${index}`}>
                      {`${field.path} — ${field.reason}: ${field.message}`}
                    </li>
                  ))}
                </ul>
              ) : <p>None.</p>}
            </section>
            <section>
              <h4>Needs your attention</h4>
              <ul>
                <li>{`entity_id — ${importReport.needsAuthor.entityId}`}</li>
                {importReport.needsAuthor.uncertainties.map((uncertainty, index) => (
                  <li key={`uncertainty-${index}`}>
                    {`Uncertainty — ${uncertainty} Review material only, never prose.`}
                  </li>
                ))}
                {importReport.needsAuthor.inventedFields.map((path, index) => (
                  <li key={`invented-${path}-${index}`}>
                    {`${path} — declared invented field; review material only, never prose.`}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      ) : null}

      {showLongDossierWarning ? (
        <p className="status statusWarning" role="status">
          For active/onstage cast, long dossiers should stay durable and full; use stronger current pins in the
          generation-time brief instead of automatic compression.
        </p>
      ) : null}

      {serverError && serverIssues.size === 0 ? (
        <p role="alert" className="status statusError">
          {serverError.message}
        </p>
      ) : null}

      <div className="castEditorLayout">
        <nav className="castSectionNav" aria-label="CAST MEMBER sections">
          {sections.map((section) => (
            <a key={section.id} href={`#cast-section-${section.id}`}>
              <span>{section.label}</span>
              <small>{section.tier === "required_core" ? "Required core" : section.tier === "optional_extended" ? "Optional" : "Cue"}</small>
            </a>
          ))}
        </nav>

        <div className="castSectionStack">
          {sections.map((section) => (
            <section
              className={`castSection ${section.tier}`}
              id={`cast-section-${section.id}`}
              key={section.id}
              aria-labelledby={`cast-section-title-${section.id}`}
            >
              <div className="castSectionHeader">
                <div>
                  <p className="eyebrow">
                    {section.tier === "required_core" ? "Required core" : section.tier === "optional_extended" ? "Optional extended" : "Navigation cue"}
                  </p>
                  <h3 id={`cast-section-title-${section.id}`}>{section.label}</h3>
                </div>
              </div>
              {section.id === "durable_voice_anchor" || section.id === "identity" ? (
                <p className="muted">
                  Persistent dossier material. Current-generation pressure and temporary overrides are edited in the
                  generation-time brief.
                </p>
              ) : null}
              <div className="editorGrid">
                {section.fields.map((field) => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    path={field.name}
                    ownerKind="CAST MEMBER"
                    form={form}
                    referenceRecords={referenceRecords}
                    serverIssues={serverIssues}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <button type="submit">{submitLabel ?? (record ? "Save Record" : "Create Record")}</button>

      {importOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={importTitleId}
          aria-describedby={importDescriptionId}
          className="castImportDialog"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !pendingImport) {
              cancelDraftImport();
            }
          }}
        >
          <div className="castImportDialogPanel">
            <h3 id={importTitleId}>Import Cast Member draft</h3>
            <p id={importDescriptionId}>
              Paste the JSON response from your external LLM. It is parsed locally and nothing is saved until you
              review the draft and choose Save.
            </p>
            <label htmlFor={importTextareaId}>External LLM response</label>
            <textarea
              id={importTextareaId}
              ref={pasteSurfaceRef}
              rows={16}
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              spellCheck="false"
            />
            {importError ? (
              <p role="alert" className="status statusError">
                {importError}
              </p>
            ) : null}
            <div className="castDraftActions">
              <button type="button" onClick={cancelDraftImport}>
                Cancel import
              </button>
              <button type="button" onClick={reviewDraftImport}>
                Review import
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingImport ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={overwriteTitleId}
          aria-describedby={`${overwriteTitleId}-description`}
          className="castImportDialog castImportOverwriteDialog"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setPendingImport(null);
            }
          }}
        >
          <div className="castImportDialogPanel">
            <h3 id={overwriteTitleId}>Confirm draft import overwrites</h3>
            <p id={`${overwriteTitleId}-description`}>
              Importing would replace these non-empty fields. Nothing has been overwritten yet.
            </p>
            <ul>
              {pendingImport.overwrittenFields.map((path) => <li key={path}>{path}</li>)}
            </ul>
            <div className="castDraftActions">
              <button type="button" onClick={() => setPendingImport(null)}>
                Cancel overwrite
              </button>
              <button
                ref={confirmOverwriteRef}
                type="button"
                onClick={() => applyDraftImport(pendingImport)}
              >
                Import and overwrite listed fields
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
