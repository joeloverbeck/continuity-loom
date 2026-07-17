import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  allowedDeactivationDestinationsFor,
  buildSegmentReconciliationSchemaCatalog,
  renderSegmentReconciliationSchemaCatalog
} from "../src/compiler/reconciliation/schema-catalog.js";
import {
  EMPTY_RECONCILIATION_RECORDS_TEXT,
  canonicalEscapedJson,
  renderReconciliationRecordSet
} from "../src/compiler/reconciliation/record-renderer.js";
import type { ReconciliationRecord, ReconciliationReferenceStub } from "../src/compiler/reconciliation/types.js";
import { demoRecords } from "../src/demo/index.js";
import { parseRecordPayload, recordTypeRegistry, recordTypes } from "../src/records/registry.js";

describe("segment reconciliation schema catalog", () => {
  it("derives the registered type set and schemas from the record registry", () => {
    const catalog = buildSegmentReconciliationSchemaCatalog("1.10.0");

    expect(catalog.catalogVersion).toBe("1.10.0");
    expect(catalog.grammar).toBe("segment_reconciliation.schema_catalog.v1");
    expect(catalog.uuidPattern).toMatch(/^\^\(/);
    expect(catalog.recordTypes.map((entry) => entry.recordType)).toEqual(recordTypes);

    for (const entry of catalog.recordTypes) {
      expect(entry).not.toHaveProperty("payloadJsonSchema");
      expect(entry.fields.length).toBeGreaterThan(0);
      const payloadId = entry.fields.find((field) => field.path === "id");
      const envelopeId = entry.repositoryFields.find((field) => field.path === "id");
      expect([payloadId, envelopeId].filter(Boolean)).toHaveLength(1);
      expect(payloadId ?? envelopeId).toMatchObject({ repositoryManaged: true, forbiddenOutput: true });

      const legalValues = recordTypeRegistry[entry.recordType]?.statusValues ?? [];
      if (entry.lifecycle.kind === "field") {
        expect(entry.fields.find((field) => field.deactivationDestinations)?.shape).toBe(
          `enum(${JSON.stringify(legalValues)})`
        );
      } else if (entry.lifecycle.kind === "projected") {
        expect(entry.lifecycle.legalValues).toEqual(legalValues);
      } else {
        expect(legalValues).toEqual([]);
      }
    }
  });

  it("uses one compact field representation instead of parallel JSON Schema and descriptors", () => {
    const catalog = buildSegmentReconciliationSchemaCatalog("1.10.0");
    const entity = catalog.recordTypes.find((entry) => entry.recordType === "ENTITY") as unknown as {
      payloadJsonSchema?: unknown;
      fields: readonly unknown[];
    };

    expect(entity).not.toHaveProperty("payloadJsonSchema");
    expect(entity.fields).toContainEqual({
      path: "id",
      presence: "required",
      shape: "uuid",
      repositoryManaged: true,
      forbiddenOutput: true
    });
  });

  it("preserves validator input optionality alongside registered defaults", () => {
    const catalog = buildSegmentReconciliationSchemaCatalog("1.10.0");
    const planResources = catalog.recordTypes
      .find((entry) => entry.recordType === "PLAN")
      ?.fields.find((field) => field.path === "resources");
    const sampleCopyPolicy = catalog.recordTypes
      .find((entry) => entry.recordType === "CAST MEMBER")
      ?.fields.find((field) => field.path === "sample_utterances[].copy_policy");

    expect(planResources).toMatchObject({ presence: "optional", defaultValue: [] });
    expect(sampleCopyPolicy).toMatchObject({ presence: "optional", defaultValue: "never_copy_verbatim" });
  });

  it("covers each registered path once with shapes, references, lifecycle, and management attached", () => {
    const catalog = buildSegmentReconciliationSchemaCatalog("1.10.0");

    for (const entry of catalog.recordTypes) {
      expect(new Set(entry.fields.map((field) => field.path)).size).toBe(entry.fields.length);
    }

    expect(field(catalog, "CAST MEMBER", "sample_utterances")).toMatchObject({
      presence: "optional",
      shape: "list(object(closed))"
    });
    expect(field(catalog, "EVENT", "sequence_order")?.shape).toBe(
      'union(number|text(min=1)|literal("unknown"))'
    );
    expect(field(catalog, "OBJECT", "owner")?.reference).toEqual({
      cardinality: "one",
      refRole: "owner",
      targetTypes: ["ENTITY"]
    });
    expect(field(catalog, "EVENT", "causes")?.reference).toEqual({
      cardinality: "many",
      refRole: "record_link",
      targetTypes: recordTypes
    });
    expect(field(catalog, "CONSEQUENCE", "holder_or_target")?.reference).toEqual({
      cardinality: "one_or_many",
      refRole: "holder_or_target",
      targetTypes: ["ENTITY"]
    });
    expect(field(catalog, "PLAN", "plan_status")).toMatchObject({
      shape: 'enum(["active","blocked","suspended","fulfilled","failed","abandoned","revised"])',
      deactivationDestinations: ["fulfilled", "failed", "abandoned", "revised"]
    });
    expect(catalog.recordTypes.find((entry) => entry.recordType === "FACT")?.lifecycle).toEqual({
      kind: "projected",
      legalValues: ["active"]
    });
  });

  it("represents boolean, number, literal, union, nested, default, and escaped values generically", () => {
    const syntheticSchema = z.object({
      id: z.uuid(),
      enabled: z.boolean(),
      weight: z.number(),
      choice: z.union([z.literal("one"), z.array(z.string().min(1))]),
      details: z.object({ note: z.string().min(1) }).strict().optional(),
      unsafe_default: z.string().default("<tag>&value")
    }).strict();
    const catalog = buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        SYNTHETIC: {
          recordType: "SYNTHETIC",
          payloadSchema: syntheticSchema,
          extractReferences: () => []
        }
      },
      ["SYNTHETIC"],
      { SYNTHETIC: [] }
    );
    const rendered = renderSegmentReconciliationSchemaCatalog(catalog);

    expect(field(catalog, "SYNTHETIC", "enabled")?.shape).toBe("boolean");
    expect(field(catalog, "SYNTHETIC", "weight")?.shape).toBe("number");
    expect(field(catalog, "SYNTHETIC", "choice")?.shape).toBe('union(literal("one")|list(text(min=1)))');
    expect(field(catalog, "SYNTHETIC", "details")?.shape).toBe("object(closed)");
    expect(field(catalog, "SYNTHETIC", "details.note")?.shape).toBe("text(min=1)");
    expect(field(catalog, "SYNTHETIC", "unsafe_default")).toMatchObject({
      presence: "optional",
      defaultValue: "<tag>&value"
    });
    expect(rendered).toContain('default="\\u003ctag\\u003e\\u0026value"');
  });

  it("fails closed when a future validator adds an unsupported open-object constraint", () => {
    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        SYNTHETIC: {
          recordType: "SYNTHETIC",
          payloadSchema: z.object({ id: z.uuid(), attributes: z.record(z.string(), z.string()) }).strict(),
          extractReferences: () => []
        }
      },
      ["SYNTHETIC"],
      { SYNTHETIC: [] }
    )).toThrow("Unsupported schema keyword(s) for SYNTHETIC.attributes: propertyNames");
  });

  it("fails closed when reference descriptor metadata has no UUID-bearing schema", () => {
    const fauxUuid = z.string() as z.ZodString & { format: string };
    fauxUuid.format = "uuid";

    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        OWNER: {
          recordType: "OWNER",
          payloadSchema: z.object({ owner: fauxUuid }).strict(),
          extractReferences: () => []
        }
      },
      ["OWNER"],
      { OWNER: [] }
    )).toThrow("Reference field OWNER.owner has no UUID-bearing shape");
  });

  it("round-trips representative demo payloads through the authoritative registry parser", () => {
    const recordsByType = new Map(demoRecords.map((record) => [record.type, record]));

    expect(recordsByType.size).toBeGreaterThan(0);

    for (const [recordType, record] of recordsByType) {
      expect(recordTypes).toContain(recordType);
      expect(() => parseRecordPayload(recordType, record.payload)).not.toThrow();
    }
  });

  it("declares the signed-off lifecycle deactivation destinations", () => {
    buildSegmentReconciliationSchemaCatalog("1.10.0");
    const destinations = Object.fromEntries(recordTypes.map((recordType) => [
      recordType,
      allowedDeactivationDestinationsFor(recordType)
    ]));

    expect(destinations).toMatchObject({
      ENTITY: [],
      BELIEF: ["resolved", "abandoned"],
      SECRET: ["disproven", "abandoned"],
      OBJECT: ["lost", "destroyed", "transferred", "inactive"],
      PLAN: ["fulfilled", "failed", "abandoned", "revised"],
      EMOTION: ["settled"]
    });
  });

  it("fails closed when a registered type cannot be represented", () => {
    expect(() =>
      buildSegmentReconciliationSchemaCatalog(
        "1.10.0",
        {
          EMPTY: {
            recordType: "EMPTY",
            payloadSchema: z.object({}).strict(),
            extractReferences: () => []
          }
        },
        ["EMPTY"]
      )
    ).toThrow("No fields represented for EMPTY");
  });

  it("fails closed on registry and lifecycle metadata drift", () => {
    const one = {
      recordType: "ONE",
      payloadSchema: z.object({ id: z.uuid() }).strict(),
      extractReferences: () => []
    };

    expect(() => buildSegmentReconciliationSchemaCatalog("synthetic", { ONE: one }, ["ONE", "ONE"])).toThrow(
      "Duplicate record type"
    );
    expect(() => buildSegmentReconciliationSchemaCatalog("synthetic", { ONE: one }, ["MISSING"])).toThrow(
      "Missing registry definition for MISSING"
    );
    expect(() => buildSegmentReconciliationSchemaCatalog("synthetic", { ONE: one, TWO: one }, ["ONE"])).toThrow(
      "Registry types omitted"
    );
    expect(() => buildSegmentReconciliationSchemaCatalog("synthetic", { ONE: one }, ["ONE"], {})).toThrow(
      "Missing lifecycle metadata for ONE"
    );
    expect(() =>
      buildSegmentReconciliationSchemaCatalog("synthetic", { ONE: one }, ["ONE"], { ONE: ["inactive"] })
    ).toThrow("Lifecycle destinations have no lifecycle field for ONE");
  });

  it("fails closed on unsupported formats, open roots, and lifecycle disagreement", () => {
    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        OPEN: {
          recordType: "OPEN",
          payloadSchema: z.object({ id: z.uuid() }).passthrough(),
          extractReferences: () => []
        }
      },
      ["OPEN"],
      { OPEN: [] }
    )).toThrow("Schema object must be closed for OPEN");

    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        EMAIL: {
          recordType: "EMAIL",
          payloadSchema: z.object({ id: z.uuid(), address: z.email() }).strict(),
          extractReferences: () => []
        }
      },
      ["EMAIL"],
      { EMAIL: [] }
    )).toThrow("Unsupported string format for EMAIL.address");

    const statusSchema = z.object({ id: z.uuid(), status: z.enum(["active", "resolved"]) }).strict();
    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        STATUS: {
          recordType: "STATUS",
          payloadSchema: statusSchema,
          extractReferences: () => []
        }
      },
      ["STATUS"],
      { STATUS: [] }
    )).toThrow("Lifecycle field status has no legal values for STATUS");
    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        STATUS: {
          recordType: "STATUS",
          payloadSchema: statusSchema,
          statusValues: ["active", "resolved"],
          extractReferences: () => []
        }
      },
      ["STATUS"],
      { STATUS: ["illegal"] }
    )).toThrow("Illegal deactivation destination illegal for STATUS");
    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        STATUS: {
          recordType: "STATUS",
          payloadSchema: statusSchema,
          statusValues: ["active"],
          extractReferences: () => []
        }
      },
      ["STATUS"],
      { STATUS: [] }
    )).toThrow("Lifecycle legal values disagree with status for STATUS");
    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        UUIDS: {
          recordType: "UUIDS",
          payloadSchema: z.object({ id: z.uuidv4(), related_id: z.uuidv7() }).strict(),
          extractReferences: () => []
        }
      },
      ["UUIDS"],
      { UUIDS: [] }
    )).toThrow("Multiple UUID patterns are not representable for UUIDS.related_id");
    expect(() => buildSegmentReconciliationSchemaCatalog(
      "synthetic",
      {
        UUID_MIN: {
          recordType: "UUID_MIN",
          payloadSchema: z.object({ id: z.uuid().min(50) }).strict(),
          extractReferences: () => []
        }
      },
      ["UUID_MIN"],
      { UUID_MIN: [] }
    )).toThrow("Unsupported UUID constraint(s) for UUID_MIN.id: minLength");
  });
});

describe("segment reconciliation record renderer", () => {
  it("renders records deterministically with escaped canonical JSON", () => {
    const records: ReconciliationRecord[] = [
      record("object-2", "OBJECT", "B object", { id: "object-2", label: "B <object>", status: "active" }),
      record("entity-1", "ENTITY", "A entity", {
        id: "entity-1",
        display_name: "A & entity",
        entity_kind: "person",
        roles_in_story: ["primary_actor"],
        short_description: "A > B"
      })
    ];

    const rendered = renderReconciliationRecordSet(records, []);

    expect([...rendered.recordKeys.entries()]).toEqual([
      ["entity-1", "[ENTITY-1]"],
      ["object-2", "[OBJECT-1]"]
    ]);
    expect(rendered.recordsText.indexOf("entity-1")).toBeLessThan(rendered.recordsText.indexOf("object-2"));
    expect(rendered.recordsText).toContain("\\u003c");
    expect(rendered.recordsText).toContain("\\u003e");
    expect(rendered.recordsText).toContain("\\u0026");
  });

  it("renders an explicit empty state when no full records qualify", () => {
    const rendered = renderReconciliationRecordSet([], []);

    expect(rendered.recordsText).toBe(EMPTY_RECONCILIATION_RECORDS_TEXT);
  });

  it("renders reference stubs without out-of-scope payload fields", () => {
    const stubs: ReconciliationReferenceStub[] = [
      {
        id: "entity-1",
        type: "ENTITY",
        displayLabel: "Referenced entity"
      }
    ];
    const rendered = renderReconciliationRecordSet([], stubs);

    expect(rendered.referenceStubsText).toContain("Referenced entity");
    expect(rendered.referenceStubsText).not.toContain("payload");
    expect(rendered.referenceStubsText).not.toContain("short_description");
  });

  it("sorts JSON object keys before escaping data blocks", () => {
    expect(canonicalEscapedJson({ z: "<last>", a: "&first" })).toBe(
      ['{', '  "a": "\\u0026first",', '  "z": "\\u003clast\\u003e"', '}'].join("\n")
    );
  });
});

function record(id: string, type: string, displayLabel: string, payload: unknown): ReconciliationRecord {
  return {
    id,
    type,
    displayLabel,
    payload
  };
}

function field(
  catalog: ReturnType<typeof buildSegmentReconciliationSchemaCatalog>,
  recordType: string,
  path: string
) {
  return catalog.recordTypes.find((entry) => entry.recordType === recordType)?.fields.find((entry) => entry.path === path);
}
