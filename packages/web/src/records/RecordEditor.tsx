import {
  deriveDisplayLabel,
  eligibleReferenceTargets,
  getEditorDescriptor,
  recordTypeRegistry,
  type FieldDescriptor
} from "@loom/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
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

export interface RecordEditorProps {
  recordType: string;
  record?: RecordDetail;
  payload?: unknown;
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
    if (field.kind === "list") {
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
      return field.enumValues?.[0] ?? "";
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

function FieldShell({
  field,
  path,
  children,
  form,
  serverIssues
}: {
  field: FieldDescriptor;
  path: string;
  children: React.ReactNode;
  form: UseFormReturn<FormValues>;
  serverIssues: Map<string, string>;
}): React.JSX.Element {
  const clientError = errorMessage(form.formState.errors, path);
  const serverError = serverIssues.get(path);

  return (
    <div className={`editorField ${field.promptFacing ? "promptFacing" : "validationField"}`}>
      <label>
        <span>
          {field.name}
          {field.required ? <strong aria-label="required"> *</strong> : null}
        </span>
        {children}
      </label>
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
  referenceRecords
}: {
  field: FieldDescriptor;
  path: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
}): React.JSX.Element {
  const options = eligibleReferenceTargets(field.referenceRole ?? "", referenceRecords);

  return (
    <select {...form.register(path, inputOptions(field))}>
      <option value="">Select record</option>
      {options.map((record) => (
        <option key={record.id} value={record.id}>
          {record.displayLabel}
        </option>
      ))}
    </select>
  );
}

function ListField({
  field,
  path,
  form,
  referenceRecords,
  serverIssues
}: {
  field: FieldDescriptor;
  path: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
  serverIssues: Map<string, string>;
}): React.JSX.Element {
  const item = field.itemDescriptor;
  const value = form.watch(path) as unknown;
  const items: unknown[] = Array.isArray(value) ? value as unknown[] : [];

  function appendItem(): void {
    form.setValue(path, [...items, fieldDefault(item ?? field)], { shouldDirty: true });
  }

  function removeItem(index: number): void {
    form.setValue(path, items.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true });
  }

  return (
    <div className="listField">
      {items.map((_, index) => (
        <div className="listRow" key={`${path}.${index}`}>
          {item ? (
            <FieldRenderer
              field={{ ...item, name: `${field.name} ${index + 1}`, required: true }}
              path={`${path}.${index}`}
              form={form}
              referenceRecords={referenceRecords}
              serverIssues={serverIssues}
              listItem
            />
          ) : null}
          <button type="button" aria-label={`Remove ${field.name} ${index + 1}`} onClick={() => removeItem(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" aria-label={`Add ${field.name}`} onClick={appendItem}>
        Add {field.name}
      </button>
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
  form,
  referenceRecords,
  serverIssues,
  listItem = false
}: {
  field: FieldDescriptor;
  path: string;
  form: UseFormReturn<FormValues>;
  referenceRecords: readonly RecordSummary[];
  serverIssues: Map<string, string>;
  listItem?: boolean;
}): React.JSX.Element {
  const control = (() => {
    switch (field.kind) {
      case "boolean":
        return <input type="checkbox" {...form.register(path)} />;
      case "enum":
        return (
          <select {...form.register(path, inputOptions(field))}>
            {!field.required ? <option value="">Unset</option> : null}
            {(field.enumValues ?? []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        );
      case "list":
        return (
          <ListField
            field={field}
            path={path}
            form={form}
            referenceRecords={referenceRecords}
            serverIssues={serverIssues}
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
        return <textarea {...registerText(form.register, path, field)} />;
      case "reference":
        return <ReferencePicker field={field} path={path} form={form} referenceRecords={referenceRecords} />;
      case "short_string":
        return <input type="text" {...registerText(form.register, path, field)} />;
    }
  })();

  if (listItem && field.kind === "nested_group") {
    return control;
  }

  return (
    <FieldShell field={field} path={path} form={form} serverIssues={serverIssues}>
      {control}
    </FieldShell>
  );
}

export function RecordEditor({
  recordType,
  record,
  payload,
  referenceRecords = [],
  submitLabel,
  headingEyebrow,
  onSubmitPayload,
  onSaved
}: RecordEditorProps): React.JSX.Element {
  const descriptor = getEditorDescriptor(recordType);
  const definition = recordTypeRegistry[recordType];
  const [serverError, setServerError] = useState<ApiFailure | null>(null);
  const serverIssues = useMemo(() => serverIssuesByPath(serverError), [serverError]);
  const resolver = definition
    ? (zodResolver(z.preprocess((values) => prunePayload(values, descriptor?.fields ?? []), definition.payloadSchema) as never) as Resolver<FormValues>)
    : undefined;
  const formOptions = {
    defaultValues: descriptor ? defaultValues(descriptor.fields, record?.payload ?? payload) : {},
    ...(resolver ? { resolver } : {})
  };
  const form = useForm<FormValues>(formOptions);

  if (!descriptor || !definition) {
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
