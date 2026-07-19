import { describe, expect, it } from "vitest";

import {
  SEGMENT_RECONCILIATION_OUTPUT_CONTRACT,
  RECONCILIATION_BRIEF_FIELD_PATHS,
  briefFieldCitationKey,
  parseSegmentReconciliationOutput,
  segmentReconciliationOutputJsonSchema
} from "../src/index.js";
import type { SegmentReconciliationParseContext } from "../src/index.js";

const entityId = "019b0298-5c00-7000-8000-000000000101";

describe("segment reconciliation output schema", () => {
  it("declares additionalProperties false at every object layer", () => {
    const schema = segmentReconciliationOutputJsonSchema();
    const objectSchemas = collectObjectSchemas(schema);

    expect(objectSchemas.length).toBeGreaterThan(5);
    for (const objectSchema of objectSchemas) {
      expect(objectSchema.additionalProperties).toBe(false);
    }
  });
});

describe("segment reconciliation output parser", () => {
  it("accepts valid brief, record-change, and creation proposals", () => {
    const parsed = parseSegmentReconciliationOutput(JSON.stringify(validOutput()), context());

    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.output.briefProposals).toHaveLength(1);
      expect(parsed.output.recordChangeProposals[0]?.lifecycleDestination).toBe("abandoned");
      expect(parsed.output.recordCreationProposals[0]?.recordType).toBe("FACT");
    }
  });

  it("accepts a structurally valid all-empty proposal result", () => {
    const parsed = parseSegmentReconciliationOutput(JSON.stringify({
      ...validOutput(),
      brief_proposals: [],
      record_change_proposals: [],
      record_creation_proposals: []
    }), context());

    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.output.briefProposals).toEqual([]);
      expect(parsed.output.recordChangeProposals).toEqual([]);
      expect(parsed.output.recordCreationProposals).toEqual([]);
    }
  });

  it.each([
    ["not-pure-json", "before {\"x\":true}", "not-pure-json"],
    ["schema-mismatch", JSON.stringify({ ...validOutput(), extra: true }), "schema-mismatch"],
    [
      "source-mismatch",
      JSON.stringify({ ...validOutput(), source: { ...validOutput().source, prompt_fingerprint: "stale" } }),
      "source-mismatch"
    ],
    [
      "unknown-citation",
      JSON.stringify({
        ...validOutput(),
        brief_proposals: [{ ...validOutput().brief_proposals[0], evidence: ["[SEG-3-S999]"] }]
      }),
      "unknown-citation"
    ],
    [
      "invalid-brief-path",
      JSON.stringify({
        ...validOutput(),
        brief_proposals: [{ ...validOutput().brief_proposals[0], field_path: "manual_moment_directive.must_render" }]
      }),
      "invalid-brief-path"
    ],
    [
      "invalid-lifecycle-destination",
      JSON.stringify({
        ...validOutput(),
        record_change_proposals: [{ ...validOutput().record_change_proposals[0], lifecycle_destination: "destroyed" }]
      }),
      "invalid-lifecycle-destination"
    ],
    [
      "invalid-enum post-patch payload",
      JSON.stringify(recordUpdateOutput([{ op: "replace", path: "/salience", value: "urgent" }])),
      "invalid-enum"
    ],
    [
      "invalid-record-payload post-patch payload",
      JSON.stringify(recordUpdateOutput([{ op: "remove", path: "/claim", value: null }])),
      "invalid-record-payload"
    ],
    [
      "invalid-patch immutable id",
      JSON.stringify(recordUpdateOutput([{ op: "replace", path: "/id", value: "019b0298-5c00-7000-8000-000000000999" }])),
      "invalid-patch"
    ],
    [
      "invalid-patch missing pointer",
      JSON.stringify(recordUpdateOutput([{ op: "replace", path: "/missing_field", value: "nope" }])),
      "invalid-patch"
    ],
    [
      "invalid-enum",
      JSON.stringify(invalidEnumOutput()),
      "invalid-enum"
    ],
    [
      "cyclic-creation-dependency",
      JSON.stringify({
        ...validOutput(),
        record_creation_proposals: [
          { ...validOutput().record_creation_proposals[0], id: "NEW-001", dependencies: ["NEW-002"] },
          { ...validOutput().record_creation_proposals[0], id: "NEW-002", dependencies: ["NEW-001"] }
        ]
      }),
      "cyclic-creation-dependency"
    ]
  ])("quarantines %s as a full malformed response", (_name, raw, reasonCode) => {
    const parsed = parseSegmentReconciliationOutput(raw, context());

    expect(parsed).toMatchObject({
      status: "malformed",
      reasonCode,
      rawOutput: raw
    });
  });

  it("resolves reference tokens and rejects raw UUID references", () => {
    const beliefOutput = {
      ...validOutput(),
      record_creation_proposals: [
        {
          id: "NEW-001",
          record_type: "BELIEF",
          payload: {
            status: "active",
            holder: "$record:[ENTITY-1]",
            claim: "Niko believes the key matters.",
            belief_mode: "believes",
            truth_relation: "unknown",
            confidence: "medium",
            visibility: "private",
            access_route: "direct_observation",
            behavioral_effect: "He watches the cellar door.",
            salience: "medium"
          },
          dependencies: [],
          evidence: ["[SEG-3-S001]"],
          contrast: ["[ENTITY-1]"],
          rationale: "Belief changed."
        }
      ]
    };
    const parsed = parseSegmentReconciliationOutput(JSON.stringify(beliefOutput), context());
    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.output.recordCreationProposals[0]?.payload).toMatchObject({ holder: entityId });
    }

    const rawUuid = rawUuidOutput(beliefOutput);
    expect(parseSegmentReconciliationOutput(JSON.stringify(rawUuid), context())).toMatchObject({
      status: "malformed",
      reasonCode: "invalid-reference"
    });
  });

  it("accepts schema-valid record patches without mutating the source record payload", () => {
    const parseContext = context();
    const beforePayload = structuredClone(parseContext.records[1]?.payload);
    const raw = JSON.stringify(recordUpdateOutput([{ op: "replace", path: "/claim", value: "Niko knows Elin handed over the key." }]));
    const parsed = parseSegmentReconciliationOutput(raw, parseContext);

    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.output.recordChangeProposals).toHaveLength(1);
      expect(parsed.output.recordChangeProposals[0]?.patches).toEqual([
        { op: "replace", path: "/claim", value: "Niko knows Elin handed over the key." }
      ]);
    }
    expect(parseContext.records[1]?.payload).toEqual(beforePayload);
  });

  it("quarantines the full response for material accepted-prose echo but allows short names", () => {
    const echoOutput = {
      ...validOutput(),
      brief_proposals: [
        {
          ...validOutput().brief_proposals[0],
          proposed_value: "Niko slipped the brass key into his coat while Elin watched the cellar door"
        }
      ]
    };
    expect(parseSegmentReconciliationOutput(JSON.stringify(echoOutput), context())).toMatchObject({
      status: "malformed",
      reasonCode: "verbatim-source-echo"
    });

    const shortNameOutput = {
      ...validOutput(),
      brief_proposals: [{ ...validOutput().brief_proposals[0], proposed_value: "Niko" }]
    };
    expect(parseSegmentReconciliationOutput(JSON.stringify(shortNameOutput), context()).status).toBe("valid");
  });
});

function validOutput() {
  return {
    contract: SEGMENT_RECONCILIATION_OUTPUT_CONTRACT,
    source: {
      profile: "segment-reconciliation",
      accepted_segment_id: "seg-1",
      accepted_segment_sequence: 3,
      record_scope: "active_working_set",
      prompt_fingerprint: "fnv1a32:abc12345"
    },
    brief_proposals: [
      {
        id: "BRIEF-001",
        action: "REPLACE",
        field_path: "current_authoritative_state.current_time",
        proposed_value: "late morning after the key changes hands",
        evidence: ["[SEG-3-S001]"],
        contrast: ["[BRIEF:current_authoritative_state.current_time]"],
        rationale: "The segment advances the immediate situation."
      }
    ],
    record_change_proposals: [
      {
        id: "RECORD-001",
        action: "DEACTIVATE",
        record_key: "[BELIEF-1]",
        patches: [],
        lifecycle_destination: "abandoned",
        evidence: ["[SEG-3-S001]"],
        contrast: ["[BELIEF-1]"],
        rationale: "The belief no longer applies."
      }
    ],
    record_creation_proposals: [
      {
        id: "NEW-001",
        record_type: "FACT",
        payload: {
          fact_kind: "current_state",
          statement: "Niko now has the brass key.",
          scope: "object",
          known_by: "public",
          audience_visibility: "explicit",
          salience: "high"
        },
        dependencies: [],
        evidence: ["[SEG-3-S001]"],
        contrast: ["[RECORD-SCOPE]"],
        rationale: "The segment changes object possession."
      }
    ]
  };
}

function invalidEnumOutput() {
  const output = validOutput();
  const creation = output.record_creation_proposals[0];
  if (!creation) {
    throw new Error("Expected valid creation proposal fixture.");
  }

  return {
    ...output,
    record_creation_proposals: [
      {
        ...creation,
        payload: { ...creation.payload, salience: "urgent" }
      }
    ]
  };
}

function recordUpdateOutput(patches: Array<{ op: "add" | "replace" | "remove"; path: string; value: unknown }>) {
  const output = validOutput();

  return {
    ...output,
    record_change_proposals: [
      {
        id: "RECORD-001",
        action: "UPDATE_FIELDS",
        record_key: "[BELIEF-1]",
        patches,
        lifecycle_destination: null,
        evidence: ["[SEG-3-S001]"],
        contrast: ["[BELIEF-1]"],
        rationale: "The accepted segment changes the belief."
      }
    ]
  };
}

function rawUuidOutput(
  output: Record<string, unknown> & {
    record_creation_proposals: Array<Record<string, unknown> & { payload: Record<string, unknown> }>;
  }
) {
  const creation = output.record_creation_proposals[0];
  if (!creation) {
    throw new Error("Expected valid creation proposal fixture.");
  }

  return {
    ...output,
    record_creation_proposals: [
      {
        ...creation,
        payload: { ...creation.payload, holder: entityId }
      }
    ]
  };
}

function context(): SegmentReconciliationParseContext {
  return {
    promptFingerprint: "fnv1a32:abc12345",
    acceptedSegmentId: "seg-1",
    acceptedSegmentSequence: 3,
    recordScope: "active_working_set",
    acceptedSegmentText: "Niko slipped the brass key into his coat while Elin watched the cellar door.",
    segmentSpanKeys: ["[SEG-3-S001]"],
    briefFields: RECONCILIATION_BRIEF_FIELD_PATHS.map((fieldPath) => ({
      fieldPath,
      citationKey: briefFieldCitationKey(fieldPath),
      currentState: "missing"
    })),
    records: [
      {
        id: entityId,
        type: "ENTITY",
        displayLabel: "Niko Bram",
        payload: {
          id: entityId,
          display_name: "Niko Bram",
          entity_kind: "person",
          roles_in_story: ["primary_actor"],
          short_description: "A careful apprentice."
        }
      },
      {
        id: "belief-1",
        type: "BELIEF",
        displayLabel: "Old belief",
        payload: {
          id: "019b0298-5c00-7000-8000-000000000102",
          status: "active",
          holder: entityId,
          claim: "Niko thinks Elin kept the key.",
          belief_mode: "believes",
          truth_relation: "false",
          confidence: "medium",
          visibility: "private",
          access_route: "direct_observation",
          behavioral_effect: "He hesitates.",
          salience: "medium"
        }
      }
    ],
    referenceStubs: [],
    recordKeyById: new Map([
      [entityId, "[ENTITY-1]"],
      ["belief-1", "[BELIEF-1]"]
    ]),
    referenceStubKeyById: new Map(),
    schemaCatalogRecordTypes: [
      "ENTITY",
      "ENTITY STATUS",
      "CAST MEMBER",
      "FACT",
      "BELIEF",
      "SECRET",
      "LOCATION",
      "OBJECT",
      "VISIBLE AFFORDANCE",
      "EVENT",
      "INTENTION",
      "PLAN",
      "CLOCK",
      "OBLIGATION",
      "CONSEQUENCE",
      "OPEN THREAD",
      "RELATIONSHIP",
      "EMOTION"
    ]
  };
}

function collectObjectSchemas(value: unknown): Array<Record<string, unknown>> {
  if (!value || typeof value !== "object") {
    return [];
  }

  const objectValue = value as Record<string, unknown>;
  return [
    ...(objectValue.type === "object" ? [objectValue] : []),
    ...Object.values(objectValue).flatMap(collectObjectSchemas)
  ];
}
