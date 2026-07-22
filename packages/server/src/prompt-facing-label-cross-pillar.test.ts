import {
  buildValidationSnapshot,
  compileAcceptedSegmentChangeReviewPrompt,
  compilePrompt,
  compileRecordHygienePrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  extractRecordReferences
} from "@loom/core";
import { describe, expect, it } from "vitest";

import {
  buildStoryRecordHygieneSnapshot,
  type RecordHygieneRepository
} from "./record-hygiene-snapshot-builder.js";
import type { IncomingRecordReference, RecordRepositoryRecord, RecordReadResult } from "./record-repository.js";
import {
  buildAcceptedSegmentChangeReviewSnapshot,
  type AcceptedSegmentChangeReviewRepository
} from "./accepted-segment-change-review-snapshot-builder.js";

describe("prompt-facing full-label cross-pillar contract", () => {
  it("ignores conflicting stored browse labels in Prose, Ideate, Hygiene, and Change Review", () => {
    const records = structuredClone(demoRecords);
    const beliefs = records.filter((record) => record.type === "BELIEF").sort((left, right) => left.id.localeCompare(right.id));
    expect(beliefs).toHaveLength(2);

    const sharedPrefix = "C".repeat(80);
    const browseLabel = `${sharedPrefix.slice(0, 77)}...`;
    const earlierLabel = `${sharedPrefix}Alpha ñ < & complete`;
    const laterLabel = `${sharedPrefix}Zulu Ω > complete`;
    const laterIdRecord = beliefs[1];
    const earlierIdRecord = beliefs[0];
    if (!laterIdRecord || !earlierIdRecord) {
      throw new Error("Demo fixture must contain two BELIEF records.");
    }

    setConflictingLabel(laterIdRecord, browseLabel, earlierLabel);
    setConflictingLabel(earlierIdRecord, browseLabel, laterLabel);
    const commonHolder = (laterIdRecord.payload as Record<string, unknown>).holder;
    earlierIdRecord.payload = { ...(earlierIdRecord.payload as Record<string, unknown>), holder: commonHolder };

    const validationSnapshot = buildValidationSnapshot({
      records,
      generationSession: demoGenerationSession,
      storyConfig: demoStoryConfig,
      versions: { template: "capstone", compiler: "capstone", contract: "capstone" }
    });
    const prose = compilePrompt(validationSnapshot);
    const ideate = compilePrompt(validationSnapshot, {
      promptKind: "ideation",
      ideationRequest: { mode: "ideas", count: 3, dormantSlot: false }
    });
    const repositoryRecords = records.map(repositoryRecord);
    const repository = repositoryFor(repositoryRecords, [laterIdRecord.id, earlierIdRecord.id]);
    const hygieneSnapshot = buildStoryRecordHygieneSnapshot(repository, { mode: "full_active_atomic_review" });
    const reviewSnapshot = buildAcceptedSegmentChangeReviewSnapshot(repository, {
      segmentSelection: "latest",
      recordScope: "active_working_set"
    });

    expect(hygieneSnapshot.ok).toBe(true);
    expect(reviewSnapshot.ok).toBe(true);
    if (!hygieneSnapshot.ok || !reviewSnapshot.ok) {
      return;
    }

    const hygiene = compileRecordHygienePrompt(hygieneSnapshot.snapshot);
    const review = compileAcceptedSegmentChangeReviewPrompt(reviewSnapshot.snapshot);

    for (const prompt of [prose.prompt, ideate.prompt]) {
      expect(prompt).toContain(earlierLabel);
      expect(prompt).toContain(laterLabel);
      expect(prompt).not.toContain(browseLabel);
    }
    for (const prompt of [hygiene.prompt, review.prompt]) {
      expect(prompt).toContain(escapeDataText(earlierLabel));
      expect(prompt).toContain(escapeDataText(laterLabel));
      expect(prompt).not.toContain(browseLabel);
    }
    const proseFacts = sectionText(prose.prompt, "relevant_facts_beliefs_events");
    expect(proseFacts.indexOf(`- ${earlierLabel}`)).toBeLessThan(proseFacts.indexOf(`- ${laterLabel}`));
    expect(ideate.prompt).toMatch(new RegExp(`\\[BELIEF-1\\][^\\n]*${escapeRegExp(earlierLabel)}`));
    expect(hygiene.metadata.citationMap?.["[BELIEF-1]"]).toBe(laterIdRecord.id);
    expect(review.disclosure.citationMap["[BELIEF-1]"]).toBe(laterIdRecord.id);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeDataText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sectionText(prompt: string, section: string): string {
  return prompt.match(new RegExp(`<${section}>\\n([\\s\\S]*?)\\n</${section}>`))?.[1] ?? "";
}

function setConflictingLabel(
  record: (typeof demoRecords)[number],
  browseLabel: string,
  fullLabel: string
): void {
  record.displayLabel = browseLabel;
  record.metadata = {
    ...record.metadata,
    displayLabel: browseLabel,
    userOrder: 1,
    salience: "medium",
    urgency: "medium"
  };
  record.payload = { ...(record.payload as Record<string, unknown>), claim: fullLabel };
}

function repositoryRecord(record: (typeof demoRecords)[number]): RecordRepositoryRecord {
  return {
    id: record.id,
    type: record.type,
    displayLabel: record.displayLabel,
    status: null,
    salience: null,
    urgency: null,
    archived: record.metadata?.archived ?? false,
    userOrder: record.metadata?.userOrder ?? null,
    createdAt: record.metadata?.createdAt ?? "2026-06-24T00:00:00.000Z",
    updatedAt: record.metadata?.updatedAt ?? "2026-06-24T00:00:00.000Z",
    payload: record.payload
  };
}

function repositoryFor(
  records: readonly RecordRepositoryRecord[],
  selectedRecords: readonly string[]
): RecordHygieneRepository & AcceptedSegmentChangeReviewRepository {
  const byId = new Map(records.map((record) => [record.id, record]));
  const results: RecordReadResult[] = records.map((record) => ({ ok: true, record }));

  return {
    listRecords: () => results,
    referencesForRecord: (id) => {
      const record = byId.get(id);
      return record ? extractRecordReferences(record.type, record.payload) : [];
    },
    incomingReferencesForRecord: (id) => records.flatMap((record): IncomingRecordReference[] =>
      extractRecordReferences(record.type, record.payload)
        .filter((reference) => reference.targetId === id)
        .map((reference) => ({ fromRecordId: record.id, refRole: reference.refRole }))
    ),
    getGenerationSession: () => ({
      ok: true,
      payload: { active_working_set: { selected_records: [...selectedRecords] } }
    }),
    getLatestAcceptedSegmentForReconciliation: () => ({
      id: 1,
      sequence: 1,
      acceptedAt: "2026-06-24T10:00:00.000Z",
      text: "Accepted prose remains bounded reconciliation evidence only."
    })
  };
}
