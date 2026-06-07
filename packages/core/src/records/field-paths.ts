export interface FieldPathSegment {
  name: string;
  list?: boolean;
}

const numericSegmentPattern = /(?:^|\.)\d+(?=\.|$)/;
const bracketIndexPattern = /\[\d+]/;
const domGeneratedIdPattern = /(?:^|\.)(?:field|dom)-[A-Za-z0-9_-]+(?=\.|$)/;

export function buildFieldPath(ownerKind: string, segments: ReadonlyArray<FieldPathSegment>): string {
  return [
    ownerKind,
    ...segments.map((segment) => `${segment.name}${segment.list === true ? "[]" : ""}`)
  ].join(".");
}

export function normalizeListIndices(path: string): string {
  return path.replace(/\.\d+(?=\.|$)/g, "[]");
}

export function isCanonicalFieldPath(path: string): boolean {
  return !numericSegmentPattern.test(path) && !bracketIndexPattern.test(path) && !domGeneratedIdPattern.test(path);
}

export function assertCanonical(path: string): void {
  if (!isCanonicalFieldPath(path)) {
    throw new Error(`Non-canonical field path: ${path}`);
  }
}
