import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getRecordTypeDefinition } from "../src/index.js";

const caseIds = [
  "death",
  "injury",
  "location-change",
  "custody-change",
  "clock-threshold-crossing",
  "commitment-change",
  "secret-disclosure",
  "no-change"
] as const;

interface FixtureRecord {
  readonly id: string;
  readonly type: string;
  readonly payload: unknown;
}

interface GoldFixture {
  readonly recordInputs: {
    readonly activeWorkingSet: readonly FixtureRecord[];
    readonly wholeProject: readonly FixtureRecord[];
  };
}

describe("Accepted-Segment Change Review gold records", () => {
  it.each(caseIds)("keeps every %s record payload complete and registry-valid", (caseId) => {
    const fixture = loadFixture(caseId);

    for (const scope of [fixture.recordInputs.activeWorkingSet, fixture.recordInputs.wholeProject]) {
      for (const record of scope) {
        const definition = getRecordTypeDefinition(record.type);
        expect(definition, `${caseId}: registered type ${record.type}`).toBeDefined();
        expect(definition?.payloadSchema.safeParse(record.payload), `${caseId}: valid ${record.type} ${record.id}`).toMatchObject({
          success: true
        });
      }
    }
  });
});

function loadFixture(caseId: (typeof caseIds)[number]): GoldFixture {
  const fixtureUrl = new URL(`./fixtures/accepted-segment-change-review/${caseId}.json`, import.meta.url);
  return JSON.parse(readFileSync(fixtureUrl, "utf8")) as GoldFixture;
}
