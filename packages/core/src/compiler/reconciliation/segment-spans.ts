import { segmentSpanCitationKey } from "./citation-keys.js";
import type { AcceptedSegmentSpan } from "./types.js";

const MAX_SPAN_LENGTH = 800;

interface SpanCandidate {
  startOffset: number;
  endOffset: number;
}

export function normalizeAcceptedSegmentText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function partitionAcceptedSegmentSpans(text: string, sequence: number): readonly AcceptedSegmentSpan[] {
  const normalizedText = normalizeAcceptedSegmentText(text);
  const candidates = splitParagraphCandidates(normalizedText).flatMap((candidate) =>
    splitLongCandidate(normalizedText, candidate)
  );

  return candidates.map((candidate, index) => ({
    key: segmentSpanCitationKey(sequence, index + 1),
    sequence,
    index: index + 1,
    startOffset: candidate.startOffset,
    endOffset: candidate.endOffset,
    text: normalizedText.slice(candidate.startOffset, candidate.endOffset)
  }));
}

function splitParagraphCandidates(text: string): readonly SpanCandidate[] {
  const candidates: SpanCandidate[] = [];
  const blankLinePattern = /\n[ \t]*\n+/g;
  let startOffset = 0;
  let match: RegExpExecArray | null;

  while ((match = blankLinePattern.exec(text)) !== null) {
    pushTrimmedCandidate(candidates, text, startOffset, match.index);
    startOffset = match.index + match[0].length;
  }

  pushTrimmedCandidate(candidates, text, startOffset, text.length);
  return candidates;
}

function splitLongCandidate(text: string, candidate: SpanCandidate): readonly SpanCandidate[] {
  const candidates: SpanCandidate[] = [];
  const pending: SpanCandidate[] = [candidate];

  while (pending.length > 0) {
    const current = pending.shift();

    if (!current) {
      break;
    }

    if (current.endOffset - current.startOffset <= MAX_SPAN_LENGTH) {
      candidates.push(current);
      continue;
    }

    const splitOffset = findSplitOffset(text, current);
    const left = trimCandidate(text, current.startOffset, splitOffset);
    const right = trimCandidate(text, splitOffset, current.endOffset);

    if (left) {
      candidates.push(left);
    }

    if (right) {
      pending.unshift(right);
    }
  }

  return candidates;
}

function findSplitOffset(text: string, candidate: SpanCandidate): number {
  const searchEnd = candidate.startOffset + MAX_SPAN_LENGTH;
  const slice = text.slice(candidate.startOffset, searchEnd);
  const sentenceOffset = findLastSentenceBoundary(slice);

  if (sentenceOffset > 0) {
    return candidate.startOffset + sentenceOffset;
  }

  const whitespaceOffset = findLastWhitespaceBoundary(slice);

  if (whitespaceOffset > 0) {
    return candidate.startOffset + whitespaceOffset;
  }

  return searchEnd;
}

function findLastSentenceBoundary(text: string): number {
  const pattern = /[.!?](?:["')\]]+)?\s+/g;
  let boundary = -1;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    boundary = match.index + match[0].length;
  }

  return boundary;
}

function findLastWhitespaceBoundary(text: string): number {
  for (let index = text.length - 1; index > 0; index -= 1) {
    if (/\s/.test(text[index] ?? "")) {
      return index + 1;
    }
  }

  return -1;
}

function pushTrimmedCandidate(candidates: SpanCandidate[], text: string, startOffset: number, endOffset: number) {
  const candidate = trimCandidate(text, startOffset, endOffset);

  if (candidate) {
    candidates.push(candidate);
  }
}

function trimCandidate(text: string, startOffset: number, endOffset: number): SpanCandidate | null {
  let trimmedStart = startOffset;
  let trimmedEnd = endOffset;

  while (trimmedStart < trimmedEnd && /\s/.test(text[trimmedStart] ?? "")) {
    trimmedStart += 1;
  }

  while (trimmedEnd > trimmedStart && /\s/.test(text[trimmedEnd - 1] ?? "")) {
    trimmedEnd -= 1;
  }

  if (trimmedStart >= trimmedEnd) {
    return null;
  }

  return { startOffset: trimmedStart, endOffset: trimmedEnd };
}
