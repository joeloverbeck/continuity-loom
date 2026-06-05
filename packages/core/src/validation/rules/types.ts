import type { Diagnostic } from "../types.js";
import type { ValidationSnapshot } from "../snapshot.js";

export type ValidationRule = (snapshot: ValidationSnapshot) => readonly Diagnostic[];
