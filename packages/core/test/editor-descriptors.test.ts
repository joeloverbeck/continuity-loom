import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  deriveDisplayLabel,
  eligibleReferenceTargets,
  getEditorDescriptor,
  getEditorFormSchema,
  recordTypes,
  referenceTargetTypes
} from "../src/index.js";
import { recordTypeRegistry } from "../src/records/registry.js";

const knownKinds = new Set(["short_string", "prose", "enum", "reference", "list", "nested_group", "boolean", "number"]);

function schemaDefinition(schema: z.ZodType): Record<string, unknown> {
  return (schema as unknown as { _def?: Record<string, unknown>; def?: Record<string, unknown> })._def
    ?? (schema as unknown as { def?: Record<string, unknown> }).def
    ?? {};
}

function unwrapSchema(schema: z.ZodType): z.ZodType {
  let current = schema;

  while (schemaDefinition(current).type === "optional" || schemaDefinition(current).type === "default") {
    current = schemaDefinition(current).innerType as z.ZodType;
  }

  return current;
}

function objectKeys(schema: z.ZodType): string[] {
  const shape = schemaDefinition(unwrapSchema(schema)).shape as
    | Record<string, z.ZodType>
    | (() => Record<string, z.ZodType>);
  const resolved = typeof shape === "function" ? shape() : shape;

  return Object.keys(resolved);
}

describe("record editor descriptors", () => {
  it("defines descriptors whose top-level fields match every registry payload schema except system-managed id", () => {
    for (const recordType of recordTypes) {
      const descriptor = getEditorDescriptor(recordType);
      const registryEntry = recordTypeRegistry[recordType]!;
      const expectedFieldNames = objectKeys(registryEntry.payloadSchema).filter((name) => name !== "id");

      expect(descriptor?.recordType).toBe(recordType);
      expect(descriptor?.fields.map((field) => field.name).sort()).toEqual(expectedFieldNames.sort());
    }
  });

  it("omits only the record id from id-bearing descriptors", () => {
    for (const recordType of recordTypes) {
      const schemaFieldNames = objectKeys(recordTypeRegistry[recordType]!.payloadSchema);
      const descriptorFieldNames = getEditorDescriptor(recordType)?.fields.map((field) => field.name) ?? [];

      expect(descriptorFieldNames).not.toContain("id");

      if (schemaFieldNames.includes("id")) {
        expect(descriptorFieldNames).toHaveLength(schemaFieldNames.length - 1);
      } else {
        expect(descriptorFieldNames).toHaveLength(schemaFieldNames.length);
      }
    }
  });

  it("provides id-free form schemas while leaving reference fields renderable", () => {
    expect(() =>
      getEditorFormSchema("ENTITY")?.parse({
        display_name: "Ane Arrieta",
        entity_kind: "person",
        roles_in_story: ["viewpoint"],
        short_description: "A field medic carrying a promise she cannot safely explain."
      })
    ).not.toThrow();

    expect(getEditorDescriptor("CAST MEMBER")?.fields.find((field) => field.name === "entity_id")).toMatchObject({
      kind: "reference",
      referenceRole: "entity_id"
    });
    expect(getEditorDescriptor("ENTITY STATUS")?.fields.find((field) => field.name === "entity_id")).toMatchObject({
      kind: "reference",
      referenceRole: "entity_id"
    });
  });

  it("covers CAST MEMBER core and extended nested fields", () => {
    const descriptor = getEditorDescriptor("CAST MEMBER");
    const fieldsByName = new Map(descriptor?.fields.map((field) => [field.name, field]));

    expect(fieldsByName.get("entity_id")).toMatchObject({ kind: "reference", referenceRole: "entity_id" });
    expect(fieldsByName.get("identity")?.fields?.map((field) => field.name)).toEqual([
      "one_line",
      "public_face",
      "private_pressure"
    ]);
    expect(fieldsByName.get("voice_anchor")?.fields?.map((field) => field.name)).toContain("anti_repetition_warnings");
    expect(fieldsByName.get("voice_extended")?.fields?.map((field) => field.name)).toEqual([
      "intimacy",
      "anger",
      "lying",
      "register_switching",
      "humor_or_irony_style",
      "idiom_or_sociolect_notes",
      "anti_generic_warnings"
    ]);
    expect(fieldsByName.get("sample_utterances")).toMatchObject({ kind: "list" });
    expect(fieldsByName.get("sample_utterances")?.itemDescriptor?.fields?.map((field) => field.name)).toContain(
      "speech_function"
    );
  });

  it("classifies every descriptor field with total kind and boolean metadata", () => {
    const visit = (field: NonNullable<ReturnType<typeof getEditorDescriptor>>["fields"][number]) => {
      expect(knownKinds.has(field.kind)).toBe(true);
      expect(typeof field.required).toBe("boolean");
      expect(typeof field.promptFacing).toBe("boolean");

      for (const child of field.fields ?? []) {
        visit(child);
      }

      if (field.itemDescriptor) {
        visit(field.itemDescriptor);
      }
    };

    for (const recordType of recordTypes) {
      getEditorDescriptor(recordType)?.fields.forEach(visit);
    }
  });

  it("derives display labels from representative payloads", () => {
    expect(deriveDisplayLabel("ENTITY", { display_name: "Rhea Vale" })).toBe("Rhea Vale");
    expect(
      deriveDisplayLabel("CAST MEMBER", {
        identity: { one_line: "Ane Arrieta, 18, a self-employed sex worker." }
      })
    ).toBe("Ane Arrieta, 18, a self-employed sex worker.");
    expect(deriveDisplayLabel("CAST MEMBER", { entity_id: "entity-ane" })).toBe("entity-ane");
    expect(deriveDisplayLabel("FACT", { statement: "A very old promise controls the west gate." })).toBe(
      "A very old promise controls the west gate."
    );
    expect(deriveDisplayLabel("UNKNOWN", {})).toBe("Unknown");
  });

  it("returns eligible reference targets by role in stable order", () => {
    const records = [
      { id: "3", type: "LOCATION", displayLabel: "Vault" },
      { id: "2", type: "ENTITY", displayLabel: "Zed" },
      { id: "1", type: "ENTITY", displayLabel: "Ada" },
      { id: "4", type: "ENTITY", displayLabel: "Hidden", archived: true }
    ];

    expect(referenceTargetTypes("holder")).toEqual(["ENTITY"]);
    expect(eligibleReferenceTargets("holder", records).map((record) => record.id)).toEqual(["1", "2"]);
    expect(eligibleReferenceTargets("current_location", records).map((record) => record.id)).toEqual(["3"]);
    expect(eligibleReferenceTargets("missing_role", records)).toEqual([]);
  });
});
