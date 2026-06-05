import { useEffect, useState } from "react";

import { getStoryConfig, listRecords, setStoryConfig, type RecordSummary, type StoryConfigKind } from "../api.js";
import { RecordEditor } from "../records/RecordEditor.js";

const storyConfigKinds: StoryConfigKind[] = [
  "STORY CONTRACT",
  "UNIVERSAL CONTENT POLICY",
  "PROSE MODE"
];

type LoadedConfig =
  | { status: "loading" }
  | { status: "ready"; payload: unknown }
  | { status: "missing" }
  | { status: "error"; message: string };

function ConfigPanel({
  kind,
  referenceRecords
}: {
  kind: StoryConfigKind;
  referenceRecords: readonly RecordSummary[];
}): React.JSX.Element {
  const [state, setState] = useState<LoadedConfig>({ status: "loading" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    void getStoryConfig(kind)
      .then((response) => {
        if (!active) {
          return;
        }

        if (response.ok) {
          setState({ status: "ready", payload: response.payload });
        } else if (response.kind === "not-found") {
          setState({ status: "missing" });
        } else {
          setState({ status: "error", message: response.message });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: "error", message: "Could not load story configuration." });
        }
      });

    return () => {
      active = false;
    };
  }, [kind]);

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
            referenceRecords={referenceRecords}
            headingEyebrow="Story configuration"
            submitLabel={`Save ${kind}`}
            onSubmitPayload={async (nextPayload) => {
              const response = await setStoryConfig(kind, nextPayload);
              if (!response.ok) {
                return response;
              }
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

  return (
    <section className="surface storyConfigSurface" aria-labelledby="story-config-title">
      <div className="projectHeader">
        <p className="eyebrow">Global configuration</p>
        <h2 id="story-config-title">Story Configuration</h2>
      </div>
      <div className="configStack">
        {storyConfigKinds.map((kind) => (
          <ConfigPanel key={kind} kind={kind} referenceRecords={referenceRecords} />
        ))}
      </div>
    </section>
  );
}
