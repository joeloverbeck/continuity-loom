import type { ValidationSnapshot } from "../validation/snapshot.js";
import { estimatePromptTokens, fingerprintPrompt } from "./fingerprint.js";
import { resolvePlaceholder } from "./placeholder-map.js";
import {
  COMPOSITE_SECTION_TEMPLATES,
  SECTION_ORDER,
  SECTION_TEMPLATES,
  type CompositeSectionId,
  type PromptSectionId
} from "./template-constants.js";
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
    ...SECTION_ORDER.map((sectionId) => renderSection(sectionId, snapshot))
  ].join("\n\n");
}

function renderSection(sectionId: PromptSectionId, snapshot: ValidationSnapshot): string {
  if (isCompositeSectionId(sectionId)) {
    return renderCompositeSection(sectionId, snapshot);
  }

  const template = SECTION_TEMPLATES[sectionId];
  return template.replace(placeholderPattern, (_match, placeholder: string) =>
    resolvePlaceholder(placeholder, snapshot)
  );
}

function renderCompositeSection(sectionId: CompositeSectionId, snapshot: ValidationSnapshot): string {
  const template = COMPOSITE_SECTION_TEMPLATES[sectionId];
  const blocks = template.subBlocks
    .map((block) => {
      const content = resolvePlaceholder(block.placeholder, snapshot).trim();
      return content ? `${block.label}:\n${content}` : "";
    })
    .filter(Boolean);
  const body = blocks.join("\n\n") || template.emptyState;

  return `<${sectionId}>\n${body}\n</${sectionId}>`;
}

function isCompositeSectionId(sectionId: PromptSectionId): sectionId is CompositeSectionId {
  return Object.hasOwn(COMPOSITE_SECTION_TEMPLATES, sectionId);
}
