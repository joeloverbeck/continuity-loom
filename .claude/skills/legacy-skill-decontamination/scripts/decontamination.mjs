#!/usr/bin/env node
/**
 * Deterministic eligibility/run helper for Legacy Skill Decontamination.
 * Contract: archive/workflows/00_shared-skill-evolution-contract.md
 *
 * Imports the shared mechanical layer (hashing, event validation, atomic append,
 * gate derivation, locking, candidate landing utilities) from the Skill Evidence
 * Capture helper so all evidence workflows share one implementation of the store.
 * Agents never hand-edit events.jsonl or gate-status.json.
 *
 * Commands:
 *   preflight          Evaluate the one-time legacy eligibility gate. Prints either
 *                      the exact refusal block (exit 3) or the eligibility packet.
 *   claim              Re-run the gate under the store lock, snapshot the baseline
 *                      copy, and append decontamination_started; the run then owns
 *                      the target.
 *   record-validation  Append validation_completed with the candidate's hash, the
 *                      (always high) risk tier, trial count, and acceptance decision.
 *   land               Verify baseline and validated-candidate hashes, back up the
 *                      live target, replace it, verify landed bytes, append
 *                      change_landed. Restores the baseline if verification fails.
 *   complete           Append decontamination_completed with one terminal outcome
 *                      and re-derive the gate; closes the run's target ownership.
 *
 * Exit codes: 0 success; 3 refused, nothing mutated; 1 unsafe failure.
 */

import { randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Refusal, appendEventLine, deriveGate, detectRoot, diffDirs, hashSkillDir,
  readEventsFile, repoHead, resolveTargetDir, resolveTopLevelSessionId, skillKey,
  syncDir, validateEvent, withLock, writeGateStatus,
} from '../../skill-evidence-capture/scripts/evidence.mjs';

const OPERATOR = 'legacy-skill-decontamination';
const BASES = ['owner-confirmed', 'audit-history', 'imported', 'routed-review'];
const OUTCOMES = [
  'validated_simplification_landed', 'healthy_no_change', 'candidate_rejected_validation',
  'blocked_no_valid_test', 'superseded_by_target_version',
];
/** Outcomes that adjudicate the legacy baseline and close one-time eligibility. */
const ADJUDICATING = ['validated_simplification_landed', 'healthy_no_change', 'candidate_rejected_validation'];
const MIN_TRIALS = 5; // every decontamination is a broad change: high tier, no lower option

function fail(code, msg) {
  throw new Refusal(code, msg);
}

const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;

function selfSkillDir() {
  try { return realpathSync(dirname(dirname(fileURLToPath(import.meta.url)))); } catch { return null; }
}

// ---------- refusal shape (required refusal block + terminal outcome) ----------

function refuse(state, failedCondition, terminalOutcome) {
  fail(3, 'Legacy Skill Decontamination not eligible.\n'
    + `Gate: ${state}.\n`
    + `Failed condition: ${failedCondition}.\n`
    + 'No target analysis or modification performed.\n'
    + `Terminal outcome: ${terminalOutcome}.`);
}

// ---------- shared context ----------

function targetContext(args) {
  const root = detectRoot(args.root);
  const targetReal = resolveTargetDir(root, args.target);
  const self = selfSkillDir();
  if (self !== null && targetReal === self) {
    refuse('not derived (self-target)', 'operator_skill_path != target_skill_path', 'refused_self_target');
  }
  const key = skillKey(root, targetReal);
  const rel = relative(root, targetReal);
  const repoRelativePath = rel.startsWith('..') ? targetReal : rel.split(sep).join('/');
  const target = { name: targetReal.split(sep).pop(), repo_relative_path: repoRelativePath };
  const evidenceDir = join(root, 'reports', 'skill-evidence', key);
  const sessionId = resolveTopLevelSessionId({ explicit: args.sessionId });
  return { root, targetReal, target, evidenceDir, sessionId };
}

const completionsIn = (events) => events.filter((e) => e.event_type === 'decontamination_completed');

/**
 * One-time legacy eligibility gate. Must run under the store lock. Refuses
 * (exit 3, exact refusal shape) unless the target is legacy-eligible for this
 * run: valid event stream, no other review or pending Skill Evolution
 * authorization owns the target, no adjudicating completion covers the legacy
 * baseline, and an accepted basis is supplied. Returns fresh {events, hash, status}.
 */
function checkEligibility(ctx, args, nowMs) {
  const { events, errors } = readEventsFile(join(ctx.evidenceDir, 'events.jsonl'));
  const { hash } = hashSkillDir(ctx.targetReal);
  const status = deriveGate({
    events, errors, currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
  });
  writeGateStatus(ctx.evidenceDir, status);
  if (status.state === 'blocked') {
    refuse('blocked', 'event_stream_integrity_valid', 'refused_not_legacy_eligible');
  }
  if (status.active_review_id !== null) {
    refuse('review_in_progress', `no_other_review_owns_target (active: ${status.active_review_id})`, 'refused_not_legacy_eligible');
  }
  if (status.authorized_workflow === 'skill-evolution') {
    refuse(status.state, 'no_pending_skill_evolution_authorization — run or resolve Skill Evolution first', 'refused_not_legacy_eligible');
  }

  const completions = completionsIn(events);
  const coveredNow = completions.find(
    (c) => ADJUDICATING.includes(c.payload.outcome) && c.target.content_hash === hash,
  );
  if (coveredNow) {
    refuse('covered', `no_completed_decontamination_covers_target_version (run ${coveredNow.payload.review_id}, `
      + `outcome ${coveredNow.payload.outcome})`, 'refused_already_completed');
  }

  const basis = args.basis;
  if (!BASES.includes(basis)) {
    refuse('not derived', `accepted_legacy_basis_provided (--basis ${BASES.join('|')})`, 'refused_not_legacy_eligible');
  }
  if (basis === 'routed-review') {
    const known = new Map(events.map((e) => [e.event_id, e]));
    const ref = known.get(args.basisRef);
    if (!isNonEmptyString(args.basisRef) || !ref || ref.event_type !== 'review_disposition') {
      refuse('not derived', 'routed_review_basis_cites_existing_review_disposition (--basis-ref <event-id>)', 'refused_not_legacy_eligible');
    }
  } else if ((basis === 'audit-history' || basis === 'imported') && !isNonEmptyString(args.basisNote)) {
    refuse('not derived', `${basis.replace('-', '_')}_basis_describes_provenance (--basis-note)`, 'refused_not_legacy_eligible');
  }

  const adjudicatedEver = completions.find((c) => ADJUDICATING.includes(c.payload.outcome));
  if (adjudicatedEver && basis !== 'routed-review') {
    refuse('covered', `legacy_baseline_already_adjudicated (run ${adjudicatedEver.payload.review_id}, `
      + `outcome ${adjudicatedEver.payload.outcome}); a changed target re-enters only through an `
      + 'evidence-backed routed-review basis', 'refused_already_completed');
  }

  const blockedNow = completions.find(
    (c) => c.payload.outcome === 'blocked_no_valid_test' && c.target.content_hash === hash,
  );
  if (blockedNow && !isNonEmptyString(args.basisNote)) {
    refuse('blocked_rerun', `blocked_rerun_names_new_corpus_material (run ${blockedNow.payload.review_id} was `
      + 'blocked_no_valid_test on this same version; --basis-note must name the newly available corpus material)', 'refused_not_legacy_eligible');
  }

  return { events, hash, status, completions };
}

function legacyBasisPayload(args) {
  return {
    basis: args.basis,
    ref: args.basisRef ?? null,
    note: args.basisNote ?? null,
  };
}

function baseEvent(ctx, hash, nowMs, type, payload) {
  return {
    schema_version: 1,
    event_id: `evt_${randomUUID()}`,
    event_type: type,
    recorded_at: new Date(nowMs).toISOString(),
    operator_workflow: OPERATOR,
    target: { ...ctx.target, content_hash: hash, repo_head: repoHead(ctx.root) },
    top_level_session_id: ctx.sessionId,
    payload,
  };
}

function appendValidated(ctx, events, event) {
  const errs = validateEvent(event, new Set(events.map((e) => e.event_id)));
  if (errs.length) fail(1, `Constructed event failed validation — nothing appended:\n  ${errs.join('\n  ')}`);
  appendEventLine(join(ctx.evidenceDir, 'events.jsonl'), event);
}

function readValidStream(ctx) {
  const { events, errors } = readEventsFile(join(ctx.evidenceDir, 'events.jsonl'));
  if (errors.length) fail(1, `Event stream integrity failure — nothing done:\n  ${errors.join('\n  ')}`);
  return events;
}

function findRun(events, runId) {
  const run = events.find((e) => e.event_type === 'decontamination_started' && e.payload.review_id === runId);
  if (!run) fail(3, `No decontamination_started event found for run ${runId}. Nothing done.`);
  return run;
}

function requireActiveRun(ctx, events, hash, runId, nowMs) {
  const status = deriveGate({
    events, errors: [], currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
  });
  if (status.active_review_id !== runId) {
    fail(3, `Run ${runId} does not own the target (active review: ${status.active_review_id ?? 'none'}). Nothing done.`);
  }
  return status;
}

const validationsFor = (events, runId) => events.filter(
  (e) => e.event_type === 'validation_completed' && e.payload.review_id === runId,
);

const evidenceRel = (ctx) => relative(ctx.root, ctx.evidenceDir).split(sep).join('/');

// ---------- commands ----------

function cmdPreflight(args) {
  const ctx = targetContext(args);
  mkdirSync(ctx.evidenceDir, { recursive: true });
  withLock(ctx.evidenceDir, () => {
    const { hash, status, completions } = checkEligibility(ctx, args, Date.now());
    process.stdout.write(`${JSON.stringify({
      eligible: true,
      target: { ...ctx.target, content_hash: hash },
      gate_state: status.state,
      legacy_basis: legacyBasisPayload(args),
      open_incident_count: status.open_incident_ids.length,
      prior_completions: completions.map((c) => ({
        run_id: c.payload.review_id, outcome: c.payload.outcome, target_hash: c.target.content_hash,
      })),
      min_paired_trials: MIN_TRIALS,
      evidence_dir: evidenceRel(ctx),
      artifacts_dir: `${evidenceRel(ctx)}/decontamination`,
    }, null, 2)}\n`);
  });
}

function cmdClaim(args) {
  const trials = Number.parseInt(args.trials ?? String(MIN_TRIALS), 10);
  if (!Number.isInteger(trials) || trials < MIN_TRIALS) {
    fail(3, `--trials must be an integer >= ${MIN_TRIALS}: every decontamination is a broad change.`);
  }
  const ctx = targetContext(args);
  mkdirSync(ctx.evidenceDir, { recursive: true });
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const { events, hash } = checkEligibility(ctx, args, nowMs);
    const runId = `dec_${randomUUID()}`;
    const runDir = join(ctx.evidenceDir, 'decontamination', runId);
    const baselineDir = join(runDir, 'baseline');
    mkdirSync(baselineDir, { recursive: true });
    cpSync(ctx.targetReal, baselineDir, { recursive: true });
    if (hashSkillDir(baselineDir).hash !== hash) {
      rmSync(runDir, { recursive: true, force: true });
      fail(1, 'Baseline snapshot did not reproduce the live target hash; nothing recorded.');
    }
    const event = baseEvent(ctx, hash, nowMs, 'decontamination_started', {
      review_id: runId,
      target_hash: hash,
      legacy_basis: legacyBasisPayload(args),
      provisional_trial_count: trials,
      risk_rationale: args.riskRationale ?? null,
    });
    appendValidated(ctx, events, event);
    const after = deriveGate({
      events: [...events, event], errors: [], currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
    });
    writeGateStatus(ctx.evidenceDir, after);
    if (after.active_review_id !== runId) {
      fail(1, `Claim appended but another review owns the target (${after.active_review_id}). Stop without semantic analysis.`);
    }
    process.stdout.write(`${JSON.stringify({
      run_id: runId,
      state: after.state,
      target_hash: hash,
      baseline_copy: relative(ctx.root, baselineDir).split(sep).join('/'),
      provisional_trial_count: trials,
      evidence_dir: evidenceRel(ctx),
    }, null, 2)}\n`);
  });
}

function cmdRecordValidation(args) {
  if (!isNonEmptyString(args.runId)) fail(3, 'Missing required --run-id.');
  if (!['accepted', 'rejected'].includes(args.decision)) fail(3, '--decision must be accepted|rejected.');
  const trialCount = Number.parseInt(args.trials ?? '', 10);
  if (!Number.isInteger(trialCount) || trialCount < 1) fail(3, '--trials must be a positive integer.');
  if (args.decision === 'accepted' && trialCount < MIN_TRIALS) {
    fail(3, `An accepted decontamination candidate requires at least ${MIN_TRIALS} paired trials (always a broad change); got ${trialCount}.`);
  }
  if (!isNonEmptyString(args.artifacts)) fail(3, 'Missing required --artifacts <path to retained trial outputs>.');
  const ctx = targetContext(args);
  const candidateReal = resolveTargetDir(ctx.root, args.candidate);
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const events = readValidStream(ctx);
    findRun(events, args.runId);
    const { hash } = hashSkillDir(ctx.targetReal);
    requireActiveRun(ctx, events, hash, args.runId, nowMs);
    const { hash: candidateHash } = hashSkillDir(candidateReal);
    const candRel = relative(ctx.root, candidateReal);
    const event = baseEvent(ctx, hash, nowMs, 'validation_completed', {
      review_id: args.runId,
      decision: args.decision,
      risk_tier: 'high',
      candidate_hash: candidateHash,
      candidate_path: candRel.startsWith('..') ? candidateReal : candRel.split(sep).join('/'),
      trial_count: trialCount,
      artifacts_path: args.artifacts,
      summary: args.summary ?? null,
    });
    appendValidated(ctx, events, event);
    const after = deriveGate({
      events: [...events, event], errors: [], currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
    });
    writeGateStatus(ctx.evidenceDir, after);
    process.stdout.write(`${JSON.stringify({
      recorded: event.event_id,
      decision: args.decision,
      risk_tier: 'high',
      candidate_hash: candidateHash,
      trial_count: trialCount,
    }, null, 2)}\n`);
  });
}

function cmdLand(args) {
  if (!isNonEmptyString(args.runId)) fail(3, 'Missing required --run-id.');
  const ctx = targetContext(args);
  const candidateReal = resolveTargetDir(ctx.root, args.candidate);
  if (candidateReal === ctx.targetReal) fail(3, '--candidate must be the isolated copy, not the live target.');
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const events = readValidStream(ctx);
    const run = findRun(events, args.runId);
    const { hash: liveHash } = hashSkillDir(ctx.targetReal);
    requireActiveRun(ctx, events, liveHash, args.runId, nowMs);
    const baseline = run.payload.target_hash;
    if (liveHash !== baseline) {
      fail(3, `Live target hash ${liveHash.slice(0, 12)}… no longer equals the run baseline ${String(baseline).slice(0, 12)}…; `
        + 'the target changed since the claim. Stop without landing and complete with superseded_by_target_version.');
    }
    const { hash: candidateHash } = hashSkillDir(candidateReal);
    if (candidateHash === liveHash) fail(3, 'Candidate is byte-identical to the live target; nothing to land.');
    const validations = validationsFor(events, args.runId);
    const accepted = validations.filter((e) => e.payload.decision === 'accepted');
    const latest = accepted[accepted.length - 1];
    if (!latest) fail(3, `No accepted validation_completed event exists for run ${args.runId}. Landing refused.`);
    if (latest.payload.candidate_hash !== candidateHash) {
      fail(3, 'Candidate bytes are not exactly those validated '
        + `(validated ${latest.payload.candidate_hash.slice(0, 12)}…, supplied ${candidateHash.slice(0, 12)}…). Landing refused.`);
    }
    const backupDir = join(ctx.evidenceDir, 'decontamination', args.runId, 'pre-land-backup');
    if (existsSync(backupDir)) {
      fail(3, `Backup already exists at ${backupDir}; a prior land attempt ran for this run. Inspect before retrying.`);
    }
    mkdirSync(backupDir, { recursive: true });
    cpSync(ctx.targetReal, backupDir, { recursive: true });
    if (hashSkillDir(backupDir).hash !== liveHash) {
      rmSync(backupDir, { recursive: true, force: true });
      fail(1, 'Backup copy did not reproduce the live baseline hash; landing aborted before any target change.');
    }
    syncDir(candidateReal, ctx.targetReal);
    const landedHash = hashSkillDir(ctx.targetReal).hash;
    if (landedHash !== candidateHash) {
      syncDir(backupDir, ctx.targetReal);
      const restoredHash = hashSkillDir(ctx.targetReal).hash;
      fail(1, `Landing verification failed: landed hash ${landedHash.slice(0, 12)}… != candidate hash. `
        + (restoredHash === baseline
          ? 'Live baseline restored from backup.'
          : `RESTORE ALSO FAILED (live hash ${restoredHash.slice(0, 12)}…); recover from ${backupDir} or Git.`));
    }
    const changedFiles = diffDirs(backupDir, ctx.targetReal);
    let mirrorStatus = 'not_applicable';
    if (ctx.target.repo_relative_path.startsWith('.claude/skills/')) {
      const mirror = join(ctx.root, '.agents', 'skills', ctx.target.name);
      try {
        mirrorStatus = existsSync(mirror) && realpathSync(mirror) === ctx.targetReal ? 'ok' : (existsSync(mirror) ? 'broken' : 'absent');
      } catch { mirrorStatus = 'broken'; }
    }
    const event = baseEvent(ctx, landedHash, nowMs, 'change_landed', {
      review_id: args.runId,
      before_hash: baseline,
      after_hash: landedHash,
      changed_files: changedFiles,
      mirror_status: mirrorStatus,
    });
    appendValidated(ctx, events, event);
    const after = deriveGate({
      events: [...events, event], errors: [], currentHash: landedHash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
    });
    writeGateStatus(ctx.evidenceDir, after);
    process.stdout.write(`${JSON.stringify({
      landed: true,
      before_hash: baseline,
      after_hash: landedHash,
      changed_files: changedFiles,
      mirror_status: mirrorStatus,
      backup: relative(ctx.root, backupDir).split(sep).join('/'),
    }, null, 2)}\n`);
  });
}

function cmdComplete(args) {
  if (!isNonEmptyString(args.runId)) fail(3, 'Missing required --run-id.');
  if (!OUTCOMES.includes(args.outcome)) fail(3, `--outcome must be one of ${OUTCOMES.join('|')}`);
  if (!isNonEmptyString(args.note)) fail(3, 'Missing required --note: record the completion rationale in the immutable event.');
  const ctx = targetContext(args);
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const events = readValidStream(ctx);
    const run = findRun(events, args.runId);
    if (events.some((e) => e.event_type === 'decontamination_completed' && e.payload.review_id === args.runId)) {
      fail(3, `Run ${args.runId} already has a decontamination_completed event. Nothing done.`);
    }
    const { hash: liveHash } = hashSkillDir(ctx.targetReal);
    const landed = events.some((e) => e.event_type === 'change_landed' && e.payload.review_id === args.runId);
    if (landed) {
      // change_landed already released target ownership in the gate projection;
      // the completion event is still mandatory and must match the landing.
      if (args.outcome !== 'validated_simplification_landed') {
        fail(3, 'A change already landed for this run; the only valid outcome is validated_simplification_landed.');
      }
    } else {
      requireActiveRun(ctx, events, liveHash, args.runId, nowMs);
      if (args.outcome === 'validated_simplification_landed') {
        fail(3, 'validated_simplification_landed requires a change_landed event for this run; land first or pick a no-change outcome.');
      }
      const baseline = run.payload.target_hash;
      if (liveHash !== baseline && args.outcome !== 'superseded_by_target_version') {
        fail(3, `Live target hash ${liveHash.slice(0, 12)}… no longer equals the run baseline; `
          + 'the only valid outcome is superseded_by_target_version.');
      }
      if (liveHash === baseline && args.outcome === 'superseded_by_target_version') {
        fail(3, 'superseded_by_target_version requires the live target to differ from the run baseline; it is unchanged.');
      }
      if (args.outcome === 'candidate_rejected_validation') {
        const vs = validationsFor(events, args.runId);
        if (!vs.length || vs[vs.length - 1].payload.decision !== 'rejected') {
          fail(3, 'candidate_rejected_validation requires the latest validation_completed for this run to record decision=rejected.');
        }
      }
    }
    const event = baseEvent(ctx, liveHash, nowMs, 'decontamination_completed', {
      review_id: args.runId,
      outcome: args.outcome,
      note: args.note,
    });
    appendValidated(ctx, events, event);
    const after = deriveGate({
      events: [...events, event], errors: [], currentHash: liveHash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
    });
    writeGateStatus(ctx.evidenceDir, after);
    process.stdout.write(`${JSON.stringify({
      completed: args.runId,
      outcome: args.outcome,
      state: after.state,
      report_path: `${evidenceRel(ctx)}/decontamination/${args.runId}.md`,
    }, null, 2)}\n`);
  });
}

// ---------- CLI ----------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) fail(3, `Unexpected argument: ${a}`);
    const key = a.slice(2);
    const val = argv[++i];
    if (val === undefined) fail(3, `Missing value for --${key}`);
    args[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  }
  return args;
}

const HELP = `Deterministic Legacy Skill Decontamination helper (shared skill-evolution contract).

Usage:
  decontamination.mjs preflight --target <skill-dir> --basis <${BASES.join('|')}>
               [--basis-ref <event-id>] [--basis-note "..."]
               [--session-id <id>] [--root <repo-root>]
  decontamination.mjs claim --target <skill-dir> --basis <...> [--basis-ref <event-id>]
               [--basis-note "..."] [--trials <n, min ${MIN_TRIALS}>] [--risk-rationale "..."]
               [--session-id <id>] [--root <repo-root>]
  decontamination.mjs record-validation --target <skill-dir> --run-id <id>
               --decision accepted|rejected --candidate <dir> --trials <count>
               --artifacts <path> [--summary "..."]
  decontamination.mjs land --target <skill-dir> --run-id <id> --candidate <dir>
  decontamination.mjs complete --target <skill-dir> --run-id <id>
               --outcome <${OUTCOMES.join('|')}>
               --note "<completion rationale>"

Bases: owner-confirmed (standing owner confirmation of repeated old-audit rounds),
audit-history (--basis-note describes the recovered modification history),
imported (--basis-note describes the equivalent accretion provenance),
routed-review (--basis-ref cites the routing review_disposition event).
Defaults: --root = git toplevel; --session-id defaults to the current host's top-level-session
identity ($CLAUDE_CODE_SESSION_ID or $CODEX_THREAD_ID), else "unavailable"; two conflicting host
identities at once fail closed. Evidence lives under <root>/reports/skill-evidence/<skill-key>/; run artifacts under
its decontamination/<run-id>/ directory. All writes are lock-protected, append-only,
and re-derive gate-status.json. Exit codes: 0 ok; 3 refused, nothing mutated; 1 unsafe failure.
`;

function main() {
  const cmd = process.argv[2];
  if (cmd === undefined || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(HELP);
    process.exit(cmd === undefined ? 3 : 0);
  }
  try {
    const args = parseArgs(process.argv.slice(3));
    if (cmd === 'preflight') cmdPreflight(args);
    else if (cmd === 'claim') cmdClaim(args);
    else if (cmd === 'record-validation') cmdRecordValidation(args);
    else if (cmd === 'land') cmdLand(args);
    else if (cmd === 'complete') cmdComplete(args);
    else fail(3, `Unknown command: ${cmd}. See --help.`);
  } catch (err) {
    if (err instanceof Refusal) {
      process.stderr.write(`${err.message}\n`);
      process.exit(err.code);
    }
    process.stderr.write(`Unsafe failure: ${err.message}\n`);
    process.exit(1);
  }
}

const isMain = process.argv[1] !== undefined
  && (() => { try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } })();
if (isMain) main();
