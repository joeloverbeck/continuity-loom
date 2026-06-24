import { describe, expect, it } from "vitest";
import { z } from "zod";

import { buildSegmentReconciliationSchemaCatalog } from "../src/compiler/reconciliation/schema-catalog.js";
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
    expect(catalog.recordTypes.map((entry) => entry.recordType)).toEqual(recordTypes);

    for (const entry of catalog.recordTypes) {
      expect(entry.payloadJsonSchema).toMatchObject({ type: "object" });
      expect(entry.repositoryManagedFields).toEqual(["id"]);
      expect(entry.forbiddenOutputFields).toEqual(["id"]);
      expect(entry.lifecycle.legalValues).toEqual(recordTypeRegistry[entry.recordType]?.statusValues ?? []);
    }
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
    const catalog = buildSegmentReconciliationSchemaCatalog("1.10.0");
    const destinations = Object.fromEntries(
      catalog.recordTypes.map((entry) => [entry.recordType, entry.lifecycle.allowedDeactivationDestinations])
    );

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
