import {
  deriveDisplayLabel,
  eligibleReferenceTargets,
  getEditorDescriptor,
  getEditorFormSchema,
  normalizeListIndices,
  type FieldDescriptor,
  type RecordEditorDescriptor
} from "@loom/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useMemo, useState } from "react";
import {
  useForm,
  type FieldErrors,
  type FieldValues,
  type Resolver,
  type UseFormRegister,
  type UseFormReturn
} from "react-hook-form";
import { z } from "zod";

import {
  createRecord,
  updateRecord,
  type ApiFailure,
  type RecordDetail,
  type RecordSummary
} from "../api.js";
import { EnumGuidance } from "../field-help/EnumGuidance.js";
import { FieldHelp } from "../field-help/FieldHelp.js";

export interface RecordEditorProps {
  recordType: string;
  record?: RecordDetail;
  payload?: unknown;
  descriptor?: RecordEditorDescriptor;
  payloadSchema?: z.ZodType;
  referenceRecords?: readonly RecordSummary[];
  submitLabel?: string;
  headingEyebrow?: string;
  onSubmitPayload?: (payload: FormValues) => Promise<{ ok: true } | ApiFailure>;
  onSaved?: (record: RecordDetail) => void;
}

export type FormValues = FieldValues;

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

export function fieldDefault(field: FieldDescriptor): unknown {
  if (!field.required) {
    if (field.kind === "list" || field.kind === "sentinel_prose_list") {
      return [];
    }

    if (field.kind === "nested_group") {
      return Object.fromEntries((field.fields ?? []).map((child) => [child.name, fieldDefault(child)]));
    }

    return undefined;
  }

  switch (field.kind) {
    case "boolean":
      return false;
    case "enum":
    case "sentinel_reference":
    case "sentinel_reference_list":
    case "sentinel_short_string":
    case "sentinel_prose":
      return field.enumValues?.[0] ?? "";
    case "sentinel_prose_list":
      return [];
    case "list":
      return [];
    case "nested_group":
      return Object.fromEntries((field.fields ?? []).map((child) => [child.name, fieldDefault(child)]));
    case "number":
      return 0;
    default:
      return "";
  }
}

export function defaultValues(fields: readonly FieldDescriptor[], payload: unknown): FormValues {
  return Object.fromEntries(
    fields.map((field) => [field.name, valueAtPath(payload, field.name) ?? fieldDefault(field)])
  );
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === "";
}

function pruneFieldValue(field: FieldDescriptor, value: unknown): unknown {
  if (field.kind === "list") {
    const items: unknown[] = Array.isArray(value) ? value as unknown[] : [];
    return items.length > 0
      ? items
          .map((item: unknown) => (field.itemDescriptor ? pruneFieldValue(field.itemDescriptor, item) : item))
          .filter((item) => !isBlank(item))
      : [];
  }

  if (field.kind === "sentinel_reference_list" || field.kind === "sentinel_prose_list") {
    if (Array.isArray(value)) {
      return value.filter((item) => !isBlank(item));
    }

    return value;
  }

  if (field.kind === "nested_group") {
    const source = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
    const pruned = Object.fromEntries(
      (field.fields ?? [])
        .map((child) => [child.name, pruneFieldValue(child, source[child.name])] as const)
        .filter(([, childValue]) => !isBlank(childValue))
    );

    if (!field.required && Object.keys(pruned).length === 0) {
      return undefined;
    }

    return pruned;
  }

  if (!field.required && value === "") {
    return undefined;
  }

  return value;
}

export function prunePayload(values: unknown, fields: readonly FieldDescriptor[]): FormValues {
  const source = typeof values === "object" && values !== null ? values as Record<string, unknown> : {};

  return Object.fromEntries(
    fields
      .map((field) => [field.name, pruneFieldValue(field, source[field.name])] as const)
      .filter(([, value]) => !isBlank(value))
  );
}

function issueKey(path: unknown): string {
  return Array.isArray(path) ? path.join(".") : "";
}

function issueText(issue: unknown): string {
  if (typeof issue === "object" && issue !== null && "message" in issue) {
    return String(issue.message);
  }

  return "Invalid value.";
}

export function serverIssuesByPath(failure: ApiFailure | null): Map<string, string> {
  const issues = failure?.issues ?? [];
  return new Map(
    issues.map((issue) => {
      const path = typeof issue === "object" && issue !== null && "path" in issue
        ? issue.path
        : [];
      return [issueKey(path), issueText(issue)];
    })
  );
}

function errorMessage(errors: FieldErrors<FormValues>, path: string): string | undefined {
  const error = valueAtPath(errors, path);

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return undefined;
}

function inputOptions(field: FieldDescriptor) {
  return {
    setValueAs: (value: unknown) => {
      if (field.kind === "number") {
        return value === "" || value === undefined ? undefined : Number(value);
      }

      if (!field.required && value === "") {
        return undefined;
      }

      return value;
    }
  };
}

type ReferenceOptionRecord = {
  id: string;
  displayLabel: string;
  archived?: boolean;
};

function unresolvedReferenceOption(
  value: unknown,
  options: readonly ReferenceOptionRecord[],
  referenceRecords: readonly ReferenceOptionRecord[],
  sentinelValues: readonly string[] = []
): { value: string; label: string } | null {
  if (typeof value !== "string" || value === "") {
    return null;
  }

  const knownValues = new Set([...sentinelValues, ...options.map((record) => record.id)]);
  if (knownValues.has(value)) {
    return null;
  }

  const knownRecord = referenceRecords.find((record) => record.id === value);
  if (knownRecord) {
    return {
      value,
      label: `${knownRecord.displayLabel} (${knownRecord.archived ? "unresolved/archived" : "unresolved"})`
    };
  }

  return { value, label: `${value} (unresolved/missing)` };
}

function FieldShell({
  field,
  path,
  ownerKind,
  children,
  form,
  serverIssues,
  describedById
}: {
  field: FieldDescriptor;
  path: string;
  ownerKind: string;
  children: React.ReactNode;
  form: UseFormReturn<FormValues>;
  serverIssues: Map<string, string>;
  describedById?: string | undefined;
}): React.JSX.Element {
  const clientError = errorMessage(form.formState.errors, path);
  const serverError = serverIssues.get(path);
  const canonicalPath = `${ownerKind}.${normalizeListIndices(path)}`;
  const primaryLabel = field.label ?? field.name;
  const labelContent = (
    <span>
      {primaryLabel}
      {field.required ? <strong aria-label="required"> *</strong> : null}
    </span>
  );

  return (
    <div className={`editorField ${field.promptFacing ? "promptFacing" : "validationField"}`}>
      {field.kind === "list" ? (
        <div className="fieldCollection">
          {labelContent}
          {children}
        </div>
      ) : (
        <label>
          {labelContent}
          {children}
        </label>
      )}
      {field.label ? (
        <span className="fieldSchemaKey" id={describedById}>{field.name}</span>
      ) : null}
      <FieldHelp fieldPath={canonicalPath} fieldLabel={primaryLabel} listContext={path} />
      {clientError || serverError ? (
        <p className="fieldError" role="alert">
          {clientError ?? serverError}
        </p>
      ) : null}
    </div>
  );
}

function ReferencePicker({
  field,
  path,
  form,
  referenceRecords,
  describedById
}: {
  field: FieldDescriptor;
  path: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
  describedById?: string | undefined;
}): React.JSX.Element {
  const options = eligibleReferenceTargets(field.referenceRole ?? "", referenceRecords);
  const fallbackOption = unresolvedReferenceOption(form.watch(path), options, referenceRecords);

  return (
    <select {...form.register(path, inputOptions(field))} aria-describedby={describedById}>
      <option value="">Select record</option>
      {fallbackOption ? (
        <option value={fallbackOption.value}>{fallbackOption.label}</option>
      ) : null}
      {options.map((record) => (
        <option key={record.id} value={record.id}>
          {record.displayLabel}
        </option>
      ))}
    </select>
  );
}

function SentinelReferencePicker({
  field,
  path,
  form,
  referenceRecords
}: {
  field: FieldDescriptor;
  path: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
}): React.JSX.Element {
  const options = eligibleReferenceTargets(field.referenceRole ?? "", referenceRecords);
  const enumValues = field.enumValues ?? [];
  const fallbackOption = unresolvedReferenceOption(form.watch(path), options, referenceRecords, enumValues);

  return (
    <select {...form.register(path, inputOptions(field))}>
      {!field.required ? <option value="">Select record</option> : null}
      {fallbackOption ? (
        <option value={fallbackOption.value}>{fallbackOption.label}</option>
      ) : null}
      {enumValues.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
      {options.map((record) => (
        <option key={record.id} value={record.id}>
          {record.displayLabel}
        </option>
      ))}
    </select>
  );
}

/**
 * Truthful accessible note that distinguishes a list's structural requiredness from its item-count
 * requirement (#114 / F003). A required list whose schema declares no array-level minimum lawfully
 * accepts an empty array, so its `*` marker means the property is structurally present, not that an
 * item must be added. Optional zero-minimum lists state the same lawful item-count outcome without
 * implying structural requiredness. A list with a registered nonzero minimum states that actual
 * minimum instead.
 */
export function listRequirednessNote(field: FieldDescriptor): string | null {
  if (field.kind !== "list") {
    return null;
  }

  const minItems = field.minItems ?? 0;
  if (minItems >= 1) {
    return minItems === 1
      ? "This list requires at least one item."
      : `This list requires at least ${minItems} items.`;
  }

  if (field.required) {
    return "This list is required as a property, but it may be left empty.";
  }

  return "This list may be left empty.";
}

function ListField({
  field,
  path,
  ownerKind,
  form,
  referenceRecords,
  serverIssues,
  label,
  describedById
}: {
  field: FieldDescriptor;
  path: string;
  ownerKind: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
  serverIssues: Map<string, string>;
  label?: string | undefined;
  describedById?: string | undefined;
}): React.JSX.Element {
  const item = field.itemDescriptor;
  const value = form.watch(path) as unknown;
  const items: unknown[] = Array.isArray(value) ? value as unknown[] : [];
  const displayName = label ?? field.name;
  const requirednessNote = listRequirednessNote(field);
  const noteId = useId();
  const describedByIds = [describedById, requirednessNote ? noteId : undefined].filter(Boolean).join(" ");
  const groupProps = {
    role: "group" as const,
    "aria-label": displayName,
    ...(describedByIds ? { "aria-describedby": describedByIds } : {})
  };

  function appendItem(): void {
    form.setValue(path, [...items, fieldDefault(item ?? field)], { shouldDirty: true });
  }

  function removeItem(index: number): void {
    form.setValue(path, items.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true });
  }

  return (
    <div className="listField" {...groupProps}>
      {requirednessNote ? (
        <p className="listRequiredness" id={noteId}>{requirednessNote}</p>
      ) : null}
      {items.map((_, index) => (
        <div className="listRow" key={`${path}.${index}`}>
          {item ? (
            <FieldRenderer
              field={{ ...item, name: `${displayName} ${index + 1}`, required: true }}
              path={`${path}.${index}`}
              ownerKind={ownerKind}
              form={form}
              referenceRecords={referenceRecords}
              serverIssues={serverIssues}
              listItem
            />
          ) : null}
          <button type="button" aria-label={`Remove ${displayName} ${index + 1}`} onClick={() => removeItem(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" aria-label={`Add ${displayName}`} onClick={appendItem}>
        Add {displayName}
      </button>
    </div>
  );
}

function SentinelReferenceListField({
  field,
  path,
  ownerKind,
  form,
  referenceRecords,
  serverIssues
}: {
  field: FieldDescriptor;
  path: string;
  ownerKind: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
  serverIssues: Map<string, string>;
}): React.JSX.Element {
  const value = form.watch(path) as unknown;
  const mode = Array.isArray(value) ? "specific_entities" : typeof value === "string" ? value : field.enumValues?.[0] ?? "";
  const referenceRole = field.referenceRole ?? "";
  const listField: FieldDescriptor = {
    ...field,
    kind: "list",
    itemDescriptor: {
      ...field,
      name: field.name,
      kind: "reference",
      required: true,
      referenceRole
    }
  };

  function updateMode(nextMode: string): void {
    form.setValue(path, nextMode === "specific_entities" ? [] : nextMode, {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  return (
    <div className="sentinelReferenceListField">
      <select aria-label={`${field.name} mode`} value={mode} onChange={(event) => updateMode(event.target.value)}>
        {(field.enumValues ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="specific_entities">specific_entities</option>
      </select>
      {mode === "specific_entities" ? (
        <ListField
          field={listField}
          path={path}
          ownerKind={ownerKind}
          form={form}
          referenceRecords={referenceRecords}
          serverIssues={serverIssues}
        />
      ) : null}
    </div>
  );
}

function SentinelProseListField({
  field,
  path,
  ownerKind,
  form,
  referenceRecords,
  serverIssues
}: {
  field: FieldDescriptor;
  path: string;
  ownerKind: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
  serverIssues: Map<string, string>;
}): React.JSX.Element {
  const value = form.watch(path) as unknown;
  const listMode = "specific_reveals";
  const mode = Array.isArray(value) ? listMode : typeof value === "string" ? value : listMode;
  const listField: FieldDescriptor = {
    ...field,
    kind: "list",
    ...(field.itemDescriptor ? { itemDescriptor: field.itemDescriptor } : {})
  };

  function updateMode(nextMode: string): void {
    form.setValue(path, nextMode === listMode ? [] : nextMode, {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  return (
    <div className="sentinelProseListField">
      <select aria-label={`${field.name} mode`} value={mode} onChange={(event) => updateMode(event.target.value)}>
        {(field.enumValues ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={listMode}>{listMode}</option>
      </select>
      {mode === listMode ? (
        <ListField
          field={listField}
          path={path}
          ownerKind={ownerKind}
          form={form}
          referenceRecords={referenceRecords}
          serverIssues={serverIssues}
        />
      ) : null}
    </div>
  );
}

function SentinelProseField({
  field,
  path,
  form,
  multiline
}: {
  field: FieldDescriptor;
  path: string;
  form: UseFormReturn<FormValues>;
  multiline: boolean;
}): React.JSX.Element {
  const proseMode = "specific_prose";
  const value = form.watch(path) as unknown;
  const enumValues = field.enumValues ?? [];
  const mode = typeof value === "string" && enumValues.includes(value) ? value : proseMode;

  function updateMode(nextMode: string): void {
    form.setValue(path, nextMode === proseMode ? "" : nextMode, {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  return (
    <div className="sentinelProseField">
      <select aria-label={`${field.name} mode`} value={mode} onChange={(event) => updateMode(event.target.value)}>
        {enumValues.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={proseMode}>{proseMode}</option>
      </select>
      {mode === proseMode
        ? multiline
          ? <textarea aria-label={field.name} {...registerText(form.register, path, field)} />
          : <input type="text" aria-label={field.name} {...registerText(form.register, path, field)} />
        : null}
    </div>
  );
}

function registerText(
  register: UseFormRegister<FormValues>,
  path: string,
  field: FieldDescriptor
) {
  return register(path, inputOptions(field));
}

export function FieldRenderer({
  field,
  path,
  ownerKind,
  form,
  referenceRecords,
  serverIssues,
  listItem = false
}: {
  field: FieldDescriptor;
  path: string;
  ownerKind: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
  serverIssues: Map<string, string>;
  listItem?: boolean;
}): React.JSX.Element {
  const generatedDescriptionId = useId();
  const describedById = field.label ? generatedDescriptionId : undefined;
  const control = (() => {
    switch (field.kind) {
      case "boolean":
        return <input type="checkbox" {...form.register(path)} />;
      case "enum":
        return (
          <EnumGuidance
            fieldPath={`${ownerKind}.${normalizeListIndices(path)}`}
            enumValues={field.enumValues ?? []}
            value={String(form.watch(path) ?? "")}
            onChange={(value) => form.setValue(path, value, { shouldDirty: true, shouldValidate: true })}
            allowUnset={!field.required}
            label={field.label}
            describedById={describedById}
          />
        );
      case "list":
        return (
          <ListField
            field={field}
            path={path}
            ownerKind={ownerKind}
            form={form}
            referenceRecords={referenceRecords}
            serverIssues={serverIssues}
            label={field.label}
            describedById={describedById}
          />
        );
      case "nested_group":
        return (
          <fieldset className="nestedGroup">
            <legend>{field.name}</legend>
            {(field.fields ?? []).map((child) => (
              <FieldRenderer
                key={child.name}
                field={child}
                path={`${path}.${child.name}`}
                ownerKind={ownerKind}
                form={form}
                referenceRecords={referenceRecords}
                serverIssues={serverIssues}
              />
            ))}
          </fieldset>
        );
      case "number":
        return <input type="number" {...form.register(path, inputOptions(field))} />;
      case "prose":
        return <textarea {...registerText(form.register, path, field)} aria-describedby={describedById} />;
      case "reference":
        return <ReferencePicker field={field} path={path} form={form} referenceRecords={referenceRecords} describedById={describedById} />;
      case "sentinel_reference":
        return (
          <SentinelReferencePicker
            field={field}
            path={path}
            form={form}
            referenceRecords={referenceRecords}
          />
        );
      case "sentinel_reference_list":
        return (
          <SentinelReferenceListField
            field={field}
            path={path}
            ownerKind={ownerKind}
            form={form}
            referenceRecords={referenceRecords}
            serverIssues={serverIssues}
          />
        );
      case "sentinel_prose_list":
        return (
          <SentinelProseListField
            field={field}
            path={path}
            ownerKind={ownerKind}
            form={form}
            referenceRecords={referenceRecords}
            serverIssues={serverIssues}
          />
        );
      case "sentinel_short_string":
        return <SentinelProseField field={field} path={path} form={form} multiline={false} />;
      case "sentinel_prose":
        return <SentinelProseField field={field} path={path} form={form} multiline />;
      case "short_string":
        return <input type="text" {...registerText(form.register, path, field)} aria-describedby={describedById} />;
    }
  })();

  if (listItem && field.kind === "nested_group") {
    return control;
  }

  return (
    <FieldShell field={field} path={path} ownerKind={ownerKind} form={form} serverIssues={serverIssues} describedById={describedById}>
      {control}
    </FieldShell>
  );
}

export function RecordEditor({
  recordType,
  record,
  payload,
  descriptor: providedDescriptor,
  payloadSchema,
  referenceRecords = [],
  submitLabel,
  headingEyebrow,
  onSubmitPayload,
  onSaved
}: RecordEditorProps): React.JSX.Element {
  const descriptor = providedDescriptor ?? getEditorDescriptor(recordType);
  const schema = payloadSchema ?? getEditorFormSchema(recordType);
  const [serverError, setServerError] = useState<ApiFailure | null>(null);
  const serverIssues = useMemo(() => serverIssuesByPath(serverError), [serverError]);
  const resolver = schema
    ? (zodResolver(z.preprocess((values) => prunePayload(values, descriptor?.fields ?? []), schema) as never) as Resolver<FormValues>)
    : undefined;
  const formOptions = {
    defaultValues: descriptor ? defaultValues(descriptor.fields, record?.payload ?? payload) : {},
    ...(resolver ? { resolver } : {})
  };
  const form = useForm<FormValues>(formOptions);

  if (!descriptor || !schema) {
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
      }
      return;
    }

    const response = record
      ? await updateRecord(record.id, { displayLabel: deriveDisplayLabel(recordType, values), payload: values })
      : await createRecord({ type: recordType, displayLabel: deriveDisplayLabel(recordType, values), payload: values });

    if (!response.ok) {
      setServerError(response);
      return;
    }

    onSaved?.(response.record);
  }

  return (
    <form className="recordEditor" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <div className="projectHeader">
        <p className="eyebrow">{headingEyebrow ?? (record ? "Edit record" : "Create record")}</p>
        <h2>{recordType}</h2>
      </div>

      {serverError && serverIssues.size === 0 ? (
        <p role="alert" className="status statusError">
          {serverError.message}
        </p>
      ) : null}

      <div className="editorGrid">
        {descriptor.fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            path={field.name}
            ownerKind={recordType}
            form={form}
            referenceRecords={referenceRecords}
            serverIssues={serverIssues}
          />
        ))}
      </div>

      <button type="submit">{submitLabel ?? (record ? "Save Record" : "Create Record")}</button>
    </form>
  );
}
