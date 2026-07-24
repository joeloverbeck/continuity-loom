#!/usr/bin/env node
/**
 * Deterministic authorization/review helper for Skill Evolution.
 * Contract: archive/workflows/00_shared-skill-evolution-contract.md
 *
 * Imports the shared mechanical layer (hashing, event validation, atomic append,
 * gate derivation, locking, candidate landing utilities) from the Skill Evidence
 * Capture helper so all evidence workflows share one implementation of the store.
 * Agents never hand-edit events.jsonl or gate-status.json.
 *
 * Commands:
 *   preflight          Evaluate the diamond authorization gate. Prints either the
 *                      exact refusal block (exit 3) or the bounded evidence packet.
 *   claim              Re-run the preflight under the store lock and append
 *                      review_started; the review then owns the target.
 *   record-validation  Append validation_completed with the candidate's hash,
 *                      final risk tier, trial count, and acceptance decision.
 *   land               Verify baseline and validated-candidate hashes, back up the
 *                      live target, replace it, verify landed bytes, append
 *                      change_landed. Restores the baseline if verification fails.
 *   close              Append review_disposition (adjudicating the trigger events
 *                      by default) and re-derive the gate.
 *
 * Exit codes: 0 success; 3 refused, nothing mutated; 1 unsafe failure.
 */

import { randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DISPOSITIONS, Refusal, appendEventLine, deriveGate, detectRoot, diffDirs,
  hashSkillDir, readEventsFile, repoHead, resolveTargetDir, resolveTopLevelSessionId,
  skillKey, syncDir, validateEvent, withLock, writeGateStatus,
} from '../../skill-evidence-capture/scripts/evidence.mjs';

const OPERATOR = 'skill-evolution';
const RISK_TIERS = ['provisional', 'ordinary', 'high'];
const FINAL_RISK_TIERS = ['ordinary', 'high'];
const MIN_TRIALS = { ordinary: 3, high: 5 };

function fail(code, msg) {
  throw new Refusal(code, msg);
}

const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;

function selfSkillDir() {
  try { return realpathSync(dirname(dirname(fileURLToPath(import.meta.url)))); } catch { return null; }
}

// ---------- refusal shape (workflow: required refusal shape + terminal outcome) ----------

function refuse(state, failedCondition, terminalOutcome) {
  fail(3, 'Skill Evolution not authorized.\n'
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

/**
 * Diamond authorization gate. Must run under the store lock. Regenerates
 * gate-status.json from events.jsonl and the live hash; refuses (exit 3, exact
 * refusal shape) unless every term passes. Returns fresh {events, hash, status}.
 */
function authorize(ctx, nowMs) {
  const eventsFile = join(ctx.evidenceDir, 'events.jsonl');
  const { events, errors } = readEventsFile(eventsFile);
  const { hash } = hashSkillDir(ctx.targetReal);
  const status = deriveGate({
    events, errors, currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
  });
  writeGateStatus(ctx.evidenceDir, status);
  if (status.state === 'blocked') {
    refuse('blocked', 'event_stream_integrity_valid', 'refused_closed_gate');
  }
  if (status.state === 'review_in_progress') {
    refuse('review_in_progress', `gate_status.active_review_id IS null (active: ${status.active_review_id})`, 'refused_closed_gate');
  }
  if (status.state === 'eligible_pending_cooldown' || status.state === 'quarantined_pending_cooldown') {
    refuse(status.state, 'cooldown_or_different_session_condition_passed', 'refused_cooldown_or_same_session');
  }
  if (status.authorized_workflow !== 'skill-evolution'
      || !['eligible', 'quarantined_eligible'].includes(status.state)) {
    refuse(status.state, 'authorized_workflow == "skill-evolution" AND state IN {eligible, quarantined_eligible}', 'refused_closed_gate');
  }
  if (status.target_content_hash !== hash) {
    refuse(status.state, 'current_target_content_hash == gate_status.target_content_hash', 'refused_closed_gate');
  }
  return { events, hash, status };
}

function buildEvidencePacket(events, status) {
  const byId = new Map(events.map((e) => [e.event_id, e]));
  const triggers = status.trigger_event_ids.map((id) => byId.get(id)).filter(Boolean);
  const triggerKeys = new Set(triggers.map((e) => e.payload.symptom_key).filter(Boolean));
  const relatedPriorDispositions = events.filter((e) => e.event_type === 'review_disposition'
    && e.payload.adjudicated_event_ids.some((id) => {
      const adj = byId.get(id);
      return adj?.payload?.symptom_key != null && triggerKeys.has(adj.payload.symptom_key);
    }));
  return {
    trigger_events: triggers,
    qualifying_uses_on_current_hash: status.qualifying_uses_on_current_hash,
    open_incident_ids: status.open_incident_ids,
    candidate_clusters: status.candidate_clusters,
    related_prior_dispositions: relatedPriorDispositions,
    cited_evidence_refs: [...new Set(triggers.flatMap((e) => e.payload.evidence_refs ?? []))],
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

function findReview(events, reviewId) {
  const review = events.find((e) => e.event_type === 'review_started' && e.payload.review_id === reviewId);
  if (!review) fail(3, `No review_started event found for review ${reviewId}. Nothing done.`);
  return review;
}

function requireActiveReview(ctx, events, hash, reviewId, nowMs) {
  const status = deriveGate({
    events, errors: [], currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
  });
  if (status.active_review_id !== reviewId) {
    fail(3, `Review ${reviewId} does not own the target (active review: ${status.active_review_id ?? 'none'}). Nothing done.`);
  }
  return status;
}

const validationsFor = (events, reviewId) => events.filter(
  (e) => e.event_type === 'validation_completed' && e.payload.review_id === reviewId,
);

// ---------- commands ----------

function cmdPreflight(args) {
  const ctx = targetContext(args);
  mkdirSync(ctx.evidenceDir, { recursive: true });
  withLock(ctx.evidenceDir, () => {
    const { events, hash, status } = authorize(ctx, Date.now());
    const packet = buildEvidencePacket(events, status);
    process.stdout.write(`${JSON.stringify({
      authorized: true,
      target: { ...ctx.target, content_hash: hash },
      gate: {
        state: status.state,
        authorization_reason: status.authorization_reason,
        trigger_event_ids: status.trigger_event_ids,
        threshold_session_id: status.threshold_session_id,
      },
      evidence_packet: packet,
    }, null, 2)}\n`);
  });
}

function cmdClaim(args) {
  const riskTier = args.riskTier ?? 'provisional';
  if (!RISK_TIERS.includes(riskTier)) fail(3, `--risk-tier must be one of ${RISK_TIERS.join('|')}`);
  const ctx = targetContext(args);
  mkdirSync(ctx.evidenceDir, { recursive: true });
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const { events, hash, status } = authorize(ctx, nowMs);
    const reviewId = `rev_${randomUUID()}`;
    const proof = status.threshold_session_id !== null
      ? { type: 'different_session', threshold_session_id: status.threshold_session_id, review_session_id: ctx.sessionId }
      : { type: 'cooldown_elapsed', not_before: status.not_before, claimed_at: new Date(nowMs).toISOString() };
    const event = baseEvent(ctx, hash, nowMs, 'review_started', {
      review_id: reviewId,
      target_hash: hash,
      trigger_event_ids: status.trigger_event_ids,
      authorizing_rule: status.authorization_reason,
      risk_tier: riskTier,
      session_or_cooldown_proof: proof,
    });
    appendValidated(ctx, events, event);
    const after = deriveGate({
      events: [...events, event], errors: [], currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
    });
    writeGateStatus(ctx.evidenceDir, after);
    if (after.active_review_id !== reviewId) {
      fail(1, `Claim appended but another review owns the target (${after.active_review_id}). Stop without semantic analysis.`);
    }
    process.stdout.write(`${JSON.stringify({
      review_id: reviewId,
      state: after.state,
      target_hash: hash,
      authorizing_rule: status.authorization_reason,
      trigger_event_ids: status.trigger_event_ids,
      risk_tier: riskTier,
      evidence_dir: relative(ctx.root, ctx.evidenceDir).split(sep).join('/'),
    }, null, 2)}\n`);
  });
}

function cmdRecordValidation(args) {
  if (!isNonEmptyString(args.reviewId)) fail(3, 'Missing required --review-id.');
  if (!['accepted', 'rejected'].includes(args.decision)) fail(3, '--decision must be accepted|rejected.');
  if (!FINAL_RISK_TIERS.includes(args.riskTier)) fail(3, `--risk-tier must be final: ${FINAL_RISK_TIERS.join('|')}`);
  const trialCount = Number.parseInt(args.trials ?? '', 10);
  if (!Number.isInteger(trialCount) || trialCount < 1) fail(3, '--trials must be a positive integer.');
  if (args.decision === 'accepted' && trialCount < MIN_TRIALS[args.riskTier]) {
    fail(3, `An accepted ${args.riskTier} change requires at least ${MIN_TRIALS[args.riskTier]} paired trials; got ${trialCount}.`);
  }
  if (!isNonEmptyString(args.artifacts)) fail(3, 'Missing required --artifacts <path to retained trial outputs>.');
  const ctx = targetContext(args);
  const candidateReal = resolveTargetDir(ctx.root, args.candidate);
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const events = readValidStream(ctx);
    findReview(events, args.reviewId);
    const { hash } = hashSkillDir(ctx.targetReal);
    requireActiveReview(ctx, events, hash, args.reviewId, nowMs);
    const { hash: candidateHash } = hashSkillDir(candidateReal);
    const candRel = relative(ctx.root, candidateReal);
    const event = baseEvent(ctx, hash, nowMs, 'validation_completed', {
      review_id: args.reviewId,
      decision: args.decision,
      risk_tier: args.riskTier,
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
      risk_tier: args.riskTier,
      candidate_hash: candidateHash,
      trial_count: trialCount,
    }, null, 2)}\n`);
  });
}

function cmdLand(args) {
  if (!isNonEmptyString(args.reviewId)) fail(3, 'Missing required --review-id.');
  const ctx = targetContext(args);
  const candidateReal = resolveTargetDir(ctx.root, args.candidate);
  if (candidateReal === ctx.targetReal) fail(3, '--candidate must be the isolated copy, not the live target.');
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const events = readValidStream(ctx);
    const review = findReview(events, args.reviewId);
    const { hash: liveHash } = hashSkillDir(ctx.targetReal);
    requireActiveReview(ctx, events, liveHash, args.reviewId, nowMs);
    const baseline = review.payload.target_hash;
    if (liveHash !== baseline) {
      fail(3, `Live target hash ${liveHash.slice(0, 12)}… no longer equals the review baseline ${String(baseline).slice(0, 12)}…; `
        + 'the target changed since the claim. Authorization expired — stop without landing.');
    }
    const { hash: candidateHash } = hashSkillDir(candidateReal);
    if (candidateHash === liveHash) fail(3, 'Candidate is byte-identical to the live target; nothing to land.');
    const validations = validationsFor(events, args.reviewId);
    const accepted = validations.filter((e) => e.payload.decision === 'accepted');
    const latest = accepted[accepted.length - 1];
    if (!latest) fail(3, `No accepted validation_completed event exists for review ${args.reviewId}. Landing refused.`);
    if (latest.payload.candidate_hash !== candidateHash) {
      fail(3, 'Candidate bytes are not exactly those validated '
        + `(validated ${latest.payload.candidate_hash.slice(0, 12)}…, supplied ${candidateHash.slice(0, 12)}…). Landing refused.`);
    }
    const backupDir = join(ctx.evidenceDir, 'reviews', args.reviewId, 'pre-land-backup');
    if (existsSync(backupDir)) {
      fail(3, `Backup already exists at ${backupDir}; a prior land attempt ran for this review. Inspect before retrying.`);
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
      review_id: args.reviewId,
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

function cmdClose(args) {
  if (!isNonEmptyString(args.reviewId)) fail(3, 'Missing required --review-id.');
  if (!DISPOSITIONS.includes(args.disposition)) fail(3, `--disposition must be one of ${DISPOSITIONS.join('|')}`);
  if (!isNonEmptyString(args.note)) fail(3, 'Missing required --note: record the adjudication rationale in the immutable event.');
  const ctx = targetContext(args);
  withLock(ctx.evidenceDir, () => {
    const nowMs = Date.now();
    const events = readValidStream(ctx);
    const review = findReview(events, args.reviewId);
    const { hash } = hashSkillDir(ctx.targetReal);
    if (events.some((e) => e.event_type === 'review_disposition' && e.payload.review_id === args.reviewId)) {
      fail(3, `Review ${args.reviewId} already has a review_disposition. Nothing done.`);
    }
    const landed = events.some((e) => e.event_type === 'change_landed' && e.payload.review_id === args.reviewId);
    if (landed) {
      // change_landed already released target ownership in the gate projection;
      // the adjudicating disposition is still mandatory and must match the landing.
      if (args.disposition !== 'resolved_by_change') {
        fail(3, 'A change already landed for this review; the only valid disposition is resolved_by_change.');
      }
    } else {
      requireActiveReview(ctx, events, hash, args.reviewId, nowMs);
      if (args.disposition === 'resolved_by_change') {
        fail(3, 'resolved_by_change requires a change_landed event for this review; land first or pick a no-change disposition.');
      }
    }
    if (args.disposition === 'candidate_rejected_validation') {
      const vs = validationsFor(events, args.reviewId);
      if (!vs.length || vs[vs.length - 1].payload.decision !== 'rejected') {
        fail(3, 'candidate_rejected_validation requires the latest validation_completed for this review to record decision=rejected.');
      }
    }
    const known = new Set(events.map((e) => e.event_id));
    const extra = args.adjudicate ?? [];
    for (const id of extra) {
      if (!known.has(id)) fail(3, `--adjudicate references unknown event_id ${id}. Nothing done.`);
    }
    const adjudicated = [...new Set([...review.payload.trigger_event_ids, ...extra])];
    const event = baseEvent(ctx, hash, nowMs, 'review_disposition', {
      review_id: args.reviewId,
      disposition: args.disposition,
      adjudicated_event_ids: adjudicated,
      note: args.note,
    });
    appendValidated(ctx, events, event);
    const after = deriveGate({
      events: [...events, event], errors: [], currentHash: hash, target: ctx.target, sessionId: ctx.sessionId, nowMs,
    });
    writeGateStatus(ctx.evidenceDir, after);
    process.stdout.write(`${JSON.stringify({
      closed: args.reviewId,
      disposition: args.disposition,
      adjudicated_event_ids: adjudicated,
      state: after.state,
    }, null, 2)}\n`);
  });
}

// ---------- CLI ----------

function parseArgs(argv) {
  const args = { adjudicate: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) fail(3, `Unexpected argument: ${a}`);
    const key = a.slice(2);
    const val = argv[++i];
    if (val === undefined) fail(3, `Missing value for --${key}`);
    if (key === 'adjudicate') args.adjudicate.push(val);
    else args[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  }
  return args;
}

const HELP = `Deterministic Skill Evolution helper (shared skill-evolution contract).

Usage:
  evolution.mjs preflight --target <skill-dir> [--session-id <id>] [--root <repo-root>]
  evolution.mjs claim --target <skill-dir> [--risk-tier provisional|ordinary|high]
               [--session-id <id>] [--root <repo-root>]
  evolution.mjs record-validation --target <skill-dir> --review-id <id>
               --decision accepted|rejected --risk-tier ordinary|high
               --candidate <dir> --trials <count> --artifacts <path> [--summary "..."]
  evolution.mjs land --target <skill-dir> --review-id <id> --candidate <dir>
  evolution.mjs close --target <skill-dir> --review-id <id>
               --disposition <${DISPOSITIONS.join('|')}>
               --note "<adjudication rationale>" [--adjudicate <event-id>]...

Defaults: --root = git toplevel; --session-id defaults to the current host's top-level-session
identity ($CLAUDE_CODE_SESSION_ID or $CODEX_THREAD_ID), else "unavailable"; two conflicting host
identities at once fail closed. A fresh top-level session is any host session whose identity
differs from the threshold session, regardless of which supported host produced either.
Evidence lives under <root>/reports/skill-evidence/<skill-key>/. All writes are
lock-protected, append-only, and re-derive gate-status.json.
Exit codes: 0 ok; 3 refused, nothing mutated; 1 unsafe failure.
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
    else if (cmd === 'close') cmdClose(args);
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
