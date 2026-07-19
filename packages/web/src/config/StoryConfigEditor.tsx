import {
  proseModeSchema,
  storyContractSchema,
  universalContentPolicySchema,
  type FieldDescriptor,
  type RecordEditorDescriptor
} from "@loom/core";
import { useEffect, useState } from "react";
import type { z } from "zod";

import { listRecords, listStoryConfig, setStoryConfig, type RecordSummary, type StoryConfigKind } from "../api.js";
import { RecordEditor } from "../records/RecordEditor.js";

const storyConfigKinds: StoryConfigKind[] = [
  "STORY CONTRACT",
  "UNIVERSAL CONTENT POLICY",
  "PROSE MODE"
];

function field(
  name: string,
  kind: FieldDescriptor["kind"],
  options: Partial<Omit<FieldDescriptor, "name" | "kind">> = {}
): FieldDescriptor {
  return {
    name,
    kind,
    required: options.required ?? true,
    promptFacing: options.promptFacing ?? true,
    ...(options.label ? { label: options.label } : {}),
    ...(options.enumValues ? { enumValues: options.enumValues } : {}),
    ...(options.referenceRole ? { referenceRole: options.referenceRole } : {}),
    ...(options.itemDescriptor ? { itemDescriptor: options.itemDescriptor } : {}),
    ...(options.fields ? { fields: options.fields } : {})
  };
}

function descriptor(recordType: StoryConfigKind, fields: readonly FieldDescriptor[]): RecordEditorDescriptor {
  return { recordType, fields };
}

const storyConfigEditorDescriptors: Record<StoryConfigKind, RecordEditorDescriptor> = {
  "STORY CONTRACT": descriptor(
    "STORY CONTRACT",
    [
      field("title", "short_string", { label: "Story title" }),
      field("premise", "prose", { label: "Premise" }),
      field("genre_mode", "short_string", { label: "Genre / mode" }),
      field("tone", "short_string", { label: "Tone" }),
      field("setting_baseline", "prose", { label: "Setting baseline" }),
      field("content_intensity", "enum", { label: "Content intensity", enumValues: ["general", "mature", "explicit", "graphic", "variable"] }),
      field("explicitness", "prose", { label: "Explicitness" }),
      field("language_register", "short_string", { label: "Language register" })
    ]
  ),
  "UNIVERSAL CONTENT POLICY": descriptor(
    "UNIVERSAL CONTENT POLICY",
    [
      field("rating_label", "short_string", { label: "Rating label" }),
      field("allowed_content_scope", "prose", { label: "Allowed content scope" }),
      field("tonal_handling", "prose", { label: "Tonal handling" }),
      field("character_bias_handling", "prose", { label: "Character bias handling" })
    ]
  ),
  "PROSE MODE": descriptor(
    "PROSE MODE",
    [
      field("pov_character", "reference", { label: "POV character", referenceRole: "pov_character" }),
      field("person", "enum", { label: "Person", enumValues: ["first", "second", "third", "omniscient"] }),
      field("tense", "enum", { label: "Tense", enumValues: ["past", "present", "future", "variable"] }),
      field("psychic_distance", "enum", { label: "Psychic distance", enumValues: ["close", "medium", "distant", "variable"] }),
      field("interiority_mode", "enum", { label: "Interiority mode", enumValues: ["minimal", "filtered", "free_indirect", "direct", "variable"] }),
      field("dialogue_density", "enum", { label: "Dialogue density", enumValues: ["sparse", "balanced", "moment_led", "dense"] }),
      field("paragraphing", "enum", { label: "Paragraphing", enumValues: ["spare", "mixed", "lush", "variable"] }),
      field("language_output", "short_string", { label: "Output language" }),
      field("special_style_constraints", "list", {
        label: "Special style constraints",
        required: false,
        itemDescriptor: field("special_style_constraints item", "short_string")
      })
    ]
  )
};

const storyConfigSchemas: Record<StoryConfigKind, z.ZodType> = {
  "STORY CONTRACT": storyContractSchema,
  "UNIVERSAL CONTENT POLICY": universalContentPolicySchema,
  "PROSE MODE": proseModeSchema
};

type LoadedConfig =
  | { status: "loading" }
  | { status: "ready"; payload: unknown }
  | { status: "missing" }
  | { status: "error"; message: string };

function ConfigPanel({
  kind,
  state,
  referenceRecords,
  onSaved
}: {
  kind: StoryConfigKind;
  state: LoadedConfig;
  referenceRecords: readonly RecordSummary[];
  onSaved: (kind: StoryConfigKind, payload: unknown) => void;
}): React.JSX.Element {
  const [saved, setSaved] = useState(false);

  const payload = state.status === "ready" ? state.payload : undefined;

  return (
    <section className="configPanel" aria-labelledby={`${kind.replace(/\W+/g, "-").toLowerCase()}-title`}>
      {state.status === "loading" ? <p className="muted">Loading {kind}...</p> : null}
      {state.status === "error" ? (
        <p role="alert" className="status statusError">
          {state.message}
        </p>
      ) : null}
      {state.status === "missing" ? <p className="muted">No saved {kind} yet.</p> : null}
      {state.status !== "loading" && state.status !== "error" ? (
        <>
          {saved ? (
            <p role="status" className="status statusSuccess">
              {kind} saved.
            </p>
          ) : null}
          <RecordEditor
            recordType={kind}
            payload={payload}
            descriptor={storyConfigEditorDescriptors[kind]}
            payloadSchema={storyConfigSchemas[kind]}
            referenceRecords={referenceRecords}
            headingEyebrow="Story configuration"
            submitLabel={`Save ${kind}`}
            onSubmitPayload={async (nextPayload) => {
              setSaved(false);
              const response = await setStoryConfig(kind, nextPayload);
              if (!response.ok) {
                return response;
              }
              onSaved(kind, nextPayload);
              setSaved(true);
              return { ok: true };
            }}
          />
        </>
      ) : null}
    </section>
  );
}

export function StoryConfigEditor(): React.JSX.Element {
  const [referenceRecords, setReferenceRecords] = useState<RecordSummary[]>([]);
  const [configs, setConfigs] = useState<Record<StoryConfigKind, LoadedConfig>>({
    "STORY CONTRACT": { status: "loading" },
    "UNIVERSAL CONTENT POLICY": { status: "loading" },
    "PROSE MODE": { status: "loading" }
  });

  useEffect(() => {
    let active = true;

    void listStoryConfig()
      .then((response) => {
        if (!active) {
          return;
        }

        if (!response.ok) {
          setConfigs({
            "STORY CONTRACT": { status: "error", message: response.message },
            "UNIVERSAL CONTENT POLICY": { status: "error", message: response.message },
            "PROSE MODE": { status: "error", message: response.message }
          });
          return;
        }

        setConfigs({
          "STORY CONTRACT": response.configs["STORY CONTRACT"] === undefined
            ? { status: "missing" }
            : { status: "ready", payload: response.configs["STORY CONTRACT"] },
          "UNIVERSAL CONTENT POLICY": response.configs["UNIVERSAL CONTENT POLICY"] === undefined
            ? { status: "missing" }
            : { status: "ready", payload: response.configs["UNIVERSAL CONTENT POLICY"] },
          "PROSE MODE": response.configs["PROSE MODE"] === undefined
            ? { status: "missing" }
            : { status: "ready", payload: response.configs["PROSE MODE"] }
        });
      })
      .catch(() => {
        if (active) {
          setConfigs({
            "STORY CONTRACT": { status: "error", message: "Could not load story configuration." },
            "UNIVERSAL CONTENT POLICY": { status: "error", message: "Could not load story configuration." },
            "PROSE MODE": { status: "error", message: "Could not load story configuration." }
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void listRecords({ type: "ENTITY" }).then((response) => {
      if (active && response.ok) {
        setReferenceRecords(response.records);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  function reconcileSavedConfig(kind: StoryConfigKind, payload: unknown): void {
    setConfigs((current) => ({
      ...current,
      [kind]: { status: "ready", payload }
    }));
  }

  return (
    <section className="surface storyConfigSurface" aria-labelledby="story-config-title">
      <div className="projectHeader">
        <p className="eyebrow">Global configuration</p>
        <h2 id="story-config-title">Story Configuration</h2>
      </div>
      <div className="configStack">
        {storyConfigKinds.map((kind) => (
          <ConfigPanel
            key={kind}
            kind={kind}
            state={configs[kind]}
            referenceRecords={referenceRecords}
            onSaved={reconcileSavedConfig}
          />
        ))}
      </div>
    </section>
  );
}
