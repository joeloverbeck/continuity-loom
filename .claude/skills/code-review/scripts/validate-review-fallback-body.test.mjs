import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test, { after } from "node:test";
import { spawnSync } from "node:child_process";

const directory = mkdtempSync(join(tmpdir(), "worldloom-review-fallback-"));
const script = fileURLToPath(new URL("./validate-review-fallback-body.mjs", import.meta.url));
const manifestPath = join(directory, "manifest.json");
const structuredManifestPath = join(directory, "structured-manifest.json");
const siblingManifestPath = join(directory, "sibling-manifest.json");
const tddManifestPath = join(directory, "tdd-manifest.json");
let sequence = 0;

writeFileSync(
  manifestPath,
  JSON.stringify({
    version: 1,
    issues: [{ number: 359, title: "Review child", checks: [{ id: "AC1", kind: "acceptance", text: "Behavior" }] }]
  })
);

writeFileSync(
  structuredManifestPath,
  JSON.stringify({
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
  })
);

writeFileSync(
  siblingManifestPath,
  JSON.stringify({
    version: 1,
    issues: [
      {
        number: 369,
        title: "First sibling",
        checks: [
          { id: "AC1", kind: "acceptance", text: "First" },
          { id: "AC2", kind: "acceptance", text: "Second" },
          { id: "AC3", kind: "acceptance", text: "Third" }
        ]
      },
      { number: 370, title: "Second sibling", checks: [{ id: "AC2", kind: "acceptance", text: "Second" }] }
    ]
  })
);

writeFileSync(
  tddManifestPath,
  JSON.stringify({
    version: 1,
    issues: [
      {
        number: 355,
        title: "Nested TDD issue",
        checks: [{ id: "AC1", kind: "acceptance", text: "Behavior" }]
      }
    ]
  })
);

const identityBlock = `Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none
`;

after(() => rmSync(directory, { recursive: true, force: true }));

const runValidator = (body, flags = []) => {
  sequence += 1;
  const bodyPath = join(directory, `body-${sequence}.md`);
  writeFileSync(bodyPath, body);
  return spawnSync(process.execPath, [script, bodyPath, ...flags], { encoding: "utf8" });
};

const baseBody = `Review frame: fixed point input HEAD~1; fixed point resolved SHA abc1234; reviewed HEAD SHA def5678; diff command git diff abc1234...HEAD; commits abc1234 review target; worktree scope committed diff only; spec source issue #355.

## Standards

Fallback used: policy-blocked delegation.
Delegation policy source: collaboration policy inspected.
Sources reviewed: AGENTS.md and smell baseline.
Smell baseline applied: yes.
Findings: none.

## Spec

Sources reviewed: issue #355.
Findings: none.
Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

Residual findings: none.
Browser/manual evidence freshness: N/A because no browser/manual evidence was used
Browser/manual console state: N/A because no browser/manual evidence was used
Backend process currentness: N/A because no browser/manual evidence was used
${identityBlock}
Axis summary: Standards 0/none, Spec 0/none

Review fallback gate passed: frame yes; delegation policy source yes; Standards yes; Spec yes; child table N/A; smell baseline yes; evidence identities yes; found-vs-residual N/A; closeout line N/A; immediate-fix block N/A; tdd fielded closeout gate N/A; verification/browser freshness N/A.
`;

const browserBody = baseBody
  .replace("N/A because no browser/manual evidence was used", "browser smoke rerun passed on final tree with observed result loaded workflow")
  .replace("N/A because no browser/manual evidence was used", "0 errors and 0 warnings in the clean browser session")
  .replace(
    "N/A because no browser/manual evidence was used",
    "server command pnpm dev; watch/reload mode watch; process or port ownership PID 123 on port 4173; restart/reload proof server restarted; expected API field probe returned created"
  )
  .replace("verification/browser freshness N/A", "verification/browser freshness yes");

const currentTddEvidence = `TDD closeout gate: canonical TDD evidence below passed the nested validator

TDD evidence

Final SHA: def5678

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #355 | read | ADR 0008 read | red-first public workflow | \`pnpm test -- workflow-order\` failed because Pressure appeared before staging | \`pnpm test -- workflow-order\` passed and observed Proposal then staging then Pressure | AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production test; sequence: Proposal -> staging -> Pressure observed by the test | N/A |

Verification command ledger:
| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---|---|
| \`pnpm test -- workflow-order\` | passed: 1 file and 3 tests; exit 0 | 1 | def5678 |

Existing-test contract-change rows: none

TDD closeout preflight:
- Durable sink/body inspected: issue #355 closeout comment
- Compact table/header: present after structural check
- Rows accounted for: all in-scope issues and seams listed
- Pre-red recovery status: N/A - pre-red preflight/table was visible before first red
- CONTEXT.md status: present
- ADRs/principles/docs status: present
- Acceptance atom map: all rows list authoritative atoms and proof surfaces
- Acceptance sequence map: all rows list ordered proof or justified sequence N/A
- Partial-red / red-first skip reasons: none
- Evidence-only rows freshness: none
- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows
- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows
- Evidence identity refresh: same-sink current/historical-red/superseded identity block inspected
- Existing-test contract-change rows: none

Evidence identity refresh:
- Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Historical red identities retained: none
- Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none
- Superseded-token sweep: N/A because every superseded category is none

TDD evidence gate passed: durable sink issue #355 closeout comment; compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status present; sequence evidence present; evidence identities present; partial-red / red-first skip reasons none; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none.
`;

const fallbackWithCurrentTdd = `${baseBody
  .replace(identityBlock, "")
  .replace("tdd fielded closeout gate N/A", "tdd fielded closeout gate yes after structural check")}
${currentTddEvidence}`;

test("accepts explicit no-browser fallback evidence", () => {
  const result = runValidator(baseBody);
  assert.equal(result.status, 0, result.stderr);
});

test("closing enforces the default and configured UTF-8 byte ceilings", () => {
  assert.equal(runValidator(baseBody, ["--closing"]).status, 0);
  assert.equal(runValidator(baseBody, ["--max-bytes", "100"]).status, 0);

  const configured = runValidator(baseBody, ["--closing", "--max-bytes", "100"]);
  assert.notEqual(configured.status, 0);
  assert.match(configured.stderr, /maximum is 100 bytes/);

  const defaultLimit = runValidator(baseBody.padEnd(65_537, "x"), ["--closing"]);
  assert.notEqual(defaultLimit.status, 0);
  assert.match(defaultLimit.stderr, /maximum is 65536 bytes/);

  const missingValue = runValidator(baseBody, ["--max-bytes"]);
  assert.equal(missingValue.status, 2);
  assert.match(missingValue.stderr, /--max-bytes requires a value/);

  const invalidValue = runValidator(baseBody, ["--max-bytes", "many"]);
  assert.equal(invalidValue.status, 2);
  assert.match(invalidValue.stderr, /--max-bytes must be a positive integer/);
});

test("accepts current backend evidence when --browser is used", () => {
  const result = runValidator(browserBody, ["--browser"]);
  assert.equal(result.status, 0, result.stderr);
});

test("accepts slash ownership and a domain-qualified expected API probe", () => {
  const semanticVariants = browserBody.replace(
    "process or port ownership PID 123 on port 4173; restart/reload proof server restarted; expected API field probe returned created",
    "process/port ownership PID 123 on port 4173; restart/reload proof server restarted; expected Propagation API field probe returned created"
  );
  const result = runValidator(semanticVariants, ["--browser"]);
  assert.equal(result.status, 0, result.stderr);

  const missingExpectedApiProbe = runValidator(
    semanticVariants.replace("; expected Propagation API field probe returned created", ""),
    ["--browser"]
  );
  assert.notEqual(missingExpectedApiProbe.status, 0);
  assert.match(missingExpectedApiProbe.stderr, /expected API field\/behavior probe/);
});

test("rejects no-browser and stale backend claims when --browser is used", () => {
  const noBrowser = runValidator(baseBody, ["--browser"]);
  assert.notEqual(noBrowser.status, 0);
  assert.match(noBrowser.stderr, /--browser requires current browser\/manual freshness/);

  const stale = runValidator(
    browserBody.replace(
      "server command pnpm dev; watch/reload mode watch; process or port ownership PID 123 on port 4173; restart/reload proof server restarted; expected API field probe returned created",
      "server reachable on port 4173"
    ),
    ["--browser"]
  );
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /Backend process currentness/);

  const copiedFixtureBody = browserBody
    .replace(
      "Current evidence identities: fixture paths none; browser sessions none",
      "Current evidence identities: fixture paths /tmp/review.sqlite; browser sessions none"
    )
    .replace(
      "expected API field probe returned created",
      "expected API field probe returned created; stateful fixture snapshot method sqlite .backup; snapshot source /srv/source.sqlite; expected-state probe GET /api/records returned record 42"
    );
  const copiedFixture = runValidator(copiedFixtureBody, ["--browser"]);
  assert.equal(copiedFixture.status, 0, copiedFixture.stderr);

  const missingSnapshot = runValidator(
    copiedFixtureBody.replace(
      "; stateful fixture snapshot method sqlite .backup; snapshot source /srv/source.sqlite; expected-state probe GET /api/records returned record 42",
      ""
    ),
    ["--browser"]
  );
  assert.notEqual(missingSnapshot.status, 0);
  assert.match(missingSnapshot.stderr, /stateful fixture snapshot/);

  const noStatefulCopy = runValidator(
    copiedFixtureBody.replace(
      "stateful fixture snapshot method sqlite .backup; snapshot source /srv/source.sqlite; expected-state probe GET /api/records returned record 42",
      "N/A because no stateful fixture was copied"
    ),
    ["--browser"]
  );
  assert.equal(noStatefulCopy.status, 0, noStatefulCopy.stderr);
});

test("requires exact sequence-aware child coverage when --child-family is used", () => {
  const missingManifest = runValidator(baseBody, ["--child-family"]);
  assert.notEqual(missingManifest.status, 0);
  assert.match(missingManifest.stderr, /acceptance manifest/);

  const childFlags = ["--child-family", "--acceptance-manifest", manifestPath];
  const missing = runValidator(baseBody, childFlags);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /PRD child coverage table header/);

  const childFamilyBody = baseBody
    .replace("child table N/A", "child table yes")
    .replace(
      "Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n\nResidual findings",
      `Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #359 | issue #359 AC1; sequence: N/A because AC1 is not sequence-sensitive | validator test | none |

Residual findings`
    );
  const complete = runValidator(childFamilyBody, childFlags);
  assert.equal(complete.status, 0, complete.stderr);

  const noSequence = runValidator(
    childFamilyBody.replace("; sequence: N/A because AC1 is not sequence-sensitive", ""),
    childFlags
  );
  assert.notEqual(noSequence.status, 0);
  assert.match(noSequence.stderr, /sequence:/);
});

test("accepts parent aliases and requires every adjacent story-map row", () => {
  const storyMap = `| Story | Exact proof |
|---|---|
| US1 | first child seam |
| US2 | second child seam |
| US3 | third child seam |
`;
  const body = baseBody
    .replace("child table N/A", "child table yes")
    .replace(
      "Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n\nResidual findings",
      `Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #359 | issue #359 Solution, Implementation Decisions, Testing Decisions, individual US1-US3 map below; sequence: N/A because these criteria are not sequence-sensitive | validator test | none |

${storyMap}
Residual findings`
    );
  const flags = ["--child-family", "--acceptance-manifest", structuredManifestPath];
  const complete = runValidator(body, flags);
  assert.equal(complete.status, 0, complete.stderr);

  const missingStories = runValidator(body.replace(`${storyMap}\n`, ""), flags);
  assert.notEqual(missingStories.status, 0);
  for (const story of ["US1", "US2", "US3"]) {
    assert.match(missingStories.stderr, new RegExp(`missing acceptance source ${story}`));
  }
});

test("requires exact sibling coverage when --issue-set is used", () => {
  const issueSetFlags = ["--issue-set", "--acceptance-manifest", siblingManifestPath];
  const issueSetBody = baseBody
    .replace("child table N/A", "child table yes")
    .replace(
      "Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n\nResidual findings",
      `Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #369 | issue #369 AC1-AC3; sequence: prepare -> validate and observe output | validator test | none |
| #370 | issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive | validator test | none |

Residual findings`
    );

  const missingManifest = runValidator(issueSetBody, ["--issue-set"]);
  assert.notEqual(missingManifest.status, 0);
  assert.match(missingManifest.stderr, /acceptance manifest/);

  const complete = runValidator(issueSetBody, issueSetFlags);
  assert.equal(complete.status, 0, complete.stderr);

  const missingSibling = runValidator(issueSetBody.replace(/^\| #370 .*\n/m, ""), issueSetFlags);
  assert.notEqual(missingSibling.status, 0);
  assert.match(missingSibling.stderr, /missing issue #370/);

  const unexpectedSibling = runValidator(
    issueSetBody.replace(
      "| #370 | issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive | validator test | none |",
      `| #370 | issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive | validator test | none |
| #371 | issue #371 AC1; sequence: N/A because AC1 is not sequence-sensitive | validator test | none |`
    ),
    issueSetFlags
  );
  assert.notEqual(unexpectedSibling.status, 0);
  assert.match(unexpectedSibling.stderr, /unexpected issue #371/);

  const missingCheck = runValidator(
    issueSetBody.replace(
      "issue #370 AC2; sequence: N/A because AC2 is not sequence-sensitive",
      "issue #370 criterion 2; sequence: N/A because criterion 2 is not sequence-sensitive"
    ),
    issueSetFlags
  );
  assert.notEqual(missingCheck.status, 0);
  assert.match(missingCheck.stderr, /missing acceptance source AC2/);
});

test("accepts current nested TDD evidence and rejects missing proof-server fields", () => {
  const complete = runValidator(fallbackWithCurrentTdd, [
    "--tdd",
    "--closing",
    "--expected-final-sha",
    "def5678"
  ]);
  assert.equal(complete.status, 0, complete.stderr);

  const missingPreflight = runValidator(
    fallbackWithCurrentTdd.replace(
      "- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows\n",
      ""
    ),
    ["--tdd"]
  );
  assert.notEqual(missingPreflight.status, 0);
  assert.match(missingPreflight.stderr, /Evidence-only proof server preflight/);

  const missingGateField = runValidator(
    fallbackWithCurrentTdd.replace("; proof server preflight N/A", ""),
    ["--tdd"]
  );
  assert.notEqual(missingGateField.status, 0);
  assert.match(missingGateField.stderr, /proof server preflight/);

  const parentRollup = runValidator(fallbackWithCurrentTdd, [
    "--tdd-parent-rollup",
    "--acceptance-manifest",
    tddManifestPath
  ]);
  assert.equal(parentRollup.status, 0, parentRollup.stderr);

  const missingManifest = runValidator(fallbackWithCurrentTdd, ["--tdd-parent-rollup"]);
  assert.notEqual(missingManifest.status, 0);
  assert.match(missingManifest.stderr, /requires an acceptance manifest/);
});

test("forwards --closing to nested TDD validation", () => {
  const localSinkBody = fallbackWithCurrentTdd.replaceAll("issue #355 closeout comment", "/tmp/review-closeout.md");
  const withoutClosing = runValidator(localSinkBody, ["--tdd"]);
  assert.equal(withoutClosing.status, 0, withoutClosing.stderr);

  const withClosing = runValidator(localSinkBody, [
    "--tdd",
    "--closing",
    "--expected-final-sha",
    "def5678"
  ]);
  assert.notEqual(withClosing.status, 0);
  assert.match(withClosing.stderr, /published TDD closeout field/);
});

test("requires sequence disposition for an ordinary zero-finding Spec review", () => {
  const result = runValidator(
    baseBody.replace("Spec sequence coverage: sequence: N/A because the reviewed acceptance is not sequence-sensitive\n", "")
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Spec sequence coverage/);
});

test("requires review-native evidence identity reconciliation", () => {
  const result = runValidator(baseBody.replace(identityBlock, ""));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Evidence identity refresh/);

  const hash = "a".repeat(64);
  const structured = runValidator(
    baseBody.replace(
      "fixture paths none; browser sessions none",
      `fixture paths withheld because issue #378 forbids local path publication; logical fixture world-alpha; content SHA-256 ${hash}; provenance generated from issue #378 seed; browser sessions none`
    )
  );
  assert.equal(structured.status, 0, structured.stderr);

  const legacy = runValidator(
    baseBody.replace(
      "fixture paths none; browser sessions none",
      "fixture paths none published because issue #378 forbids local path publication; browser sessions none"
    )
  );
  assert.notEqual(legacy.status, 0);
  assert.match(legacy.stderr, /must use the structured 'fixture paths withheld because/);
});

test("accepts the cross-validator-safe superseded-token sweep", () => {
  const body = baseBody
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

  const result = runValidator(body);
  assert.equal(result.status, 0, result.stderr);
});

test("fallback guidance plans closeout size before composition", () => {
  const fallback = readFileSync(new URL("../fallback-evidence.md", import.meta.url), "utf8");
  assert.match(fallback, /--review fallback --size-plan --require-headroom/);
  assert.match(fallback, /--select <issue\[:check-id\[,check-id\.\.\.\]\]>/);
  assert.match(fallback, /US1-US36.*does not replace individual story rows/);
});
