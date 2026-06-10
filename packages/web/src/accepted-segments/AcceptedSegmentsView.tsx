import { useEffect, useMemo, useState } from "react";

import {
  deleteAcceptedSegment,
  listAcceptedSegments,
  type AcceptedSegment,
  type ApiFailure,
  type GenerationMetadata
} from "../api.js";

type ArchiveState =
  | { status: "loading" }
  | { status: "ready"; segments: AcceptedSegment[] }
  | { status: "error"; kind: string; message: string };

export function AcceptedSegmentsView(): React.JSX.Element {
  const [state, setState] = useState<ArchiveState>({ status: "loading" });
  const [filter, setFilter] = useState("");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedById, setExpandedById] = useState<Record<number, boolean>>({});

  useEffect(() => {
    void refreshSegments();
  }, []);

  async function refreshSegments(): Promise<void> {
    setState({ status: "loading" });
    setDeleteError(null);
    setConfirmingId(null);

    try {
      const result = await listAcceptedSegments();

      if (result.ok) {
        setState({ status: "ready", segments: sortSegments(result.segments) });
        return;
      }

      setState({ status: "error", kind: result.kind, message: result.message });
    } catch {
      setState({ status: "error", kind: "accepted-segments-request-failed", message: "Could not load accepted segments." });
    }
  }

  async function confirmDelete(segment: AcceptedSegment): Promise<void> {
    setDeleteError(null);

    try {
      const result = await deleteAcceptedSegment(segment.id);

      if (result.ok) {
        setState((current) => {
          if (current.status !== "ready") {
            return current;
          }

          return {
            status: "ready",
            segments: current.segments.filter((candidate) => candidate.id !== result.deleted.id)
          };
        });
        setConfirmingId(null);
        return;
      }

      setDeleteError(errorMessage(result));
    } catch {
      setDeleteError("Could not delete accepted segment.");
    }
  }

  const filteredSegments = useMemo(() => {
    if (state.status !== "ready") {
      return [];
    }

    const term = filter.trim().toLocaleLowerCase();
    if (term === "") {
      return state.segments;
    }

    return state.segments.filter((segment) => searchableText(segment).includes(term));
  }, [filter, state]);

  const displayIndexById = useMemo(() => {
    if (state.status !== "ready") {
      return new Map<number, number>();
    }

    return new Map(state.segments.map((segment, index) => [segment.id, index + 1]));
  }, [state]);

  const latestSegmentId = state.status === "ready" && state.segments.length > 0
    ? state.segments[state.segments.length - 1]?.id ?? null
    : null;
  const filterIsActive = filter.trim() !== "";

  function isSegmentExpanded(segment: AcceptedSegment): boolean {
    if (filterIsActive) {
      return true;
    }

    return expandedById[segment.id] ?? segment.id === latestSegmentId;
  }

  function toggleSegment(segment: AcceptedSegment): void {
    setExpandedById((current) => ({
      ...current,
      [segment.id]: !isSegmentExpanded(segment)
    }));
  }

  return (
    <section className="surface acceptedArchiveSurface" aria-labelledby="accepted-segments-title">
      <div className="projectHeader">
        <p className="eyebrow">Readable output archive</p>
        <h2 id="accepted-segments-title">Accepted Segments</h2>
      </div>

      {state.status === "loading" ? <p className="muted" role="status">Loading accepted segments...</p> : null}

      {state.status === "error" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">{errorMessage(state)}</p>
          <button type="button" onClick={() => void refreshSegments()}>Retry</button>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <section className="acceptedArchiveStack">
          <p className="status statusWarning" role="note">
            Accepted prose is readable output, not continuity canon.
          </p>

          <div className="acceptedArchiveToolbar">
            <label className="acceptedFilter">
              Filter archive
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search prose or metadata"
              />
            </label>
            <div className="acceptedExportActions" aria-label="Export full archive">
              <button type="button" onClick={() => exportArchive(state.segments, "markdown")} disabled={state.segments.length === 0}>
                Export Markdown
              </button>
              <button type="button" onClick={() => exportArchive(state.segments, "text")} disabled={state.segments.length === 0}>
                Export text
              </button>
            </div>
          </div>

          {deleteError ? <p className="status statusError" role="alert">{deleteError}</p> : null}

          {state.segments.length === 0 ? <p className="muted">No accepted segments yet.</p> : null}

          {state.segments.length > 0 && filteredSegments.length === 0 ? (
            <p className="muted">No accepted segments match this filter.</p>
          ) : null}

          {filteredSegments.length > 0 ? (
            <ol className="acceptedSegmentList">
              {filteredSegments.map((segment, index) => (
                <AcceptedSegmentItem
                  key={segment.id}
                  segment={segment}
                  displayIndex={displayIndexById.get(segment.id) ?? index + 1}
                  isExpanded={isSegmentExpanded(segment)}
                  isConfirming={confirmingId === segment.id}
                  onToggle={() => toggleSegment(segment)}
                  onAskDelete={() => {
                    setDeleteError(null);
                    setConfirmingId(segment.id);
                  }}
                  onCancelDelete={() => setConfirmingId(null)}
                  onConfirmDelete={() => void confirmDelete(segment)}
                />
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}

function AcceptedSegmentItem({
  segment,
  displayIndex,
  isExpanded,
  isConfirming,
  onToggle,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  segment: AcceptedSegment;
  displayIndex: number;
  isExpanded: boolean;
  isConfirming: boolean;
  onToggle: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}): React.JSX.Element {
  const contentId = `accepted-segment-${segment.id}-content`;

  return (
    <li className="acceptedSegmentItem">
      <article className="acceptedSegmentArticle" aria-label={`Accepted segment ${displayIndex}`}>
        <header className="acceptedSegmentHeader">
          <div className="acceptedSegmentHeading">
            <h3>
              <button
                type="button"
                className="acceptedSegmentToggle"
                aria-expanded={isExpanded}
                aria-controls={contentId}
                onClick={onToggle}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onToggle();
                  }
                }}
              >
                <span>Segment {displayIndex}</span>
                <span className="acceptedSegmentChevron" aria-hidden="true">{isExpanded ? "Collapse" : "Expand"}</span>
              </button>
            </h3>
            <p className="muted">Accepted {segment.createdAt}</p>
            <p className="acceptedSegmentExcerpt">{segmentExcerpt(segment.text)}</p>
          </div>
        </header>

        {isExpanded ? (
          <div id={contentId} className="acceptedSegmentDisclosure">
            <pre className="acceptedSegmentText">{segment.text}</pre>

            <section className="acceptedMetadataPanel" aria-label={`Segment ${displayIndex} metadata`}>
              <h4>Metadata</h4>
              <MetadataGrid metadata={segment.metadata} sequence={segment.sequence} />
            </section>

            <div className="acceptedSegmentActions">
              <button type="button" className="secondaryButton" onClick={onAskDelete}>
                Delete
              </button>
            </div>

            {isConfirming ? (
              <section className="acceptedDeleteConfirm" aria-label={`Confirm delete segment ${displayIndex}`}>
                <p>Delete removes this readable output only. Records are unchanged.</p>
                <div>
                  <button type="button" onClick={onConfirmDelete}>Confirm delete output</button>
                  <button type="button" className="secondaryButton" onClick={onCancelDelete}>Cancel</button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </article>
    </li>
  );
}

function MetadataGrid({ metadata, sequence }: { metadata: GenerationMetadata; sequence: number }): React.JSX.Element {
  const rows = [
    ["Stored sequence", String(sequence)],
    ["Model", metadata.model],
    ["Provider", metadata.provider],
    ["Temperature", String(metadata.temperature)],
    ["Max output tokens", String(metadata.maxOutputTokens)],
    ["Top P", metadata.topP === undefined ? "Not set" : String(metadata.topP)],
    ["Template version", metadata.versions.template],
    ["Compiler version", metadata.versions.compiler],
    ["Contract version", metadata.versions.contract]
  ];

  return (
    <dl className="acceptedMetadataGrid">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function sortSegments(segments: AcceptedSegment[]): AcceptedSegment[] {
  return [...segments].sort((left, right) => left.sequence - right.sequence);
}

function searchableText(segment: AcceptedSegment): string {
  const metadata = segment.metadata;
  return [
    segment.text,
    segment.createdAt,
    String(segment.sequence),
    metadata.model,
    metadata.provider,
    String(metadata.temperature),
    String(metadata.maxOutputTokens),
    metadata.topP === undefined ? "" : String(metadata.topP),
    metadata.versions.template,
    metadata.versions.compiler,
    metadata.versions.contract
  ]
    .join(" ")
    .toLocaleLowerCase();
}

function segmentExcerpt(text: string): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 140) {
    return singleLine;
  }

  return `${singleLine.slice(0, 139).trimEnd()}...`;
}

function exportArchive(segments: AcceptedSegment[], format: "markdown" | "text"): void {
  const sorted = sortSegments(segments);
  const text = format === "markdown" ? markdownArchive(sorted) : textArchive(sorted);
  const blob = new Blob([text], { type: format === "markdown" ? "text/markdown" : "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = format === "markdown" ? "accepted-segments.md" : "accepted-segments.txt";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function markdownArchive(segments: AcceptedSegment[]): string {
  return [
    "# Accepted Segments",
    "",
    "Readable output archive. Not continuity canon.",
    "",
    ...segments.flatMap((segment, index) => [
      `## Segment ${index + 1}`,
      "",
      `- Stored sequence: ${segment.sequence}`,
      `- Accepted: ${segment.createdAt}`,
      `- Model: ${segment.metadata.model}`,
      "",
      segment.text,
      ""
    ])
  ].join("\n");
}

function textArchive(segments: AcceptedSegment[]): string {
  return [
    "Accepted Segments",
    "Readable output archive. Not continuity canon.",
    "",
    ...segments.flatMap((segment, index) => [
      `Segment ${index + 1}`,
      `Stored sequence: ${segment.sequence}`,
      `Accepted: ${segment.createdAt}`,
      `Model: ${segment.metadata.model}`,
      "",
      segment.text,
      ""
    ])
  ].join("\n");
}

function errorMessage(error: Pick<ApiFailure, "kind" | "message">): string {
  if (error.kind === "no-open-project") {
    return "Open a project first.";
  }

  return error.message;
}
