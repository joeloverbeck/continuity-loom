import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { unresolvedValue as reviewUnresolvedValue } from "../../code-review/scripts/review-evidence-contract.mjs";
import {
  DEFAULT_TDD_CLOSEOUT_BODY_MAX_BYTES,
  validateTddCloseoutBody
} from "./validate-tdd-closeout-body.mjs";

const validator = fileURLToPath(new URL("./validate-tdd-closeout-body.mjs", import.meta.url));
const expectedFinalSha = "abcdef0123456789";
const closingOptions = { flags: ["--closing"], expectedFinalSha };
const singleIssueManifest = {
  version: 1,
  issues: [
    {
      number: 1,
      title: "Single issue",
      checks: [{ id: "AC1", kind: "acceptance", text: "Exact workflow" }]
    }
  ]
};
const parentManifest = {
  version: 1,
  issues: [
    {
      number: 1,
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
        },
        { id: "AC1", kind: "acceptance", text: "First acceptance" },
        { id: "AC2", kind: "acceptance", text: "Second acceptance" },
        { id: "AC3", kind: "acceptance", text: "Third acceptance" },
        { id: "Principles", kind: "principles", text: "Principles/ADR conformance for #1" }
      ]
    }
  ]
};

const bodyWith = ({
  acceptance =
    "AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production browser; sequence: Proposal -> staging -> Pressure observed in one browser session",
  green = "`pnpm test -- workflow-order` passed and production browser observed Proposal then staging then Pressure",
  current = "fixture paths none; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png",
  historical = "fixture FAC-17 retained in the red row",
  superseded = "fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none",
  sweep = "N/A because every superseded category is none"
} = {}) => `TDD evidence

Final SHA: ${expectedFinalSha}

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #1 | read | ADR 0001 read | red-first public workflow | \`pnpm test -- workflow-order\` failed because Pressure appeared before staging | ${green} | ${acceptance} | N/A |

Verification command ledger:
| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---|---|
| \`pnpm test -- workflow-order\` | passed: 1 file and 3 tests; exit 0 | 1 | ${expectedFinalSha} |

Existing-test contract-change rows: none

TDD review-fix map: N/A because review created no TDD row changes

TDD closeout preflight:
- Durable sink/body inspected: test fixture
- Compact table/header: present after structural check
- Rows accounted for: all in-scope issues and seams listed
- Pre-red recovery status: N/A - pre-red preflight/table was visible before first red
- Pre-red evidence reference: issue #1 implementation ledger; anchor TDD preflight heading; chronology same-sink line order before first red command
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
- Current evidence identities: ${current}
- Historical red identities retained: ${historical}
- Superseded evidence identities: ${superseded}
- Superseded-token sweep: ${sweep}

TDD evidence gate passed: durable sink test fixture; compact table/header present after structural check; seams accounted for all listed; CONTEXT.md status present; ADRs/principles/docs status present; sequence evidence present; evidence identities present; partial-red / red-first skip reasons none; evidence-only rows none; proof server preflight N/A; existing-test contract-change rows none.
`;

const browserEvidenceBodyWith = (backendCurrentness) =>
  bodyWith()
    .replace("red-first public workflow", "evidence-only browser route")
    .replace(
      "- Evidence-only rows freshness: none",
      "- Evidence-only rows freshness: browser smoke rerun passed on final tree for route/action/API/fixture Propagation with observed outcome ready\n- Evidence-only browser console state: 0 errors and 0 warnings"
    )
    .replace(
      "- Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows",
      `- Evidence-only backend process currentness: ${backendCurrentness}`
    )
    .replace(
      "- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows",
      "- Evidence-only proof server preflight: configured API/UI ports 4173 and 5173; owner-check result occupied; unrelated pre-existing owners PID 100 and PID 101; isolated proof-owned ports 4174 and 5174 with proxy aligned; cleanup ownership proof PIDs only"
    );

const reviewFixBodyWith = () =>
  bodyWith()
    .replace(" | N/A |\n\nVerification command ledger:", " | RF-1 - review fix |\n\nVerification command ledger:")
    .replace(
      "TDD review-fix map: N/A because review created no TDD row changes",
      `TDD review-fix map:

| Finding ID | Finding/source | Intended red command/failure | Green command/evidence | Updated TDD table row | Regression durability | Browser/manual evidence freshness | Backend process currentness | Evidence identity refresh |
|---|---|---|---|---|---|---|---|---|
| RF-1 | closeout citation wording | red-first skipped because Standards-only/conformance-only fix did not change behavior | \`pnpm typecheck\` passed: 1 check | #1 / red-first public workflow | N/A because the intended red was not a transient browser/manual probe | N/A because no UI/routes/browser-consumed API/fixtures/action path changed | N/A because no browser/manual proof was used | same-sink current/historical-red/superseded identity block inspected |`
    );

const parentBodyWithStoryMap = () =>
  bodyWith({
    acceptance:
      "Solution/Implementation/Testing/Principles/US1-US3/AC1-AC3; atoms: parent requirements plus individual stories and acceptance checks; proof surfaces: adjacent story map and focused tests; sequence: N/A because these criteria are not sequence-sensitive"
  }).replace(
    "Verification command ledger:",
    `| Story | Exact proof |
|---|---|
| US1 | child seam one |
| US2 | child seam two |
| US3 | child seam three |

Verification command ledger:`
  );

test("accepts sequence evidence and reconciled evidence identities", () => {
  assert.deepEqual(validateTddCloseoutBody(bodyWith()), []);
});

test("parent-rollup manifest validation requires every individual story mapping", () => {
  const complete = parentBodyWithStoryMap();
  assert.deepEqual(
    validateTddCloseoutBody(complete, {
      flags: ["--parent-rollup"],
      acceptanceManifest: parentManifest
    }),
    []
  );

  const withoutStoryMap = complete.replace(
    /\| Story \| Exact proof \|\n\|---\|---\|\n\| US1 .+\n\| US2 .+\n\| US3 .+\n\n/,
    ""
  );
  const missingStoryErrors = validateTddCloseoutBody(withoutStoryMap, {
    flags: ["--parent-rollup"],
    acceptanceManifest: parentManifest
  });
  assert.deepEqual(
    missingStoryErrors.filter((error) => error.includes("missing TDD coverage for US")),
    [
      "acceptance manifest issue #1 is missing TDD coverage for US1",
      "acceptance manifest issue #1 is missing TDD coverage for US2",
      "acceptance manifest issue #1 is missing TDD coverage for US3"
    ]
  );
  assert.ok(
    validateTddCloseoutBody(complete, { flags: ["--parent-rollup"] }).some((error) =>
      error.includes("requires an acceptance manifest")
    )
  );
});

test("parent-rollup CLI requires and reads an acceptance manifest", () => {
  const directory = mkdtempSync(join(tmpdir(), "tdd-closeout-manifest-test-"));
  const bodyPath = join(directory, "body.md");
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(bodyPath, bodyWith());
  writeFileSync(manifestPath, JSON.stringify(singleIssueManifest));

  const missing = spawnSync(process.execPath, [validator, bodyPath, "--parent-rollup"], {
    encoding: "utf8"
  });
  const complete = spawnSync(
    process.execPath,
    [validator, bodyPath, "--parent-rollup", "--acceptance-manifest", manifestPath],
    { encoding: "utf8" }
  );
  rmSync(directory, { recursive: true, force: true });

  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /requires --acceptance-manifest/);
  assert.equal(complete.status, 0, complete.stderr);
});

test("closing rejects local staging paths while interim validation permits them", () => {
  const body = bodyWith().replaceAll("test fixture", "`/tmp/tdd-closeout.md`");

  assert.deepEqual(validateTddCloseoutBody(body), []);
  const closingErrors = validateTddCloseoutBody(body, closingOptions);
  assert.ok(
    closingErrors.some((error) =>
      error.includes("published TDD closeout field Durable sink/body inspected contains local staging path")
    )
  );
  assert.ok(
    closingErrors.some((error) =>
      error.includes("published TDD closeout field TDD evidence gate contains local staging path")
    )
  );
});

test("closing permits local fixture paths outside publishable sink fields", () => {
  const body = bodyWith({
    current:
      "fixture paths /tmp/worldloom-proof.sqlite; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png"
  });

  assert.deepEqual(validateTddCloseoutBody(body, closingOptions), []);
});

test("rejects a visible-before-red claim without a durable evidence reference", () => {
  const body = bodyWith().replace(/- Pre-red evidence reference: .+\n/, "");

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("Pre-red evidence reference is empty"))
  );
});

test("rejects a pre-red reference without an anchor and chronology proof", () => {
  const body = bodyWith().replace(
    /- Pre-red evidence reference: .+\n/,
    "- Pre-red evidence reference: implementation ledger says the preflight existed\n"
  );

  assert.ok(
    validateTddCloseoutBody(body).some((error) =>
      error.includes("exact heading/row/section/line anchor, and chronology proof")
    )
  );
});

test("accepts an anchored recovery addendum reference", () => {
  const body = bodyWith()
    .replace(
      "Pre-red recovery status: N/A - pre-red preflight/table was visible before first red",
      "Pre-red recovery status: listed with TDD recovery addendum"
    )
    .replace(
      /- Pre-red evidence reference: .+\n/,
      "- Pre-red evidence reference: TDD recovery addendum in issue #1 implementation ledger; section anchor Recovery RF-0\n"
    );

  assert.deepEqual(validateTddCloseoutBody(body), []);
});

test("closing rejects a local pre-red staging reference", () => {
  const body = bodyWith().replace(
    /- Pre-red evidence reference: .+\n/,
    "- Pre-red evidence reference: /tmp/tdd-ledger.md; anchor TDD preflight heading; chronology same-sink line order before first red command\n"
  );

  assert.ok(
    validateTddCloseoutBody(body, closingOptions).some((error) =>
      error.includes("published TDD closeout field Pre-red evidence reference contains local staging path")
    )
  );
});

test("closing rejects a body above the configured UTF-8 byte ceiling", () => {
  const errors = validateTddCloseoutBody(bodyWith(), { ...closingOptions, maxBytes: 100 });

  assert.ok(errors.some((error) => error.includes("maximum is 100 bytes")));
  assert.equal(DEFAULT_TDD_CLOSEOUT_BODY_MAX_BYTES, 65_536);
});

test("CLI enforces the configured byte ceiling", () => {
  const directory = mkdtempSync(join(tmpdir(), "tdd-closeout-size-test-"));
  const bodyPath = join(directory, "body.md");
  writeFileSync(bodyPath, bodyWith());

  const result = spawnSync(
    process.execPath,
    [validator, bodyPath, "--closing", "--expected-final-sha", expectedFinalSha, "--max-bytes", "100"],
    { encoding: "utf8" }
  );
  rmSync(directory, { recursive: true, force: true });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /maximum is 100 bytes/);
});

test("rejects backticked identifiers masquerading as red commands", () => {
  const body = bodyWith().replace(
    "`pnpm test -- workflow-order` failed because Pressure appeared before staging",
    "focused tests failed for `preview.outcomes` and `temporalSkipReason`"
  );

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("red command/failure is not concrete"))
  );
});

test("accepts an exact executable red command with its failure signal", () => {
  const body = bodyWith().replace(
    "`pnpm test -- workflow-order` failed because Pressure appeared before staging",
    "`node --test test/workflow-order.test.mjs` failed with assertion Pressure appeared before staging"
  );

  assert.deepEqual(validateTddCloseoutBody(body), []);
});

test("closing requires and validates the live expected final SHA", () => {
  assert.ok(
    validateTddCloseoutBody(bodyWith(), { flags: ["--closing"] }).some((error) =>
      error.includes("closing validation requires expected final SHA")
    )
  );

  const staleFinal = validateTddCloseoutBody(
    bodyWith().replace(`Final SHA: ${expectedFinalSha}`, "Final SHA: 1111111222222222"),
    closingOptions
  );
  assert.ok(staleFinal.some((error) => error.includes("does not match expected final SHA")));

  const staleReview = validateTddCloseoutBody(
    `${bodyWith()}\nReview frame: reviewed HEAD SHA 3333333444444444\n`,
    closingOptions
  );
  assert.ok(
    staleReview.some((error) =>
      error.includes("reviewed HEAD SHA 3333333444444444 does not match expected final SHA")
    )
  );
});

test("CLI closing mode requires the expected final SHA", () => {
  const directory = mkdtempSync(join(tmpdir(), "tdd-closeout-sha-test-"));
  const bodyPath = join(directory, "body.md");
  writeFileSync(bodyPath, bodyWith());

  const result = spawnSync(process.execPath, [validator, bodyPath, "--closing"], { encoding: "utf8" });
  rmSync(directory, { recursive: true, force: true });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--closing requires --expected-final-sha/);
});

test("closing requires a durable final-tree verification command ledger", () => {
  const withoutLedger = bodyWith().replace(
    /Verification command ledger:\n\| Exact command \| Observed result\/counts \| Run count \| Represented SHA\/tree \|\n\|---\|---\|---\|---\|\n\| `pnpm test -- workflow-order` \| passed: 1 file and 3 tests; exit 0 \| 1 \| abcdef0123456789 \|\n\n/,
    ""
  );
  assert.ok(
    validateTddCloseoutBody(withoutLedger, closingOptions).some((error) =>
      error.includes("missing verification command ledger header")
    )
  );

  const cases = [
    [
      "verification claimed",
      bodyWith().replace("passed: 1 file and 3 tests; exit 0", "verification claimed"),
      "must contain an output-derived result or count"
    ],
    ["zero run count", bodyWith().replace("| 1 | abcdef0123456789 |", "| 0 | abcdef0123456789 |"), "run count must be a positive integer"],
    [
      "stale represented tree",
      bodyWith().replace("| 1 | abcdef0123456789 |", "| 1 | 5555555666666666 |"),
      "does not match Final SHA"
    ],
    [
      "identifier command",
      bodyWith().replace("`pnpm test -- workflow-order` | passed: 1 file", "`preview.outcomes` | passed: 1 file"),
      "must contain an exact executable command"
    ]
  ];

  for (const [name, body, expectedError] of cases) {
    assert.ok(
      validateTddCloseoutBody(body, closingOptions).some((error) => error.includes(expectedError)),
      name
    );
  }
});

test("rejects a compact row without sequence evidence", () => {
  const body = bodyWith({
    acceptance: "AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: production browser"
  });

  assert.ok(validateTddCloseoutBody(body).some((error) => error.includes("must include atoms:, proof surfaces:, and sequence:")));
});

test("rejects sequence N/A without a reason", () => {
  const body = bodyWith({
    acceptance:
      "AC1 exact workflow; atoms: atomic; proof surfaces: focused test; sequence: N/A"
  });

  assert.ok(validateTddCloseoutBody(body).some((error) => error.includes("sequence N/A must include 'because'")));
});

test("rejects an empty sequence value", () => {
  const body = bodyWith({
    acceptance: "AC1 exact workflow; atoms: atomic; proof surfaces: focused test; sequence:"
  });

  assert.ok(validateTddCloseoutBody(body).some((error) => error.includes("empty sequence: value")));
});

test("rejects the circular atom wording from the published session closeout", () => {
  const body = bodyWith({
    acceptance:
      "AC1 exact workflow; atoms: every exact named contract and authority in the issue criteria; proof surfaces: production browser; sequence: Proposal -> staging -> Pressure observed in one browser session"
  });

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("uses a circular atom or proof-surface reference"))
  );
});

test("rejects an unanchored proof surface without matching concrete green evidence", () => {
  const body = bodyWith({
    acceptance:
      "AC1 exact workflow; atoms: proposal + staging + pressure; proof surfaces: server lifecycle suite; sequence: Proposal -> staging -> Pressure observed in one runtime",
    green: "verification passed"
  });

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("proof surfaces require a concrete test, command, path, route, artifact, URL, tracker reference, or matching concrete Green evidence"))
  );
});

test("rejects superseded identities without an active-proof sweep", () => {
  const body = bodyWith({
    superseded:
      "fixture paths old.sqlite; browser sessions old-session; packet paths/hashes old.txt deadbeef; active revisions run-1; artifacts old.png",
    sweep: "checked the body"
  });

  assert.ok(validateTddCloseoutBody(body).some((error) => error.includes("no active-proof hits")));
});

test("accepts cross-validator-safe sweep wording with classified historical red identities", () => {
  const body = bodyWith({
    historical: "FAC-17 retained only in the red command for row #1",
    superseded:
      "fixture paths old.sqlite; browser sessions old-session; packet paths/hashes old.txt deadbeef; active revisions run-1; artifacts old.png",
    sweep:
      "rg checked every exact superseded value; no hits outside classified identity/history lines and no active-proof hits; historical FAC-17 occurrence classified in row #1"
  });

  assert.deepEqual(validateTddCloseoutBody(body), []);
});

test("rejects one-sided superseded-token sweep wording", () => {
  const superseded =
    "fixture paths old.sqlite; browser sessions old-session; packet paths/hashes old.txt deadbeef; active revisions run-1; artifacts old.png";

  for (const sweep of [
    "rg checked every exact superseded value; no active-proof hits; historical-red hits classified as none",
    "rg checked every exact superseded value; no hits outside classified identity/history lines; historical-red hits classified as none"
  ]) {
    const errors = validateTddCloseoutBody(bodyWith({ superseded, sweep }));
    assert.ok(
      errors.some((error) =>
        error.includes("no hits outside classified identity/history lines and no active-proof hits")
      )
    );
  }
});

test("accepts slash ownership and a domain-qualified expected API field probe", () => {
  const body = browserEvidenceBodyWith(
    "server command pnpm dev; watch/reload mode active; process/port ownership PID 23056 on ports 5173 and 4173; restart/reload proof server restarted; expected Propagation API field probe returned blockers"
  );

  assert.deepEqual(validateTddCloseoutBody(body), []);
});

test("still rejects backend currentness without an expected API probe", () => {
  const body = browserEvidenceBodyWith(
    "server command pnpm dev; watch/reload mode active; process/port ownership PID 23056 on ports 5173 and 4173; restart/reload proof server restarted"
  );

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("expected API field/behavior probe"))
  );
});

test("rejects stale currentness commits in every repeated field", () => {
  const currentness =
    "server command pnpm dev; watch/reload mode active; process/port ownership PID 23056 on ports 5173 and 4173; restart/reload proof clean start from final committed SHA abcdef0; expected Propagation API field probe returned blockers";
  const base = `Final SHA: abcdef0123456789\n${reviewFixBodyWith("Browser/manual evidence freshness")}`
    .replace(
      "Evidence-only backend process currentness: N/A because no browser/manual evidence-only rows",
      `Evidence-only backend process currentness: ${currentness}`
    )
    .replace(
      "Backend process currentness: N/A because no browser/manual proof was used",
      `Backend process currentness: ${currentness}`
    );

  const duplicateErrors = validateTddCloseoutBody(
    `${base}\nBackend process currentness: ${currentness.replace("abcdef0", "1234567")}\n`
  );
  assert.ok(
    duplicateErrors.some((error) =>
      error.includes("Backend process currentness names commit 1234567, which does not match Final SHA abcdef0123456789")
    )
  );

  const evidenceOnlyErrors = validateTddCloseoutBody(
    base.replace(
      `Evidence-only backend process currentness: ${currentness}`,
      `Evidence-only backend process currentness: ${currentness.replace("abcdef0", "7654321")}`
    )
  );
  assert.ok(
    evidenceOnlyErrors.some((error) =>
      error.includes("Evidence-only backend process currentness names commit 7654321")
    )
  );
});

test("browser evidence rejects a proof-server preflight that claims no browser rows", () => {
  const body = browserEvidenceBodyWith(
    "server command pnpm dev; watch/reload mode active; process/port ownership PID 23056 on ports 5173 and 4173; restart/reload proof server restarted; expected API field probe returned blockers"
  ).replace(
    /- Evidence-only proof server preflight: .+/,
    "- Evidence-only proof server preflight: N/A because no browser/manual evidence-only rows"
  );

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("cannot use Evidence-only proof server preflight"))
  );
});

test("rejects an incomplete proof-server preflight", () => {
  const body = browserEvidenceBodyWith(
    "server command pnpm dev; watch/reload mode active; process/port ownership PID 23056 on ports 5173 and 4173; restart/reload proof server restarted; expected API field probe returned blockers"
  ).replace(
    /- Evidence-only proof server preflight: .+/,
    "- Evidence-only proof server preflight: configured API/UI ports 4173 and 5173; owner-check result occupied"
  );

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("unrelated pre-existing owners"))
  );
});

test("accepts a keyed one-finding review-fix map", () => {
  assert.deepEqual(validateTddCloseoutBody(reviewFixBodyWith()), []);
});

test("rejects the legacy bundled review-fix addendum", () => {
  const body = reviewFixBodyWith()
    .replace(/TDD review-fix map:\n\n\| Finding ID[\s\S]+?same-sink current\/historical-red\/superseded identity block inspected \|\n/, "")
    .concat("\nTDD review-fix addendum: several findings and commands bundled together\n");

  const errors = validateTddCloseoutBody(body);
  assert.ok(errors.some((error) => error.includes("TDD review-fix map disposition")));
  assert.ok(errors.some((error) => error.includes("exact keyed TDD review-fix map header")));
});

test("rejects a duplicate review-fix finding identity", () => {
  const body = reviewFixBodyWith().replace(
    "| RF-1 | closeout citation wording",
    "| RF-1 | duplicate finding | red-first skipped because Standards-only/conformance-only fix did not change behavior | `pnpm typecheck` passed: 1 check | #1 / red-first public workflow | N/A because the intended red was not a transient browser/manual probe | N/A because no UI/routes/browser-consumed API/fixtures/action path changed | N/A because no browser/manual proof was used | same-sink identity block inspected |\n| RF-1 | closeout citation wording"
  );

  assert.ok(validateTddCloseoutBody(body).some((error) => error.includes("duplicates Finding ID RF-1")));
});

test("rejects a review-fix map that does not target the exact compact seam", () => {
  const body = reviewFixBodyWith().replace("#1 / red-first public workflow", "#1 / missing seam");

  assert.ok(validateTddCloseoutBody(body).some((error) => error.includes("targets missing compact row")));
});

test("rejects one review-fix identity reused by a second compact TDD row", () => {
  const body = reviewFixBodyWith().replace(
    "| #1 | read | ADR 0001 read | red-first public workflow",
    `| #2 | read | ADR 0001 read | second public workflow | red-first skipped because Standards-only/conformance-only fix did not change behavior | \`pnpm typecheck\` passed | AC2; atoms: atomic; proof surfaces: second workflow test; sequence: N/A because criterion is not sequence-sensitive | RF-1 - review fix |
| #1 | read | ADR 0001 read | red-first public workflow`
  );

  assert.ok(
    validateTddCloseoutBody(body).some((error) =>
      error.includes("cites RF-1, but that map row targets a different compact TDD row")
    )
  );
});

test("review-fix map requires regression durability for transient browser red evidence", () => {
  const body = reviewFixBodyWith()
    .replace(
      "red-first skipped because Standards-only/conformance-only fix did not change behavior",
      "`node browser-red.mjs` failed during Playwright page assertion"
    )
    .replace("N/A because the intended red was not a transient browser/manual probe", "");

  assert.ok(
    validateTddCloseoutBody(body).some((error) =>
      error.includes("TDD review-fix map row 1 Regression durability is empty")
    )
  );
});

test("rejects unresolved evidence identity placeholders", () => {
  const body = bodyWith({
    current:
      "fixture paths <paths>; browser sessions none; packet paths/hashes none; active revisions none; artifacts none"
  });

  assert.ok(validateTddCloseoutBody(body).some((error) => error.includes("identity fields are empty or unresolved")));
});

test("accepts a complete authority-sensitive withheld fixture identity", () => {
  const hash = "a".repeat(64);
  const body = bodyWith({
    current:
      `fixture paths withheld because issue #378 forbids local path publication; logical fixture world-alpha; content SHA-256 ${hash}; provenance generated from issue #378 seed; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png`
  });

  assert.deepEqual(validateTddCloseoutBody(body), []);
});

test("rejects the legacy none-published-because fixture identity", () => {
  const body = bodyWith({
    current:
      "fixture paths none published because #378 forbids local path publication; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png"
  });

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("must use the structured 'fixture paths withheld because ...' identity form"))
  );
});

test("rejects an incomplete withheld fixture identity", () => {
  const body = bodyWith({
    current:
      "fixture paths withheld because #378 forbids local path publication; browser sessions issue-1; packet paths/hashes proposal.txt abc123; active revisions run-2; artifacts proof.png"
  });

  assert.ok(
    validateTddCloseoutBody(body).some((error) => error.includes("64-character content SHA-256"))
  );
});

test("downstream review validation rejects HTML-like angle tokens in compact values", () => {
  assert.equal(reviewUnresolvedValue("document `<body>` response evidence"), true);
  assert.equal(reviewUnresolvedValue("document body response evidence"), false);
});

test("guidance carries sink, snapshot, exactness, and shared closeout contracts", () => {
  const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");
  const testsGuide = readFileSync(new URL("../tests.md", import.meta.url), "utf8");
  const closeout = readFileSync(new URL("../closeout-evidence.md", import.meta.url), "utf8");

  assert.match(closeout, /When the exact body will be posted or linked for tracker closeout/);
  assert.doesNotMatch(closeout, /inspected body file path before tracker URL exists/);
  assert.match(skill, /two independent snapshots or server renders are not equivalent/);
  assert.match(skill, /every named value unless the source explicitly permits/);
  assert.match(skill, /Dependency state is a precondition, not a behavior red/);
  assert.match(skill, /Cross-workspace build freshness is a precondition, not a behavior red/);
  assert.match(skill, /current source or built output/);
  assert.match(skill, /partial red - wrong reason: stale upstream workspace build/);
  assert.match(skill, /rerun the exact focused command/);
  assert.match(skill, /Robustness harnesses are assurance after behavior green/);
  assert.match(skill, /docs\/robustness-testing\.md/);
  assert.match(skill, /canonical result gate/);
  assert.match(skill, /equivalence cannot be demonstrated/);
  assert.match(skill, /Published current evidence survives cleanup truthfully/);
  assert.match(skill, /Authority-sensitive fixture identity stays explicit/);
  assert.match(skill, /Before starting or attaching to any proof server/);
  assert.match(testsGuide, /SQLite `.backup`/);
  assert.match(closeout, /copied stateful fixture snapshot method\/source and expected-state probe/);
  assert.match(closeout, /Nested-validator angle-token check/);
  assert.match(closeout, /no hits outside classified identity\/history lines and no active-proof hits/);
  assert.match(closeout, /published current artifact is not safe to remove until closeout is complete/);
  assert.match(closeout, /Browser\/manual evidence freshness/);
  assert.match(closeout, /Pre-red evidence reference:/);
  assert.match(closeout, /TDD review-fix map:/);
  assert.match(skill, /repeat that ID in the exact compact TDD row/);
  assert.match(closeout, /65,536-byte body maximum/);
  assert.match(closeout, /wc -c/);
  assert.match(closeout, /every exact named contract in the issue criteria/);
  assert.match(closeout, /fixture paths withheld because/);
  assert.match(closeout, /Evidence-only proof server preflight:/);
  assert.match(closeout, /--expected-final-sha "\$\(git rev-parse HEAD\)"/);
  assert.match(closeout, /--acceptance-manifest <path>/);
  assert.match(closeout, /--size-plan --require-headroom/);
  assert.match(closeout, /multi-pass review or more than one TDD review fix/);
  assert.match(closeout, /must use the structured evidence JSON/);
  assert.match(closeout, /--evidence-input <evidence\.json>/);
  assert.match(closeout, /\.\.\/implement\/references\/closeout-templates\.md/);
  assert.match(closeout, /Do not hand-copy those derived fields/);
  assert.match(closeout, /--select <issue\[:check-id\[,check-id\.\.\.\]\]>/);
  assert.match(skill, /authoritative acceptance manifest/);
  assert.match(closeout, /\| Exact command \| Observed result\/counts \| Run count \| Represented SHA\/tree \|/);
  assert.match(closeout, /output-derived result or count/);
  assert.equal(
    closeout.match(/no hits outside classified identity\/history lines and no active-proof hits/g)?.length,
    3
  );
});
