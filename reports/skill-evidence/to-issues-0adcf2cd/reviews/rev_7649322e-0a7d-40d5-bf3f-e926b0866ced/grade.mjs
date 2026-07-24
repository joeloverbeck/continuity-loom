#!/usr/bin/env node
// Deterministic grader for review rev_7649322e. Imports the target's exported validators
// (byte-identical in both versions per T9) and reports one compact verdict per trial.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const V = await import(resolve(".claude/skills/to-issues/scripts/validate-publication.mjs"));
const F = await import(resolve(".claude/skills/to-issues/scripts/verify-published-family.mjs"));

const T = "reports/skill-evidence/to-issues-0adcf2cd/reviews/rev_7649322e-0a7d-40d5-bf3f-e926b0866ced/trials";
const read = (p) => readFileSync(p, "utf8");
const base = (o = {}) => ({
  blockers: [], children: [], externalBlockers: [], expectAcCount: 1,
  expectChecklistNa: false, expectNoBlocker: false, expectStoryCoverage: false,
  expectStories: false, forbidLiterals: [], forbidPatterns: [], onlySlices: [],
  parent: null, placeholderRe: "#SLICE|PLACEHOLDER", sliceBodies: [], source: null,
  sourceRelationship: null, unaffectedSlices: [], ...o,
});
const failed = (checks) => Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

const trials = {
  t1: (p) => {
    const r = V.validateRunSheet(read(p), base({
      sliceBodies: [{ slice: "editor", path: `${T}/t1-body.md` }], onlySlices: ["editor"],
    }));
    return { rowCount: r.rowCount, fails: [...failed(r.checks), ...r.affected.flatMap((a) => failed(a.checks))] };
  },
  t2: (p) => ({ fails: F.validateWorkingPublicationState(JSON.parse(read(p))).errors ?? [] }),
  t3: (p) => {
    const r = V.validateChild(read(p), base({
      parent: "PRD #200", blockers: ["#202"], expectAcCount: 8, expectStories: true,
    }));
    return { actualBlockers: r.actualBlockers, fails: failed(r.checks) };
  },
  t4: (p) => ({ fails: failed(V.validateLedger(read(p), base({ children: ["#201", "#202", "#203"] })).checks) }),
  t5: (p) => ({ fails: F.validateManifest(JSON.parse(read(p))) }),
  t6: (p) => {
    const r = V.validateRunSheet(read(p), base({
      sliceBodies: [{ slice: "editor", path: `${T}/t6-body.md` }], unaffectedSlices: ["record"],
    }));
    return {
      rowCount: r.rowCount,
      fails: [...failed(r.checks), ...r.affected.flatMap((a) => failed(a.checks)),
        ...r.unaffected.flatMap((u) => failed(u.checks))],
    };
  },
  t7: (p) => ({
    fails: failed(V.validateChild(read(p), base({
      source: "#188", sourceRelationship: "predecessor of PRD #200; unblocks the compiler slice",
      expectAcCount: 3, expectNoBlocker: true,
    })).checks),
  }),
};

const [trial, path] = process.argv.slice(2);
const run = trials[trial];
if (!run) throw new Error(`unknown trial ${trial}`);
let out;
try {
  out = run(path);
} catch (error) {
  out = { fails: [`GRADER_ERROR: ${error.message}`] };
}
console.log(JSON.stringify({ trial, pass: out.fails.length === 0, ...out }));
