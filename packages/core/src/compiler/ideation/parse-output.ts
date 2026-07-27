import {
  IDEATION_OUTPUT_CONTRACT,
  type IdeationParseContext,
  type ParsedIdea
} from "./types.js";

export type IdeationParseFailureCode =
  | "not-pure-json"
  | "schema-mismatch"
  | "contract-mismatch"
  | "malformed-slot-number"
  | "unexpected-slot"
  | "duplicate-slot"
  | "missing-slot"
  | "unexpected-field"
  | "missing-operator"
  | "mismatched-operator"
  | "invalid-status"
  | "skipped-with-normal-fields"
  | "missing-headline"
  | "missing-question"
  | "unexpected-mode-field"
  | "missing-why"
  | "missing-grounds"
  | "malformed-grounds";

export interface IdeationParseFailure {
  code: IdeationParseFailureCode;
  slotNumber?: number;
}

export type ParseIdeationResult =
  | { ok: true; ideas: readonly ParsedIdea[] }
  | { ok: false; reason: IdeationParseFailure };

export function parseIdeationOutput(input: unknown, context: IdeationParseContext): ParseIdeationResult {
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return failure("not-pure-json");
    }
  }

  if (!isExactObject(input, ["contract", "ideas"])) {
    return failure("schema-mismatch");
  }
  if (input.contract !== IDEATION_OUTPUT_CONTRACT) {
    return failure("contract-mismatch");
  }
  if (!Array.isArray(input.ideas)) {
    return failure("schema-mismatch");
  }

  const expectedBySlot = new Map(context.slots.map((slot) => [slot.slotNumber, slot]));
  const parsedBySlot = new Map<number, ParsedIdea>();

  for (const value of input.ideas) {
    if (!isObject(value)) {
      return failure("malformed-slot-number");
    }
    const slotNumber = value.slot_number;
    if (!Number.isSafeInteger(slotNumber) || (slotNumber as number) < 1) {
      return failure("malformed-slot-number");
    }
    const slot = slotNumber as number;
    const expected = expectedBySlot.get(slot);
    if (!expected) {
      return failure("unexpected-slot", slot);
    }
    if (parsedBySlot.has(slot)) {
      return failure("duplicate-slot", slot);
    }

    const modeField = context.mode === "ideas" ? "headline" : "question";
    const otherModeField = context.mode === "ideas" ? "question" : "headline";
    if (Object.hasOwn(value, otherModeField)) {
      return failure("unexpected-mode-field", slot);
    }
    const allowedFields = ["slot_number", "operator", "status", modeField, "why", "grounds"];
    if (Object.keys(value).some((key) => !allowedFields.includes(key))) {
      return failure("unexpected-field", slot);
    }

    if (typeof value.operator !== "string" || !value.operator.trim()) {
      return failure("missing-operator", slot);
    }
    if (value.operator !== expected.operator) {
      return failure("mismatched-operator", slot);
    }
    if (value.status !== "idea" && value.status !== "skipped") {
      return failure("invalid-status", slot);
    }

    if (value.status === "skipped") {
      if (value[modeField] !== "" || value.why !== "" || !Array.isArray(value.grounds) || value.grounds.length !== 0) {
        return failure("skipped-with-normal-fields", slot);
      }
      parsedBySlot.set(slot, {
        slotNumber: slot,
        operator: expected.operatorName,
        skipped: true,
        grounds: [],
        unknownCitations: []
      });
      continue;
    }

    const modeValue = value[modeField];
    if (typeof modeValue !== "string" || !modeValue.trim()) {
      return failure(context.mode === "ideas" ? "missing-headline" : "missing-question", slot);
    }
    if (typeof value.why !== "string" || !value.why.trim()) {
      return failure("missing-why", slot);
    }
    if (!Object.hasOwn(value, "grounds")) {
      return failure("missing-grounds", slot);
    }
    if (!Array.isArray(value.grounds) || value.grounds.length === 0) {
      return failure("missing-grounds", slot);
    }
    if (value.grounds.some((ground) => typeof ground !== "string" || !ground.trim())) {
      return failure("malformed-grounds", slot);
    }

    const grounds = value.grounds as string[];
    parsedBySlot.set(slot, {
      slotNumber: slot,
      operator: expected.operatorName,
      [modeField]: modeValue.trim(),
      why: value.why.trim(),
      grounds,
      unknownCitations: grounds.filter((ground) => !context.validCitationKeys.has(ground))
    });
  }

  for (const expected of context.slots) {
    if (!parsedBySlot.has(expected.slotNumber)) {
      return failure("missing-slot", expected.slotNumber);
    }
  }

  return {
    ok: true,
    ideas: context.slots.map((slot) => parsedBySlot.get(slot.slotNumber)!)
  };
}

export function describeIdeationParseFailure(reason: IdeationParseFailure): string {
  const slot = reason.slotNumber === undefined ? "" : `Assigned slot ${reason.slotNumber}: `;
  switch (reason.code) {
    case "not-pure-json":
      return "The response was not one complete JSON value.";
    case "schema-mismatch":
      return "The response did not match the grounded Ideation JSON shape.";
    case "contract-mismatch":
      return "The response contract did not match grounded_ideation.v1.";
    case "malformed-slot-number":
      return "An item did not contain a valid positive slot number.";
    case "unexpected-slot":
      return `${slot}the slot was not in the compiled assignment.`;
    case "duplicate-slot":
      return `${slot}the slot appeared more than once.`;
    case "missing-slot":
      return `${slot}the compiled assignment was missing from the response.`;
    case "unexpected-field":
      return `${slot}the item contained a field outside the Ideate output contract.`;
    case "missing-operator":
      return `${slot}the assigned operator was missing.`;
    case "mismatched-operator":
      return `${slot}the operator did not match the compiled assignment.`;
    case "invalid-status":
      return `${slot}the item status was not recognized.`;
    case "skipped-with-normal-fields":
      return `${slot}a skipped item carried non-empty idea content.`;
    case "missing-headline":
      return `${slot}an idea item was missing its headline.`;
    case "missing-question":
      return `${slot}a question item was missing its question.`;
    case "unexpected-mode-field":
      return `${slot}the item used the field for the other requested mode.`;
    case "missing-why":
      return `${slot}a normal item was missing its why field.`;
    case "missing-grounds":
      return `${slot}a normal item was missing grounds.`;
    case "malformed-grounds":
      return `${slot}the grounds array contained an invalid citation key value.`;
  }
}

function failure(code: IdeationParseFailureCode, slotNumber?: number): ParseIdeationResult {
  return {
    ok: false,
    reason: {
      code,
      ...(slotNumber === undefined ? {} : { slotNumber })
    }
  };
}

function isObject(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function isExactObject(input: unknown, keys: readonly string[]): input is Record<string, unknown> {
  return isObject(input) && Object.keys(input).length === keys.length && Object.keys(input).every((key) => keys.includes(key));
}
