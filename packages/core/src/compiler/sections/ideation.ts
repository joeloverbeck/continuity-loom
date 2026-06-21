import type { ValidationSnapshot } from "../../validation/snapshot.js";
import { assignSlots } from "../ideation/slot-assignment.js";
import type { IdeationRequest } from "../ideation/types.js";

export function renderIdeationSlotsSection(
  snapshot: ValidationSnapshot,
  requestInput: Partial<IdeationRequest> = {}
): string {
  const assignment = assignSlots(snapshot.records, requestInput);
  const modeLine =
    requestInput.mode === "questions"
      ? "Mode: questions. Render each slot as an author-facing story question."
      : "Mode: ideas. Render each slot as a premise-level possibility.";
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

  return `<ideation_slots>\n${modeLine}\n${shrinkLine}\n\n${body || "No grounded ideation slots are available."}\n</ideation_slots>`;
}
