import type { ValidationSnapshot } from "../../validation/snapshot.js";
import { compileAssignedIdeationPrompt } from "../compile-prompt.js";
import { citationKeysFor } from "./citation-keys.js";
import { ideationOutputJsonSchema } from "./output-schema.js";
import { assignSlots } from "./slot-assignment.js";
import {
  ideationRequestSchema,
  type IdeationAssignment,
  type IdeationParseContext,
  type IdeationRequest
} from "./types.js";

export interface IdeationCompileResult {
  prompt: string;
  assignment: IdeationAssignment;
  outputSchema: Record<string, unknown>;
  parseContext: IdeationParseContext;
  metadata: ReturnType<typeof compileAssignedIdeationPrompt>["metadata"];
}

export function compileIdeationPrompt(
  snapshot: ValidationSnapshot,
  requestInput: Partial<IdeationRequest> = {}
): IdeationCompileResult {
  const request = ideationRequestSchema.parse(requestInput);
  const assignment = assignSlots(snapshot.records, request);
  const validCitationKeys = new Set(citationKeysFor(snapshot.records).values());
  const compiled = compileAssignedIdeationPrompt(snapshot, request, assignment);
  const parseContext: IdeationParseContext = {
    mode: request.mode,
    slots: assignment.slots.map((slot, index) => ({
      slotNumber: index + 1,
      operator: slot.operator,
      operatorName: slot.operatorName
    })),
    validCitationKeys
  };

  return {
    prompt: compiled.prompt,
    assignment,
    outputSchema: ideationOutputJsonSchema(assignment, request.mode, [...validCitationKeys]),
    parseContext,
    metadata: compiled.metadata
  };
}
