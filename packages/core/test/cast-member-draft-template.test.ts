import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  CAST_MEMBER_DRAFT_PROMPT,
  CAST_MEMBER_DRAFT_PROMPT_VERSION,
  getEditorDescriptor,
  versionInfo,
  type FieldDescriptor
} from "../src/index.js";

const authorityDoc = readFileSync(
  new URL("../../../docs/specs/cast-member-draft-prompt-template.md", import.meta.url),
  "utf8"
);

function copyableTemplateFromDoc(): string {
  const match = authorityDoc.match(
    /<!-- CAST_MEMBER_DRAFT_PROMPT_START -->\n````text\n([\s\S]*?)\n````\n<!-- CAST_MEMBER_DRAFT_PROMPT_END -->/
  );

  if (!match?.[1]) {
    throw new Error("The Cast Member draft prompt authority markers are malformed.");
  }

  return match[1];
}

function schemaFieldPaths(fields: readonly FieldDescriptor[], parent = ""): string[] {
  return fields.flatMap((field) => {
    const path = parent ? `${parent}.${field.name}` : field.name;

    if (field.kind === "nested_group") {
      return schemaFieldPaths(field.fields ?? [], path);
    }

    if (field.kind === "list" && field.itemDescriptor?.fields) {
      return schemaFieldPaths(field.itemDescriptor.fields, `${path}[]`);
    }

    return [path];
  });
}

function missingSchemaPaths(template: string): string[] {
  const descriptor = getEditorDescriptor("CAST MEMBER");

  if (!descriptor) {
    throw new Error("CAST MEMBER editor descriptor is not registered.");
  }

  return schemaFieldPaths(descriptor.fields).filter((path) => !template.includes(path));
}

describe("Cast Member draft prompt template", () => {
  it("exposes one deterministic independently versioned template that matches its authority doc", () => {
    expect(CAST_MEMBER_DRAFT_PROMPT_VERSION).toBe("1.0.0");
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain(
      `Template version: ${CAST_MEMBER_DRAFT_PROMPT_VERSION}`
    );
    expect(CAST_MEMBER_DRAFT_PROMPT).toBe(copyableTemplateFromDoc());

    expect(versionInfo.templates.version).toBe("1.10.0");
    expect(versionInfo.compiler.version).toBe("1.12.0");
    expect(versionInfo.contract.version).toBe("1.13.0");
  });

  it("covers every registered CAST MEMBER schema field and detects a missing leaf", () => {
    expect(missingSchemaPaths(CAST_MEMBER_DRAFT_PROMPT)).toEqual([]);

    const withoutSampleCopyPolicy = CAST_MEMBER_DRAFT_PROMPT.replaceAll(
      "sample_utterances[].copy_policy",
      ""
    );
    expect(missingSchemaPaths(withoutSampleCopyPolicy)).toContain(
      "sample_utterances[].copy_policy"
    );
  });

  it("pins the invention, output, and record-free clipboard boundaries", () => {
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain("invent character-fitting material");
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain("exactly one fenced JSON object");
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain("Never emit entity_id");
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain("Never emit unknown keys");
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain("uncertainties");
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain("invented_fields");
    expect(CAST_MEMBER_DRAFT_PROMPT).toContain(
      "This static prompt contains no Continuity Loom project records"
    );
  });
});
