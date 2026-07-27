export interface ParsedIdea {
  slotNumber: number;
  operator: string;
  headline?: string;
  question?: string;
  why?: string;
  skipped?: true;
  grounds: readonly string[];
  unknownCitations: readonly string[];
}

export interface IdeationParseExpectation {
  mode: "ideas" | "questions";
  slots: readonly { slotNumber: number; operator: string }[];
  validCitationKeys: ReadonlySet<string>;
}

export type IdeationParseFailureCode =
  | "missing-idea-blocks"
  | "malformed-line"
  | "malformed-slot-number"
  | "unexpected-slot"
  | "duplicate-slot"
  | "missing-slot"
  | "duplicate-field"
  | "unexpected-field"
  | "missing-operator"
  | "mismatched-operator"
  | "invalid-skipped-marker"
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

const ideaHeaderPattern = /^IDEA\s+(\d+)\s*$/i;
const ideaHeaderCandidatePattern = /^IDEA\b/i;
const citationPattern = /\[[^\]\r\n]+\]/g;
const groundsPattern = /^\[[^\]\r\n]+\](?:\s*,\s*\[[^\]\r\n]+\])*$/;
const skippedMarker = "no compiled record supports this slot.";
const permittedFields = new Set(["operator", "headline", "question", "why", "grounds", "skipped"]);

export function describeIdeationParseFailure(reason: IdeationParseFailure): string {
  const slot = reason.slotNumber === undefined ? "" : `Assigned slot ${reason.slotNumber}: `;
  switch (reason.code) {
    case "missing-idea-blocks":
      return "No IDEA blocks were present.";
    case "malformed-line":
      return `${slot}a line did not use the required tagged field structure.`;
    case "malformed-slot-number":
      return "An IDEA header did not contain a valid positive slot number.";
    case "unexpected-slot":
      return `${slot}the slot was not in the compiled assignment.`;
    case "duplicate-slot":
      return `${slot}the slot appeared more than once.`;
    case "missing-slot":
      return `${slot}the compiled assignment was missing from the response.`;
    case "duplicate-field":
      return `${slot}a tagged field appeared more than once.`;
    case "unexpected-field":
      return `${slot}the block contained a field outside the Ideate output contract.`;
    case "missing-operator":
      return `${slot}the assigned operator was missing.`;
    case "mismatched-operator":
      return `${slot}the operator did not match the compiled assignment.`;
    case "invalid-skipped-marker":
      return `${slot}the SKIPPED marker did not match the Ideate contract.`;
    case "skipped-with-normal-fields":
      return `${slot}a SKIPPED block also contained normal idea or question fields.`;
    case "missing-headline":
      return `${slot}an idea block was missing its headline.`;
    case "missing-question":
      return `${slot}a question block was missing its question.`;
    case "unexpected-mode-field":
      return `${slot}the block used the field for the other requested mode.`;
    case "missing-why":
      return `${slot}a normal block was missing its why field.`;
    case "missing-grounds":
      return `${slot}a normal block was missing its grounds field.`;
    case "malformed-grounds":
      return `${slot}the grounds field was not a comma-separated list of bracketed citation keys.`;
  }
}

export function parseIdeationResponse(
  responseText: string,
  expectation: IdeationParseExpectation
): ParseIdeationResult {
  const split = splitIdeaBlocks(responseText);
  if (!split.ok) {
    return split;
  }

  const expectedBySlot = new Map(expectation.slots.map((slot) => [slot.slotNumber, slot]));
  const seenSlots = new Set<number>();
  const parsedBySlot = new Map<number, ParsedIdea>();

  for (const block of split.blocks) {
    const header = block[0]?.match(ideaHeaderPattern);
    const slotNumber = Number(header?.[1]);
    if (!Number.isSafeInteger(slotNumber) || slotNumber < 1) {
      return failure("malformed-slot-number");
    }
    if (!expectedBySlot.has(slotNumber)) {
      return failure("unexpected-slot", slotNumber);
    }
    if (seenSlots.has(slotNumber)) {
      return failure("duplicate-slot", slotNumber);
    }
    seenSlots.add(slotNumber);

    const parsed = parseIdeaBlock(block, expectedBySlot.get(slotNumber)!, expectation);
    if (!parsed.ok) {
      return parsed;
    }
    parsedBySlot.set(slotNumber, parsed.idea);
  }

  for (const expected of expectation.slots) {
    if (!seenSlots.has(expected.slotNumber)) {
      return failure("missing-slot", expected.slotNumber);
    }
  }

  return {
    ok: true,
    ideas: expectation.slots.map((slot) => parsedBySlot.get(slot.slotNumber)!)
  };
}

function splitIdeaBlocks(responseText: string):
  | { ok: true; blocks: readonly (readonly string[])[] }
  | { ok: false; reason: IdeationParseFailure } {
  const lines = responseText.split(/\r?\n/);
  const blocks: string[][] = [];
  let current: string[] | undefined;
  let hasPreambleContent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (ideaHeaderCandidatePattern.test(trimmed)) {
      current = [trimmed];
      blocks.push(current);
      continue;
    }
    if (current === undefined) {
      hasPreambleContent ||= trimmed.length > 0;
      continue;
    }
    if (trimmed.length > 0) {
      current.push(trimmed);
    }
  }

  if (blocks.length === 0) {
    return failure("missing-idea-blocks");
  }
  if (hasPreambleContent) {
    return failure("malformed-line");
  }
  return { ok: true, blocks };
}

function parseIdeaBlock(
  lines: readonly string[],
  expected: { slotNumber: number; operator: string },
  expectation: IdeationParseExpectation
): { ok: true; idea: ParsedIdea } | { ok: false; reason: IdeationParseFailure } {
  const fields = new Map<string, string>();
  for (const line of lines.slice(1)) {
    const separator = line.indexOf(":");
    if (separator <= 0) {
      return failure("malformed-line", expected.slotNumber);
    }
    const key = line.slice(0, separator).trim().toLowerCase();
    if (!permittedFields.has(key)) {
      return failure("unexpected-field", expected.slotNumber);
    }
    if (fields.has(key)) {
      return failure("duplicate-field", expected.slotNumber);
    }
    fields.set(key, line.slice(separator + 1).trim());
  }

  const operator = fields.get("operator");
  if (!operator) {
    return failure("missing-operator", expected.slotNumber);
  }
  if (operator !== expected.operator) {
    return failure("mismatched-operator", expected.slotNumber);
  }

  if (fields.has("skipped")) {
    if (fields.get("skipped") !== skippedMarker) {
      return failure("invalid-skipped-marker", expected.slotNumber);
    }
    if (["headline", "question", "why", "grounds"].some((key) => fields.has(key))) {
      return failure("skipped-with-normal-fields", expected.slotNumber);
    }
    return {
      ok: true,
      idea: {
        slotNumber: expected.slotNumber,
        operator,
        skipped: true,
        grounds: [],
        unknownCitations: []
      }
    };
  }

  const modeField = expectation.mode === "ideas" ? "headline" : "question";
  const otherModeField = expectation.mode === "ideas" ? "question" : "headline";
  if (fields.has(otherModeField)) {
    return failure("unexpected-mode-field", expected.slotNumber);
  }
  const modeValue = fields.get(modeField);
  if (!modeValue) {
    return failure(expectation.mode === "ideas" ? "missing-headline" : "missing-question", expected.slotNumber);
  }
  const why = fields.get("why");
  if (!why) {
    return failure("missing-why", expected.slotNumber);
  }
  const groundsText = fields.get("grounds");
  if (!groundsText) {
    return failure("missing-grounds", expected.slotNumber);
  }
  if (!groundsPattern.test(groundsText)) {
    return failure("malformed-grounds", expected.slotNumber);
  }

  const grounds = Array.from(groundsText.matchAll(citationPattern), (match) => match[0]);
  return {
    ok: true,
    idea: {
      slotNumber: expected.slotNumber,
      operator,
      [modeField]: modeValue,
      why,
      grounds,
      unknownCitations: grounds.filter((ground) => !expectation.validCitationKeys.has(ground))
    }
  };
}

function failure(code: IdeationParseFailureCode, slotNumber?: number): { ok: false; reason: IdeationParseFailure } {
  return {
    ok: false,
    reason: {
      code,
      ...(slotNumber === undefined ? {} : { slotNumber })
    }
  };
}
