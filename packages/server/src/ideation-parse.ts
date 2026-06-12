export interface ParsedIdea {
  slotNumber: number;
  operator: string;
  headline?: string;
  question?: string;
  why?: string;
  grounds: readonly string[];
  unknownCitations: readonly string[];
}

export type ParseIdeationResult =
  | { ok: true; ideas: readonly ParsedIdea[] }
  | { ok: false; raw: string };

const ideaHeaderPattern = /^IDEA\s+(\d+)\s*$/i;
const citationPattern = /\[[^\]]+\]/g;

export function parseIdeationResponse(responseText: string, validCitationKeys: ReadonlySet<string>): ParseIdeationResult {
  const blocks = splitIdeaBlocks(responseText);

  if (blocks.length === 0) {
    return { ok: false, raw: responseText };
  }

  const ideas = blocks.map((block) => parseIdeaBlock(block, validCitationKeys));

  if (ideas.some((idea) => idea === null)) {
    return { ok: false, raw: responseText };
  }

  return { ok: true, ideas: ideas as ParsedIdea[] };
}

function splitIdeaBlocks(responseText: string): string[] {
  const lines = responseText.split(/\r?\n/);
  const blocks: string[][] = [];
  let current: string[] | undefined;

  for (const line of lines) {
    if (ideaHeaderPattern.test(line.trim())) {
      current = [line];
      blocks.push(current);
      continue;
    }

    current?.push(line);
  }

  return blocks.map((block) => block.join("\n").trim()).filter(Boolean);
}

function parseIdeaBlock(block: string, validCitationKeys: ReadonlySet<string>): ParsedIdea | null {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const header = lines[0]?.match(ideaHeaderPattern);

  if (!header) {
    return null;
  }

  const fields = new Map<string, string>();
  for (const line of lines.slice(1)) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    fields.set(line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim());
  }

  const operator = fields.get("operator");
  const groundsText = fields.get("grounds") ?? "";
  const grounds = Array.from(groundsText.matchAll(citationPattern), (match) => match[0] ?? "");

  if (!operator || grounds.length === 0) {
    return null;
  }

  const idea: ParsedIdea = {
    slotNumber: Number(header[1]),
    operator,
    grounds,
    unknownCitations: grounds.filter((ground) => !validCitationKeys.has(ground))
  };

  const headline = fields.get("headline");
  const question = fields.get("question");
  const why = fields.get("why");
  if (headline) {
    idea.headline = headline;
  }
  if (question) {
    idea.question = question;
  }
  if (why) {
    idea.why = why;
  }

  return idea;
}
