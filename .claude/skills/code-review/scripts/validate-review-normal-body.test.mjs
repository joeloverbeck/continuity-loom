import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DEFAULT_REVIEW_CLOSEOUT_BODY_MAX_BYTES,
  unresolvedValue
} from "./review-evidence-contract.mjs";
import { validateReviewNormalBody } from "./validate-review-normal-body.mjs";

const identityBlock = `Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none
`;

const acceptanceManifest = {
  version: 1,
  issues: [
    {
      number: 359,
      title: "Review child",
      checks: [
        { id: "AC1", kind: "acceptance", text: "First behavior" },
        { id: "AC2", kind: "acceptance", text: "Second behavior" }
      ]
    }
  ]
};

const siblingManifest = {
  version: 1,
  issues: [
    {
      number: 369,
      title: "First sibling",
      checks: [
        { id: "AC1", kind: "acceptance", text: "First sibling behavior" },
        { id: "AC2", kind: "acceptance", text: "Second first-sibling behavior" },
        { id: "AC3", kind: "acceptance", text: "Third first-sibling behavior" }
      ]
    },
    {
      number: 370,
      title: "Second sibling",
      checks: [{ id: "AC2", kind: "acceptance", text: "Second sibling behavior" }]
    }
  ]
};

const noFixBody = `## Standards

Findings: none.

## Spec

Findings: none.
Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

- **Review subagents**: Standards reviewer standards-1 completed; Spec reviewer spec-1 completed
- **Review subagent cleanup**: Standards close operation unavailable after terminal completion; Spec close operation unavailable after terminal completion
- **Axis summary**: Standards 0/none, Spec 0/none
- **Residual findings**: none
- **Parent PRD coverage**: parent PRD row present
- **Browser/manual evidence freshness**: N/A because no browser/manual evidence was used
- **Browser/manual console state**: N/A because no browser/manual evidence was used
- **Backend process currentness**: N/A because no browser/manual evidence was used
${identityBlock}
- **Review evidence line**: Review: code-review against abc1234; outcome no findings; verification rerun pnpm test.

Review: code-review against abc1234; outcome no findings; verification rerun pnpm test.
`;

const immediateFixBody = `Review frame: fixed point input abc1234; fixed point resolved SHA abc1234; reviewed HEAD SHA def5678901234567; diff command \`git diff abc1234...HEAD\`; commits def5678; worktree scope committed diff; excluded dirty files none; spec source issue #1.

## Standards

Initial finding was fixed.

## Spec

Initial finding was fixed.
Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

- **Initial Standards outcome**: 1/Medium before fixes
- **Initial Spec outcome**: 1/High before fixes
- **Final Standards outcome**: 0/none after re-review
- **Final Spec outcome**: 0/none after re-review
- **Findings found**: 2 review findings

| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |
|---|---|---|---|---|---|---|---|---|---|
| P1-standards-1 | P1 | Standards | standards-1 | Standards contract gap | conformance-only | red-first skipped because Standards-only fix did not change behavior | Contract wording corrected | Standards final review completed | fixed |
| P1-spec-1 | P1 | Spec | spec-1 | Spec behavior gap | behavior | RF-1 | Behavior corrected | Spec final review and pnpm test passed | fixed |

- **Fixes made**: packages/web/src/main.tsx corrected and proof added
- **Review subagents**: Standards initial reviewer standards-1 completed, final reviewer standards-2 completed; Spec initial reviewer spec-1 completed, final reviewer spec-2 completed
- **Review subagent cleanup**: Standards close operation unavailable after terminal completion; Spec close operation unavailable after terminal completion
- **TDD/review-fix evidence**: red-first skipped because Standards-only fix did not change behavior
- **TDD closeout gate**: N/A because the tdd skill was not invoked
- **Verification rerun**: pnpm test passed
- **Browser/manual evidence freshness**: N/A because no browser/manual evidence was used
- **Browser/manual console state**: N/A because no browser/manual evidence was used
- **Backend process currentness**: N/A because no browser/manual evidence was used
${identityBlock}
- **Commit handling**: amended commit abc1234
- **Residual findings**: none
- **Axis summary**: Standards 0/none, Spec 0/none
- **Review evidence line**: Review: code-review against abc1234; outcome findings fixed in SHA def5678; verification rerun pnpm test.

Review: code-review against abc1234; outcome findings fixed in SHA def5678; verification rerun pnpm test.
`;

test("accepts a complete normal no-fix body", () => {
  assert.deepEqual(validateReviewNormalBody(noFixBody), []);
});

test("closing enforces the configured UTF-8 byte ceiling", () => {
  assert.equal(DEFAULT_REVIEW_CLOSEOUT_BODY_MAX_BYTES, 65_536);
  assert.deepEqual(validateReviewNormalBody(noFixBody, { flags: ["--closing"] }), []);
  assert.deepEqual(validateReviewNormalBody(noFixBody, { maxBytes: 100 }), []);

  const errors = validateReviewNormalBody(noFixBody, { flags: ["--closing"], maxBytes: 100 });
  assert.ok(errors.some((error) => error.includes("maximum is 100 bytes")));

  const defaultLimitErrors = validateReviewNormalBody(noFixBody.padEnd(65_537, "x"), {
    flags: ["--closing"]
  });
  assert.ok(defaultLimitErrors.some((error) => error.includes("maximum is 65536 bytes")));
});

test("requires parent PRD coverage only when requested", () => {
  const parentBody = noFixBody.replace(
    "Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n\n- **Review subagents**",
    `Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #359 | issue #359 AC1, AC2; sequence: N/A because these criteria are not sequence-sensitive | validator test | none |

- **Review subagents**`
  );
  assert.deepEqual(
    validateReviewNormalBody(parentBody, { flags: ["--parent-prd"], acceptanceManifest }),
    []
  );
  const errors = validateReviewNormalBody(parentBody.replace(/^- \*\*Parent PRD coverage.*\n/m, ""), {
    flags: ["--parent-prd"],
    acceptanceManifest
  });
  assert.ok(errors.some((error) => error.includes("Parent PRD coverage")));

  const nAErrors = validateReviewNormalBody(
    parentBody.replace("parent PRD row present", "N/A because child coverage exists"),
    { flags: ["--parent-prd"], acceptanceManifest }
  );
  assert.ok(nAErrors.some((error) => error.includes("cannot be N/A")));

  const structuredManifest = {
    version: 1,
    issues: [
      {
        number: 359,
        title: "Parent PRD",
        checks: [
          { id: "Parent-Solution", kind: "parent-prd-section", text: "Parent PRD ## Solution section" },
          { id: "US1", kind: "user-story", text: "First story" },
          { id: "US2", kind: "user-story", text: "Second story" },
          { id: "US3", kind: "user-story", text: "Third story" },
          {
            id: "Parent-Implementation-Decisions",
            kind: "parent-prd-section",
            text: "Parent PRD ## Implementation Decisions section"
          },
          {
            id: "Parent-Testing-Decisions",
            kind: "parent-prd-section",
            text: "Parent PRD ## Testing Decisions section"
          }
        ]
      }
    ]
  };
  const storyMap = `| Story | Exact proof |
|---|---|
| US1 | first child seam |
| US2 | second child seam |
| US3 | third child seam |
`;
  const structuredBody = parentBody
    .replace(
      "issue #359 AC1, AC2; sequence: N/A because these criteria are not sequence-sensitive",
      "issue #359 Solution, Implementation Decisions, Testing Decisions, individual US1-US3 map below; sequence: N/A because these criteria are not sequence-sensitive"
    )
    .replace("- **Review subagents**", `${storyMap}\n- **Review subagents**`);
  assert.deepEqual(
    validateReviewNormalBody(structuredBody, {
      flags: ["--parent-prd"],
      acceptanceManifest: structuredManifest
    }),
    []
  );
  const missingStories = validateReviewNormalBody(
    structuredBody.replace(`${storyMap}\n`, ""),
    { flags: ["--parent-prd"], acceptanceManifest: structuredManifest }
  );
  assert.deepEqual(
    missingStories.filter((error) => error.includes("missing acceptance source US")),
    [
      "PRD child coverage issue #359 is missing acceptance source US1",
      "PRD child coverage issue #359 is missing acceptance source US2",
      "PRD child coverage issue #359 is missing acceptance source US3"
    ]
  );
});

test("requires exact sequence-aware child coverage when --child-family is used", () => {
  const missingManifest = validateReviewNormalBody(noFixBody, { flags: ["--child-family"] });
  assert.ok(missingManifest.some((error) => error.includes("acceptance manifest")));

  const missing = validateReviewNormalBody(noFixBody, {
    flags: ["--child-family"],
    acceptanceManifest
  });
  assert.ok(missing.some((error) => error.includes("PRD child coverage table header")));

  const childFamilyBody = noFixBody.replace(
    "Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n\n- **Review subagents**",
    `Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #359 | issue #359 AC1, AC2; sequence: N/A because these criteria are not sequence-sensitive | validator test | none |

- **Review subagents**`
  );
  assert.deepEqual(
    validateReviewNormalBody(childFamilyBody, { flags: ["--child-family"], acceptanceManifest }),
    []
  );

  const ordered = childFamilyBody.replace(
    "sequence: N/A because these criteria are not sequence-sensitive",
    "sequence: Proposal -> staging -> Pressure observed by validator test"
  );
  assert.deepEqual(
    validateReviewNormalBody(ordered, { flags: ["--child-family"], acceptanceManifest }),
    []
  );

  const broad = validateReviewNormalBody(
    childFamilyBody.replace(
      "issue #359 AC1, AC2; sequence: N/A because these criteria are not sequence-sensitive",
      "issue #359 server contract; sequence: N/A because the criterion is not sequence-sensitive"
    ),
    { flags: ["--child-family"], acceptanceManifest }
  );
  assert.ok(broad.some((error) => error.includes("too broad")));

  const missingAcceptance = validateReviewNormalBody(
    childFamilyBody.replace("AC1, AC2", "AC1"),
    { flags: ["--child-family"], acceptanceManifest }
  );
  assert.ok(missingAcceptance.some((error) => error.includes("missing acceptance source AC2")));

  const missingChild = validateReviewNormalBody(childFamilyBody, {
    flags: ["--child-family"],
    acceptanceManifest: {
      ...acceptanceManifest,
      issues: [
        ...acceptanceManifest.issues,
        { number: 360, title: "Missing child", checks: [{ id: "AC1", kind: "acceptance", text: "Third behavior" }] }
      ]
    }
  });
  assert.ok(missingChild.some((error) => error.includes("missing issue #360")));

  const duplicatedBroad = validateReviewNormalBody(
    childFamilyBody.replace(
      "| #359 | issue #359 AC1, AC2; sequence: N/A because these criteria are not sequence-sensitive | validator test | none |",
      `| #359 | issue #359 AC1; sequence: N/A because AC1 is not sequence-sensitive | validator test | none |
| #359 | issue #359 server contract; sequence: N/A because the criterion is not sequence-sensitive | validator test | none |`
    ),
    { flags: ["--child-family"], acceptanceManifest }
  );
  assert.ok(duplicatedBroad.some((error) => error.includes("too broad")));

  const noSequence = validateReviewNormalBody(
    childFamilyBody.replace("; sequence: N/A because these criteria are not sequence-sensitive", ""),
    { flags: ["--child-family"], acceptanceManifest }
  );
  assert.ok(noSequence.some((error) => error.includes("sequence:")));
});

test("requires exact per-issue coverage when --issue-set is used", () => {
  const issueSetBody = noFixBody.replace(
    "Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n\n- **Review subagents**",
    `Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #369 | issue #369 AC1-AC3; sequence: prepare -> validate and observe output | validator test | none |
| #370 | issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive | validator test | none |

- **Review subagents**`
  );

  const missingManifest = validateReviewNormalBody(issueSetBody, { flags: ["--issue-set"] });
  assert.ok(missingManifest.some((error) => error.includes("acceptance manifest")));

  assert.deepEqual(
    validateReviewNormalBody(issueSetBody, { flags: ["--issue-set"], acceptanceManifest: siblingManifest }),
    []
  );

  const missingSibling = validateReviewNormalBody(
    issueSetBody.replace(/^\| #370 .*\n/m, ""),
    { flags: ["--issue-set"], acceptanceManifest: siblingManifest }
  );
  assert.ok(missingSibling.some((error) => error.includes("missing issue #370")));

  const unexpectedSibling = validateReviewNormalBody(
    issueSetBody.replace(
      "| #370 | issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive | validator test | none |",
      `| #370 | issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive | validator test | none |
| #371 | issue #371 AC1; sequence: N/A because AC1 is not sequence-sensitive | validator test | none |`
    ),
    { flags: ["--issue-set"], acceptanceManifest: siblingManifest }
  );
  assert.ok(unexpectedSibling.some((error) => error.includes("unexpected issue #371")));

  const missingCheck = validateReviewNormalBody(
    issueSetBody.replace(
      "issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive",
      "issue #370 criterion 2; sequence: N/A because criterion 2 is not sequence-sensitive"
    ),
    { flags: ["--issue-set"], acceptanceManifest: siblingManifest }
  );
  assert.ok(missingCheck.some((error) => error.includes("missing acceptance source AC2")));
});

test("requires sequence disposition for an ordinary zero-finding Spec review", () => {
  const missing = validateReviewNormalBody(
    noFixBody.replace("Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n", "")
  );
  assert.ok(missing.some((error) => error.includes("Spec sequence coverage")));

  const ordered = noFixBody.replace(
    "sequence: N/A because the reviewed acceptance is not sequence-sensitive",
    "sequence: Proposal -> staging -> Pressure observed by validator test"
  );
  assert.deepEqual(validateReviewNormalBody(ordered), []);

  const noFindingsWording = noFixBody
    .replace(
      "## Spec\n\nFindings: none.",
      "## Spec\n\nFindings: no findings"
    )
    .replace("Axis summary**: Standards 0/none, Spec 0/none", "Axis summary**: Standards 0/none, Spec no findings")
    .replace("Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n", "");
  const wordingErrors = validateReviewNormalBody(noFindingsWording);
  assert.ok(wordingErrors.some((error) => error.includes("Spec sequence coverage")));
});

test("requires review-native evidence identity reconciliation", () => {
  const errors = validateReviewNormalBody(noFixBody.replace(identityBlock, ""));
  assert.ok(errors.some((error) => error.includes("Evidence identity refresh")));

  const missingCategory = validateReviewNormalBody(
    noFixBody.replace("; artifacts none\n- Historical red identities", "\n- Historical red identities")
  );
  assert.ok(missingCategory.some((error) => error.includes("must enumerate artifacts")));

  const emptyCategories = validateReviewNormalBody(
    noFixBody.replace(
      "Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
      "Current evidence identities: fixture paths; browser sessions; packet paths/hashes; active revisions; artifacts"
    )
  );
  assert.ok(emptyCategories.some((error) => error.includes("fixture paths requires a value")));

  const hash = "a".repeat(64);
  const structuredWithholding = noFixBody.replace(
    "fixture paths none; browser sessions none",
    `fixture paths withheld because issue #378 forbids local path publication; logical fixture world-alpha; content SHA-256 ${hash}; provenance generated from issue #378 seed; browser sessions none`
  );
  assert.deepEqual(validateReviewNormalBody(structuredWithholding), []);

  const legacyWithholding = noFixBody.replace(
    "fixture paths none; browser sessions none",
    "fixture paths none published because issue #378 forbids local path publication; browser sessions none"
  );
  assert.ok(
    validateReviewNormalBody(legacyWithholding).some((error) =>
      error.includes("must use the structured 'fixture paths withheld because ...' identity form")
    )
  );

  const incompleteWithholding = noFixBody.replace(
    "fixture paths none; browser sessions none",
    "fixture paths withheld because issue #378 forbids local path publication; browser sessions none"
  );
  assert.ok(
    validateReviewNormalBody(incompleteWithholding).some((error) =>
      error.includes("withheld fixture identity must include reason")
    )
  );

  const invalidSweep = validateReviewNormalBody(
    noFixBody.replace(
      "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
      "Superseded evidence identities: fixture paths old.json; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
  );
  assert.ok(invalidSweep.some((error) => error.includes("may be N/A only")));

  const vagueHistorical = validateReviewNormalBody(
    noFixBody.replace("Historical red identities retained: none", "Historical red identities retained: FAC-17")
  );
  assert.ok(vagueHistorical.some((error) => error.includes("Historical red identities retained must enumerate")));

  const weakSweep = validateReviewNormalBody(
    noFixBody
      .replace(
        "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
        "Superseded evidence identities: fixture paths old.json; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
      )
      .replace(
        "Superseded-token sweep: N/A because every superseded category is none",
        "Superseded-token sweep: command clean"
      )
  );
  assert.ok(weakSweep.some((error) => error.includes("must name rg/grep")));

  const strongSweep = noFixBody
    .replace(
      "Historical red identities retained: none",
      "Historical red identities retained: fixture paths red.json; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(
      "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
      "Superseded evidence identities: fixture paths old.json; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(
      "Superseded-token sweep: N/A because every superseded category is none",
      "Superseded-token sweep: rg old.json body.md found no hits outside classified identity/history lines and no active-proof hits; historical-red red.json classified as failing history"
    );
  assert.deepEqual(validateReviewNormalBody(strongSweep), []);

  const canonicalMultiValueSweep = noFixBody
    .replace(
      "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
      "Superseded evidence identities: fixture paths old-a.json | old-b.json; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(
      "Superseded-token sweep: N/A because every superseded category is none",
      "Superseded-token sweep: rg old-a.json old-b.json body.md found no hits outside classified identity/history lines and no active-proof hits"
    );
  assert.deepEqual(validateReviewNormalBody(canonicalMultiValueSweep), []);
  assert.ok(
    validateReviewNormalBody(
      canonicalMultiValueSweep.replace("rg old-a.json old-b.json", "rg old-a.json")
    ).some((error) => error.includes("every normalized superseded value"))
  );

  const legacyMarkdownListSweep = noFixBody
    .replace(
      "Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
      "Superseded evidence identities: fixture paths `old-a.json`, `old-b.json`.; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
    )
    .replace(
      "Superseded-token sweep: N/A because every superseded category is none",
      "Superseded-token sweep: rg old-a.json old-b.json body.md found no hits outside classified identity/history lines and no active-proof hits"
    );
  assert.deepEqual(validateReviewNormalBody(legacyMarkdownListSweep), []);

  for (const oneSidedSweep of [
    "- Superseded-token sweep: rg old.json body.md found no active-proof hits; historical-red red.json classified as failing history",
    "- Superseded-token sweep: rg old.json body.md found no hits outside classified identity/history lines; historical-red red.json classified as failing history"
  ]) {
    const errors = validateReviewNormalBody(
      strongSweep.replace(/^- Superseded-token sweep:.*$/m, oneSidedSweep)
    );
    assert.ok(
      errors.some((error) =>
        error.includes("no hits outside classified identity/history lines and no active-proof hits")
      )
    );
  }
});

test("rejects HTML-like angle tokens and documents shared identity safety", () => {
  assert.equal(unresolvedValue("document `<body>` response evidence"), true);
  assert.equal(unresolvedValue("document body response evidence"), false);

  const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");
  const identities = readFileSync(new URL("../evidence-identities.md", import.meta.url), "utf8");
  const fallback = readFileSync(new URL("../fallback-evidence.md", import.meta.url), "utf8");
  const implementTemplate = readFileSync(
    new URL("../../implement/references/closeout-templates.md", import.meta.url),
    "utf8"
  );

  assert.match(skill, /use validator-safe prose/);
  assert.match(identities, /Nested-validator angle-token rule/);
  assert.match(identities, /Evidence-artifact lifecycle rule/);
  assert.match(fallback, /Use validator-safe prose/);
  assert.match(identities, /no hits outside classified identity\/history lines and no active-proof hits/);
  assert.match(implementTemplate, /no hits outside classified identity\/history lines and no active-proof hits/);
  assert.match(identities, /published current artifact is not safe to remove until closeout is complete/);
  assert.match(identities, /fixture paths withheld because/);
  assert.match(identities, /Never use `fixture paths none published because/);
  assert.match(identities, /canonical delimiter/);
  assert.match(implementTemplate, /normalized value independently/);
  for (const contract of [skill, fallback]) {
    assert.match(contract, /Evidence-only proof server preflight:/);
    assert.match(contract, /proof server preflight/);
    assert.match(contract, /65,536-byte body maximum/);
    assert.match(contract, /--max-bytes <positive integer>/);
    assert.match(contract, /US1-US36.*does not replace individual story rows/);
    assert.match(contract, /--select <issue\[:check-id\[,check-id\.\.\.\]\]>/);
  }
  assert.match(skill, /--review normal --size-plan --require-headroom/);
  assert.match(skill, /multi-pass review or more than one TDD review fix/);
  assert.match(skill, /--evidence-input <evidence\.json> --immediate-fix --tdd-parent-rollup/);
  assert.match(skill, /\.\.\/implement\/references\/closeout-templates\.md/);
  assert.match(skill, /Do not hand-copy those derived fields/);
  assert.match(fallback, /--review fallback --size-plan --require-headroom/);
});

test("rejects non-terminal review subagent status", () => {
  const errors = validateReviewNormalBody(noFixBody.replace("Spec reviewer spec-1 completed", "Spec reviewer spec-1 running"));
  assert.ok(errors.some((error) => error.includes("non-terminal")));
  assert.ok(errors.some((error) => error.includes("Spec reviewer")));
});

test("requires a terminal cleanup disposition for both review axes", () => {
  const missing = validateReviewNormalBody(noFixBody.replace(/^- \*\*Review subagent cleanup.*\n/m, ""));
  assert.ok(missing.some((error) => error.includes("Review subagent cleanup")));

  const ambiguous = validateReviewNormalBody(
    noFixBody.replace(
      "Standards close operation unavailable after terminal completion; Spec close operation unavailable after terminal completion",
      "Standards completed; Spec completed"
    )
  );
  assert.ok(ambiguous.some((error) => error.includes("Standards reviewer cleanup disposition")));
  assert.ok(ambiguous.some((error) => error.includes("Spec reviewer cleanup disposition")));
});

test("accepts complete immediate-fix evidence and rejects a missing final outcome", () => {
  assert.deepEqual(validateReviewNormalBody(immediateFixBody, { flags: ["--immediate-fix"] }), []);
  const errors = validateReviewNormalBody(
    immediateFixBody.replace(/^- \*\*Final Spec outcome.*\n/m, ""),
    { flags: ["--immediate-fix"] }
  );
  assert.ok(errors.some((error) => error.includes("Final Spec outcome")));
});

test("requires every fixed-review evidence line to name the reviewed HEAD SHA", () => {
  const missingSha = validateReviewNormalBody(
    immediateFixBody.replaceAll("outcome findings fixed in SHA def5678", "outcome findings fixed"),
    { flags: ["--immediate-fix"] }
  );
  assert.ok(
    missingSha.some((error) => error.includes("must say 'findings fixed in SHA <sha>'"))
  );

  const staleSha = validateReviewNormalBody(
    immediateFixBody.replaceAll("outcome findings fixed in SHA def5678", "outcome findings fixed in SHA 1234567"),
    { flags: ["--immediate-fix"] }
  );
  assert.ok(
    staleSha.some((error) =>
      error.includes("outcome SHA 1234567 does not match reviewed HEAD SHA def5678901234567")
    )
  );
});

test("requires every immediate-fix finding to have one keyed ledger row and TDD disposition", () => {
  const laterPassFinding = immediateFixBody
    .replace("Findings found**: 2 review findings", "Findings found**: 3 review findings")
    .replace(
      "| P1-spec-1 | P1 | Spec | spec-1 | Spec behavior gap | behavior | RF-1 | Behavior corrected | Spec final review and pnpm test passed | fixed |",
      `| P1-spec-1 | P1 | Spec | spec-1 | Spec behavior gap | behavior | RF-1 | Behavior corrected | Spec final review and pnpm test passed | fixed |
| P2-standards-1 | P2 | Standards | standards-2 | Later-pass contract gap | docs-only | red-first skipped because Standards-only fix did not change behavior | Contract note corrected | Standards P2 rerun completed | fixed |`
    );
  assert.deepEqual(validateReviewNormalBody(laterPassFinding, { flags: ["--immediate-fix"] }), []);

  const orphaned = validateReviewNormalBody(
    immediateFixBody.replace("Findings found**: 2 review findings", "Findings found**: 3 review findings"),
    { flags: ["--immediate-fix"] }
  );
  assert.ok(orphaned.some((error) => error.includes("3 findings but the review finding ledger has 2 rows")));

  const missingDisposition = validateReviewNormalBody(
    immediateFixBody.replace(
      "| behavior | RF-1 | Behavior corrected |",
      "| behavior | none | Behavior corrected |"
    ),
    { flags: ["--immediate-fix"] }
  );
  assert.ok(missingDisposition.some((error) => error.includes("TDD disposition")));

  const badSeparator = validateReviewNormalBody(
    immediateFixBody.replace("|---|---|---|---|---|---|---|---|---|---|", "|---|---|---|---|---|---|---|---|---|:---|"),
    { flags: ["--immediate-fix"] }
  );
  assert.ok(badSeparator.some((error) => error.includes("exact 10-column separator")));
});

test("requires initial and final reviewer identities for immediate fixes", () => {
  const finalOnly = validateReviewNormalBody(
    immediateFixBody.replace(
      "Standards initial reviewer standards-1 completed, final reviewer standards-2 completed; Spec initial reviewer spec-1 completed, final reviewer spec-2 completed",
      "Standards final reviewer standards-2 completed; Spec final reviewer spec-2 completed"
    ),
    { flags: ["--immediate-fix"] }
  );
  assert.ok(finalOnly.some((error) => error.includes("initial and final Standards reviewer identities")));
  assert.ok(finalOnly.some((error) => error.includes("initial and final Spec reviewer identities")));

  const sameReviewer = immediateFixBody.replace(
    "Standards initial reviewer standards-1 completed, final reviewer standards-2 completed; Spec initial reviewer spec-1 completed, final reviewer spec-2 completed",
    "Standards initial and final reviewer standards-1 completed; Spec initial and final reviewer spec-1 completed"
  );
  assert.deepEqual(validateReviewNormalBody(sameReviewer, { flags: ["--immediate-fix"] }), []);
});

test("requires current freshness and console evidence when --browser is used", () => {
  const nAErrors = validateReviewNormalBody(noFixBody, { flags: ["--browser"] });
  assert.ok(nAErrors.some((error) => error.includes("--browser requires")));

  const browserBody = noFixBody
    .replace(
      "N/A because no browser/manual evidence was used",
      "browser smoke rerun passed on final tree with observed result loaded workflow",
    )
    .replace(
      "N/A because no browser/manual evidence was used",
      "0 errors and 0 warnings in the clean browser session",
    )
    .replace(
      "N/A because no browser/manual evidence was used",
      "server command pnpm dev; watch/reload mode watch; process or port ownership PID 123 on port 4173; restart/reload proof server restarted; expected API field probe returned created",
    );
  assert.deepEqual(validateReviewNormalBody(browserBody, { flags: ["--browser"] }), []);

  const incompleteNotAffected = browserBody.replace(
    "browser smoke rerun passed on final tree with observed result loaded workflow",
    "not affected because changed path packages/core/src/example.ts; targeted proof npm test passed"
  );
  assert.ok(
    validateReviewNormalBody(incompleteNotAffected, { flags: ["--browser"] }).some((error) =>
      error.includes("unaffected evidence route/action/API/fixture")
    )
  );

  const semanticVariants = browserBody.replace(
    "process or port ownership PID 123 on port 4173; restart/reload proof server restarted; expected API field probe returned created",
    "process/port ownership PID 123 on port 4173; restart/reload proof server restarted; expected Propagation API field probe returned created"
  );
  assert.deepEqual(validateReviewNormalBody(semanticVariants, { flags: ["--browser"] }), []);

  const missingExpectedApiProbe = semanticVariants.replace(
    "; expected Propagation API field probe returned created",
    ""
  );
  assert.ok(
    validateReviewNormalBody(missingExpectedApiProbe, { flags: ["--browser"] }).some((error) =>
      error.includes("expected API field/behavior probe")
    )
  );

  const staleBackend = validateReviewNormalBody(
    browserBody.replace(
      "server command pnpm dev; watch/reload mode watch; process or port ownership PID 123 on port 4173; restart/reload proof server restarted; expected API field probe returned created",
      "server reachable on port 4173"
    ),
    { flags: ["--browser"] }
  );
  assert.ok(staleBackend.some((error) => error.includes("Backend process currentness")));

  const copiedFixtureBody = browserBody
    .replace(
      "Current evidence identities: fixture paths none; browser sessions none",
      "Current evidence identities: fixture paths /tmp/review.sqlite; browser sessions none"
    )
    .replace(
      "expected API field probe returned created",
      "expected API field probe returned created; stateful fixture snapshot method sqlite .backup; snapshot source /srv/source.sqlite; expected-state probe GET /api/records returned record 42"
    );
  assert.deepEqual(validateReviewNormalBody(copiedFixtureBody, { flags: ["--browser"] }), []);

  const missingSnapshot = validateReviewNormalBody(
    copiedFixtureBody.replace(
      "; stateful fixture snapshot method sqlite .backup; snapshot source /srv/source.sqlite; expected-state probe GET /api/records returned record 42",
      ""
    ),
    { flags: ["--browser"] }
  );
  assert.ok(missingSnapshot.some((error) => error.includes("stateful fixture snapshot")));

  const noStatefulCopy = copiedFixtureBody.replace(
    "stateful fixture snapshot method sqlite .backup; snapshot source /srv/source.sqlite; expected-state probe GET /api/records returned record 42",
    "N/A because no stateful fixture was copied"
  );
  assert.deepEqual(validateReviewNormalBody(noStatefulCopy, { flags: ["--browser"] }), []);

  const duplicateMissingSnapshot = `${copiedFixtureBody}
- **Backend process currentness**: server command pnpm dev; watch/reload mode watch; process or port ownership PID 123 on port 4173; restart/reload proof server restarted; expected API field probe returned created
`;
  assert.ok(
    validateReviewNormalBody(duplicateMissingSnapshot, { flags: ["--browser"] }).some((error) =>
      error.includes("Backend process currentness occurrence 2 with non-none fixture paths")
    )
  );
});

test("validates every backend currentness field against the reviewed HEAD", () => {
  const currentness =
    "server command pnpm dev; watch/reload mode watch; process or port ownership PID 123 on port 4173; restart/reload proof clean start from final committed SHA def5678; expected API field probe returned created";
  const body = `Review frame: fixed point input HEAD~1; fixed point resolved SHA abc1234; reviewed HEAD SHA def5678901234567; diff command git diff abc1234...HEAD
${noFixBody.replace(
  "N/A because no browser/manual evidence was used",
  currentness
)}`;

  assert.deepEqual(validateReviewNormalBody(body), []);

  const staleErrors = validateReviewNormalBody(
    `${body}
- **Backend process currentness**: ${currentness.replace("def5678", "1234567")}
`
  );
  assert.ok(
    staleErrors.some((error) =>
      error.includes("Backend process currentness names commit 1234567, which does not match reviewed HEAD SHA def5678901234567")
    )
  );

  const incompleteErrors = validateReviewNormalBody(
    `${body}
- **Backend process currentness**: server reachable on port 4173
`
  );
  assert.ok(
    incompleteErrors.some((error) =>
      error.includes("Backend process currentness occurrence 2 must state server command")
    )
  );
});

test("requires a structured accepted residual with a revisit trigger", () => {
  const accepted = noFixBody
    .replace(
      "- **Residual findings**: none",
      `- **Residual findings**: accepted residuals below; unhandled findings none beyond accepted residuals
- **Accepted residual**: duplicated admitted-status set
  - **Axis**: Standards
  - **Source**: standards reviewer at packages/web/src/main.tsx
  - **Rationale**: extracting a shared abstraction would widen the narrow fix
  - **Revisit trigger**: when a third admitted-status consumer is added`
    )
    .replace(
      /Review: code-review against abc1234; outcome no findings; verification rerun pnpm test\./g,
      "Review: code-review against abc1234; outcome accepted residuals recorded 1; unhandled findings none beyond accepted residuals; verification rerun pnpm test."
    );

  assert.deepEqual(validateReviewNormalBody(accepted), []);
  const errors = validateReviewNormalBody(accepted.replace(/\n {2}- \*\*Revisit trigger.*$/m, ""));
  assert.ok(errors.some((error) => error.includes("Revisit trigger")));
});

test("accepts the exact permanent-judgement trigger and rejects vague N/A", () => {
  const accepted = noFixBody
    .replace(
      "- **Residual findings**: none",
      `- **Residual findings**: accepted residuals below; unhandled findings none beyond accepted residuals
- **Accepted residual**: intentional one-off
  - **Axis**: Spec
  - **Source**: issue criterion 2
  - **Rationale**: the exception is part of the authored contract
  - **Revisit trigger**: N/A because permanently accepted judgement`
    )
    .replace(
      /Review: code-review against abc1234; outcome no findings; verification rerun pnpm test\./g,
      "Review: code-review against abc1234; outcome accepted residuals recorded 1; unhandled findings none beyond accepted residuals; verification rerun pnpm test."
    );

  assert.deepEqual(validateReviewNormalBody(accepted), []);
  const errors = validateReviewNormalBody(
    accepted.replace("N/A because permanently accepted judgement", "N/A because accepted for now")
  );
  assert.ok(errors.some((error) => error.includes("permanently accepted judgement")));
});

test("requires durability for a transient browser intended red", () => {
  const withBrowserRed = immediateFixBody.replace(
    "- **TDD/review-fix evidence**:",
    "- **Intended red command/failure**: Playwright waitForResponse timed out\n- **TDD/review-fix evidence**:"
  );
  const errors = validateReviewNormalBody(withBrowserRed, { flags: ["--immediate-fix"] });
  assert.ok(errors.some((error) => error.includes("Regression durability")));

  const durable = withBrowserRed.replace(
    "- **TDD/review-fix evidence**:",
    "- **Regression durability**: durable test added at packages/web/src/main.test.tsx\n- **TDD/review-fix evidence**:"
  );
  assert.deepEqual(validateReviewNormalBody(durable, { flags: ["--immediate-fix"] }), []);
});

test("delegates --tdd bodies to the TDD closeout validator", () => {
  const errors = validateReviewNormalBody(immediateFixBody, { flags: ["--immediate-fix", "--tdd"] });
  assert.ok(errors.some((error) => error.startsWith("TDD validator failed:")));
});

test("accepts a complete immediate-fix body with current nested TDD evidence", () => {
  const body = `${immediateFixBody.replace(
    "- **TDD closeout gate**: N/A because the tdd skill was not invoked",
    "- **TDD closeout gate**: canonical TDD evidence below passed the nested validator"
  )}
TDD evidence

Final SHA: def5678

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #355 | read | ADR 0008 read | typed public contract | red-first skipped because Standards-only/conformance-only fix did not change behavior | pnpm typecheck passed | AC1; atoms: atomic; proof surfaces: server type contract; sequence: N/A because criterion is not sequence-sensitive | RF-1 - review-fix evidence |

Verification command ledger:
| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---|---|
| \`pnpm typecheck\` | passed: 1 check; exit 0 | 1 | def5678 |

Existing-test contract-change rows: none

TDD review-fix map:

| Finding ID | Finding/source | Intended red command/failure | Green command/evidence | Updated TDD table row | Regression durability | Browser/manual evidence freshness | Backend process currentness | Evidence identity refresh |
|---|---|---|---|---|---|---|---|---|
| RF-1 | typed public contract ownership | red-first skipped because Standards-only/conformance-only fix did not change behavior | \`pnpm typecheck\` passed: 1 check | #355 / typed public contract | N/A because the intended red was not a transient browser/manual probe | N/A because no UI/routes/browser-consumed API/fixtures/action path changed | N/A because no browser/manual proof was used | same-sink identity block inspected |

TDD closeout preflight:
- Durable sink/body inspected: issue #355 closeout comment
- Compact table/header: present after structural check
- Rows accounted for: all in-scope issues and seams listed
- Pre-red recovery status: N/A - pre-red preflight/table was visible before first red
- Pre-red evidence reference: issue #355 implementation ledger; anchor TDD preflight heading; chronology same-sink line order before first red command
- CONTEXT.md status: present
- ADRs/principles/docs status: present
- Acceptance atom map: all rows list authoritative atoms and proof surfaces
- Acceptance sequence map: all rows list justified sequence N/A
- Partial-red / red-first skip reasons: listed
- Evidence-only rows freshness: none
- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows
- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows
- Evidence identity refresh: same-sink identity block inspected
- Existing-test contract-change rows: none

Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none

TDD evidence gate passed: durable sink issue #355 closeout comment; compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status present; sequence evidence N/A; evidence identities present; partial-red / red-first skip reasons listed; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none.
`;

  assert.deepEqual(validateReviewNormalBody(body, { flags: ["--immediate-fix", "--tdd"] }), []);
  const nestedAcceptanceManifest = {
    version: 1,
    issues: [
      {
        number: 355,
        title: "Nested TDD issue",
        checks: [{ id: "AC1", kind: "acceptance", text: "Typed public contract" }]
      }
    ]
  };
  assert.deepEqual(
    validateReviewNormalBody(body, {
      flags: ["--immediate-fix", "--tdd-parent-rollup"],
      acceptanceManifest: nestedAcceptanceManifest
    }),
    []
  );
  assert.ok(
    validateReviewNormalBody(body, {
      flags: ["--immediate-fix", "--tdd-parent-rollup"]
    }).some((error) => error.includes("requires an acceptance manifest"))
  );
  assert.deepEqual(
    validateReviewNormalBody(body, {
      flags: ["--immediate-fix", "--tdd", "--closing"],
      expectedFinalSha: "def5678"
    }),
    []
  );

  const localSink = validateReviewNormalBody(
    body.replace("Durable sink/body inspected: issue #355 closeout comment", "Durable sink/body inspected: /tmp/review-closeout.md"),
    { flags: ["--immediate-fix", "--tdd", "--closing"], expectedFinalSha: "def5678" }
  );
  assert.ok(localSink.some((error) => error.includes("published TDD closeout field")));

  const localFixture = body.replace(
    "Current evidence identities: fixture paths none; browser sessions none",
    "Current evidence identities: fixture paths /tmp/review.sqlite; browser sessions none"
  );
  assert.deepEqual(
    validateReviewNormalBody(localFixture, {
      flags: ["--immediate-fix", "--tdd", "--closing"],
      expectedFinalSha: "def5678"
    }),
    []
  );
});

test("rejects fallback labeling in a normal body", () => {
  const errors = validateReviewNormalBody(`${noFixBody}\nReview fallback: policy-blocked.\n`);
  assert.ok(errors.some((error) => error.includes("fallback evidence")));
});
