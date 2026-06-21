import type { ValidationSnapshot } from "../validation/snapshot.js";

export interface CompileMetadata {
  versions: ValidationSnapshot["versions"];
  fingerprint: string;
  lengthEstimate: number;
  tokenEstimate: number;
  countsByType?: Readonly<Record<string, number>>;
  citationMap?: Readonly<Record<string, string>>;
}

export interface CompileResult {
  prompt: string;
  metadata: CompileMetadata;
}

export interface PlaceholderResolver {
  placeholder: string;
  required: boolean;
  missingBehavior: "block" | "warn" | "omit" | "none";
  emptyState: string;
  resolve(snapshot: ValidationSnapshot): string;
}
