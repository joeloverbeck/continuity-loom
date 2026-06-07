import {
  castMemberSectionModel,
  deriveDisplayLabel,
  recordTypeRegistry
} from "@loom/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
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
      }
      return;
    }

    const response = record
      ? await updateRecord(record.id, { displayLabel: deriveDisplayLabel("CAST MEMBER", values), payload: values })
      : await createRecord({ type: "CAST MEMBER", displayLabel: deriveDisplayLabel("CAST MEMBER", values), payload: values });

    if (!response.ok) {
      setServerError(response);
      return;
    }

    onSaved?.(response.record);
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
    </form>
  );
}
