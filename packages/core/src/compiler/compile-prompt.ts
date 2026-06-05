import type { ValidationSnapshot } from "../validation/snapshot.js";
import { estimatePromptTokens, fingerprintPrompt } from "./fingerprint.js";
import { resolvePlaceholder } from "./placeholder-map.js";
import { SECTION_ORDER, SECTION_TEMPLATES } from "./template-constants.js";
import type { CompileResult } from "./types.js";

const placeholderPattern = /\{([a-zA-Z0-9_]+)\}/g;

export { SECTION_ORDER };

export function compilePrompt(snapshot: ValidationSnapshot): CompileResult {
  const prompt = renderPrompt(snapshot);

  return {
    prompt,
    metadata: {
      versions: snapshot.versions,
      fingerprint: fingerprintPrompt(prompt),
      lengthEstimate: prompt.length,
      tokenEstimate: estimatePromptTokens(prompt)
    }
  };
}

function renderPrompt(snapshot: ValidationSnapshot): string {
  return [
    "# Generated Prose Prompt",
    "",
    ...SECTION_ORDER.map((sectionId) => renderSection(SECTION_TEMPLATES[sectionId], snapshot))
  ].join("\n\n");
}

function renderSection(template: string, snapshot: ValidationSnapshot): string {
  return template.replace(placeholderPattern, (_match, placeholder: string) =>
    resolvePlaceholder(placeholder, snapshot)
  );
}
