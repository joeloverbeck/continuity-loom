import assert from "node:assert/strict";
import test from "node:test";

import {
  CHANGE_REVIEW_BRIEF_FIELD_PATHS,
  CHANGE_REVIEW_COVERAGE_DIMENSIONS,
  GOLD_CASE_ORDER,
  loadGoldCorpus
} from "../corpus.mjs";

test("loads the exact eight adjudicated Accepted-Segment Change Review cases", async () => {
  const corpus = await loadGoldCorpus();

  assert.deepEqual(
    corpus.map((fixture) => fixture.caseId),
    GOLD_CASE_ORDER
  );
  assert.equal(corpus.length, 8);

  for (const fixture of corpus) {
    assert.equal(fixture.schemaVersion, 2);
    assert.equal(fixture.syntheticData, true);
    assert.match(fixture.syntheticDataDisclosure, /synthetic/i);
    assert.equal(fixture.acceptedSegment.selection, "latest");
    assert.ok(fixture.acceptedSegment.text.length > 0);
    assert.deepEqual(Object.keys(fixture.generationBriefProjection), CHANGE_REVIEW_BRIEF_FIELD_PATHS);
    assert.deepEqual(
      fixture.adjudication.coverage.map((row) => row.dimension),
      CHANGE_REVIEW_COVERAGE_DIMENSIONS
    );
    assert.equal(fixture.adjudication.coverage.length, 6);
    assert.ok(fixture.adjudication.prohibitedInventions.length > 0);

    const wholeProjectIds = fixture.recordInputs.wholeProject.map((record) => record.id);
    const activeWorkingSetIds = fixture.recordInputs.activeWorkingSet.map((record) => record.id);
    assert.ok(activeWorkingSetIds.every((recordId) => wholeProjectIds.includes(recordId)));
    assert.deepEqual(fixture.expectedSourceAccounting.activeWorkingSetRecordIds, activeWorkingSetIds);
    assert.deepEqual(fixture.expectedSourceAccounting.wholeProjectRecordIds, wholeProjectIds);
    assert.equal(fixture.expectedSourceAccounting.generationBriefFieldCount, 19);

    const evidenceKeys = new Set(fixture.acceptedSegment.evidenceSpans.map((span) => span.key));
    const contrastKeys = new Set(fixture.expectedSourceAccounting.contrastKeys);
    for (const finding of fixture.adjudication.findings) {
      assert.ok(finding.evidenceKeys.every((key) => evidenceKeys.has(key)), `${fixture.caseId}: evidence key resolves`);
      assert.ok(finding.contrastKeys.every((key) => contrastKeys.has(key)), `${fixture.caseId}: contrast key resolves`);
      assert.ok(["established change", "interpretation requiring author judgment"].includes(finding.epistemicStatus));
      assert.ok(
        ["durable record candidate", "next-brief-only", "no storage", "author decision required"].includes(
          finding.retentionHorizon
        )
      );
      assert.equal(typeof finding.evidenceExcerpt, "string", `${fixture.caseId}: evidence excerpt is a string`);
      if (finding.epistemicStatus === "established change") {
        const words = finding.evidenceExcerpt.trim().split(/\s+/).filter(Boolean);
        assert.ok(words.length >= 3 && words.length <= 7, `${fixture.caseId}: evidence excerpt is three to seven words`);
        assert.ok(
          fixture.acceptedSegment.text.includes(finding.evidenceExcerpt),
          `${fixture.caseId}: evidence excerpt occurs verbatim in the accepted segment`
        );
      } else {
        assert.equal(finding.evidenceExcerpt, "", `${fixture.caseId}: interpretation excerpt is the empty string`);
      }
    }
  }
});

test("visibly marks the SECRET fixture synthetic and contains no credential-shaped payload", async () => {
  const corpus = await loadGoldCorpus();
  const secretFixture = corpus.find((fixture) => fixture.caseId === "secret-disclosure");

  assert.ok(secretFixture);
  assert.match(secretFixture.syntheticDataDisclosure, /SECRET/);
  assert.ok(secretFixture.recordInputs.wholeProject.some((record) => record.type === "SECRET"));

  const serializedCorpus = JSON.stringify(corpus);
  assert.doesNotMatch(serializedCorpus, /sk-or-[A-Za-z0-9_-]+/);
  assert.doesNotMatch(serializedCorpus, /OPENROUTER_API_KEY|Bearer\s+[A-Za-z0-9._-]+/i);
});
