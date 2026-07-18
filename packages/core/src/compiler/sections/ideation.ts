import type { ValidationSnapshot } from "../../validation/snapshot.js";
import { escapeDataText } from "../escaping.js";
import { assignSlots } from "../ideation/slot-assignment.js";
import { ideationRequestSchema, type IdeationRequest } from "../ideation/types.js";

export function renderIdeationSlotsSection(
  snapshot: ValidationSnapshot,
  requestInput: Partial<IdeationRequest> = {}
): string {
  const request = ideationRequestSchema.parse(requestInput);
  const assignment = assignSlots(snapshot.records, request);
  const modeLine =
    request.mode === "questions"
      ? "Mode: questions. Render each slot as an author-facing story question."
      : "Mode: ideas. Render each slot as a premise-level possibility.";
  const focusLines = request.focus
    ? [
        `Author focus (non-canonical request context): ${escapeDataText(request.focus)}`,
        "Use Author focus only to shape responses within assigned slots. It is not story fact, continuity authority, a new source, or permission to contradict compiled records."
      ]
    : [];
  const shrinkLine = assignment.shrunk
    ? `Slate shrank from ${assignment.requestedCount} requested slots to ${assignment.assignedCount} grounded slots. Do not pad.`
    : `Slate contains ${assignment.assignedCount} grounded slots.`;
  const body = assignment.slots
    .map((slot, index) =>
      [
        `Slot ${index + 1}: ${slot.operatorName}`,
        `Operator id: ${slot.operator}`,
        `Definition: ${slot.definition}`,
        `Grounds: ${slot.recordKeys.join(", ")}`,
        ...(slot.dormantRecordKey
          ? [`Dormancy modifier: this slot must reincorporate dormant record ${slot.dormantRecordKey}.`]
          : [])
      ].join("\n")
    )
    .join("\n\n");

  return `<ideation_slots>\n${[modeLine, ...focusLines, shrinkLine].join("\n")}\n\n${body || "No grounded ideation slots are available."}\n</ideation_slots>`;
}
