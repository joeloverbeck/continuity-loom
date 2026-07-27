import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  readdirSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'evolution.mjs');
const CAPTURE = join(HERE, '..', '..', 'skill-evidence-capture', 'scripts', 'evidence.mjs');
const SELF_SKILL_DIR = dirname(HERE);
const AUTHORIZED_REVIEW = join(SELF_SKILL_DIR, 'references', 'authorized-review.md');

function sandbox({ targetPath = '.claude/skills/demo-skill', mirror = 'ok' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'skill-evolution-test-'));
  const target = join(root, targetPath);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'SKILL.md'), '---\nname: demo-skill\n---\nDemo body v1.\n');
  if (targetPath === '.claude/skills/demo-skill' && mirror !== 'absent') {
    const mirrorDir = join(root, '.agents', 'skills');
    mkdirSync(mirrorDir, { recursive: true });
    const mirrorPath = join(mirrorDir, 'demo-skill');
    if (mirror === 'file') writeFileSync(mirrorPath, 'not a symlink\n');
    else {
      symlinkSync(
        mirror === 'broken' ? '../../.claude/skills/missing-skill' : '../../.claude/skills/demo-skill',
        mirrorPath,
      );
    }
  }
  return { root, target, rel: targetPath };
}

function run(script, args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { ...process.env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const evo = (sb, args) => run(SCRIPT, [...args, '--root', sb.root]);

function seedIncident(sb, label, session, key = 'execution', outcome = 'friction') {
  const r = run(CAPTURE, ['record', '--root', sb.root, '--target', sb.rel, '--session-id', session,
    '--outcome', outcome, '--task-label', label, '--symptom-key', key,
    '--expected', 'exp', '--observed', 'obs', '--consequence', 'cons', '--evidence-ref', `logs/${label}.txt`]);
  assert.equal(r.code, 0, r.err);
}

function seedClean(sb, label, session) {
  const r = run(CAPTURE, ['record', '--root', sb.root, '--target', sb.rel, '--session-id', session,
    '--outcome', 'clean', '--task-label', label]);
  assert.equal(r.code, 0, r.err);
}

/** Three independent friction incidents, one cluster: gate eligible from a fresh session. */
function seedEligible(sb) {
  seedIncident(sb, 'task a', 'sA');
  seedIncident(sb, 'task b', 'sB');
  seedIncident(sb, 'task c', 'sC');
}

const evidenceDir = (sb) => {
  const root = join(sb.root, 'reports', 'skill-evidence');
  const keys = readdirSync(root).filter((key) =>
    existsSync(join(root, key, 'events.jsonl')) || existsSync(join(root, key, 'gate-status.json')));
  assert.equal(keys.length, 1);
  return join(root, keys[0]);
};
const events = (sb) => readFileSync(join(evidenceDir(sb), 'events.jsonl'), 'utf8')
  .split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
const gate = (sb) => JSON.parse(readFileSync(join(evidenceDir(sb), 'gate-status.json'), 'utf8'));

function claimReview(sb, session = 'sFresh') {
  const r = evo(sb, ['claim', '--target', sb.rel, '--session-id', session]);
  assert.equal(r.code, 0, r.err);
  return JSON.parse(r.out);
}

function makeCandidate(sb, body = 'Demo body v2 (repaired).\n') {
  const cand = join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'reviews', 'cand');
  mkdirSync(cand, { recursive: true });
  cpSync(sb.target, cand, { recursive: true });
  writeFileSync(join(cand, 'SKILL.md'), `---\nname: demo-skill\n---\n${body}`);
  return cand;
}

function acceptValidation(sb, reviewId, cand, extra = []) {
  return evo(sb, ['record-validation', '--target', sb.rel, '--review-id', reviewId,
    '--decision', 'accepted', '--risk-tier', 'ordinary', '--candidate', cand,
    '--trials', '3', '--artifacts', 'reports/skill-evidence/demo-skill/reviews/trials', ...extra]);
}

test('authorized-review contract makes isolation and conflicting instruments mechanically decidable', () => {
  const contract = readFileSync(AUTHORIZED_REVIEW, 'utf8');
  assert.match(contract, /exactly one decisive instrument/i);
  assert.match(contract, /ordered tie-break/i);
  assert.match(contract, /before any candidate exists/i);
  assert.match(contract, /sibling-complete staging tree/i);
  assert.match(contract, /canonical relative depth/i);
  assert.match(contract, /harness artifact/i);
  assert.match(contract, /must not be counted as a trial result/i);
  assert.match(contract, /frozen behavioral instrument set/i);
  assert.match(contract, /required agent mirror[\s\S]*before (?:any )?live-target mutation/i);
  assert.match(contract, /absent or broken[\s\S]*refuses landing/i);
  assert.match(contract, /related_prior_incident_events/);
  assert.match(contract, /cluster_not_actionable/);
  assert.match(contract, /declined_event_ids/);
  assert.match(contract, /cannot by (?:itself|themselves) reauthorize/i);
  assert.match(contract, /later contemporaneous open incident/i);
});

test('preflight refuses a closed gate with the exact refusal shape', () => {
  const sb = sandbox();
  const r = evo(sb, ['preflight', '--target', sb.rel, '--session-id', 'sX']);
  assert.equal(r.code, 3);
  assert.equal(r.err,
    'Skill Evolution not authorized.\n'
    + 'Gate: closed.\n'
    + 'Failed condition: authorized_workflow == "skill-evolution" AND state IN {eligible, quarantined_eligible}.\n'
    + 'No target analysis or modification performed.\n'
    + 'Terminal outcome: refused_closed_gate.\n');
  assert.equal(gate(sb).state, 'closed');
  assert.equal(existsSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl')), false);
});

test('preflight in the threshold session refuses on cooldown; a fresh session passes with the bounded packet', () => {
  const sb = sandbox();
  seedEligible(sb);
  const same = evo(sb, ['preflight', '--target', sb.rel, '--session-id', 'sC']);
  assert.equal(same.code, 3);
  assert.match(same.err, /Gate: eligible_pending_cooldown\./);
  assert.match(same.err, /Failed condition: cooldown_or_different_session_condition_passed\./);
  assert.match(same.err, /Terminal outcome: refused_cooldown_or_same_session\./);
  const fresh = evo(sb, ['preflight', '--target', sb.rel, '--session-id', 'sFresh']);
  assert.equal(fresh.code, 0, fresh.err);
  const p = JSON.parse(fresh.out);
  assert.equal(p.authorized, true);
  assert.equal(p.gate.state, 'eligible');
  assert.equal(p.gate.authorization_reason, 'friction_recurrence:execution');
  assert.equal(p.evidence_packet.trigger_events.length, 3);
  assert.equal(p.evidence_packet.qualifying_uses_on_current_hash, 3);
  assert.deepEqual(p.evidence_packet.cited_evidence_refs,
    ['logs/task a.txt', 'logs/task b.txt', 'logs/task c.txt']);
});

test('preflight packet includes the incident bodies adjudicated by related prior dispositions', () => {
  const sb = sandbox();
  seedEligible(sb);
  const priorIds = [...gate(sb).trigger_event_ids];
  const first = claimReview(sb, 'first-review-session');
  const closed = evo(sb, ['close', '--target', sb.rel, '--review-id', first.review_id,
    '--disposition', 'monitor_for_recurrence', '--note', 'first cluster not reproduced']);
  assert.equal(closed.code, 0, closed.err);
  seedIncident(sb, 'later task d', 'sD');
  seedIncident(sb, 'later task e', 'sE');
  seedIncident(sb, 'later task f', 'sF');

  const preflight = evo(sb, ['preflight', '--target', sb.rel, '--session-id', 'second-review-session']);

  assert.equal(preflight.code, 0, preflight.err);
  const packet = JSON.parse(preflight.out).evidence_packet;
  assert.equal(packet.related_prior_dispositions.length, 1);
  assert.deepEqual(packet.related_prior_incident_events.map((event) => event.event_id), priorIds);
  for (const event of packet.related_prior_incident_events) {
    assert.equal(event.event_type, 'use_recorded');
    assert.equal(event.payload.symptom_key, 'execution');
    assert.equal(typeof event.payload.observed, 'string');
  }
});

test('preflight refuses a self-target before touching any store', () => {
  const sb = sandbox();
  const r = evo(sb, ['preflight', '--target', SELF_SKILL_DIR, '--session-id', 'sX']);
  assert.equal(r.code, 3);
  assert.match(r.err, /Failed condition: operator_skill_path != target_skill_path\./);
  assert.match(r.err, /Terminal outcome: refused_self_target\./);
  assert.equal(existsSync(join(sb.root, 'reports', 'skill-evidence', 'skill-evolution')), false);
});

test('claim appends review_started with proof, owns the target, and blocks further authorization', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  assert.match(c.review_id, /^rev_/);
  assert.equal(c.state, 'review_in_progress');
  assert.equal(c.trigger_event_ids.length, 3);
  const started = events(sb).find((e) => e.event_type === 'review_started');
  assert.equal(started.operator_workflow, 'skill-evolution');
  assert.equal(started.payload.risk_tier, 'provisional');
  assert.deepEqual(started.payload.session_or_cooldown_proof, {
    type: 'different_session', threshold_session_id: 'sC', review_session_id: 'sFresh',
  });
  const again = evo(sb, ['preflight', '--target', sb.rel, '--session-id', 'sOther']);
  assert.equal(again.code, 3);
  assert.match(again.err, /Gate: review_in_progress\./);
  assert.equal(evo(sb, ['claim', '--target', sb.rel, '--session-id', 'sOther']).code, 3);
});

test('record-validation enforces final tier minimum trials and freezes the candidate hash', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  const cand = makeCandidate(sb);
  const short = evo(sb, ['record-validation', '--target', sb.rel, '--review-id', c.review_id,
    '--decision', 'accepted', '--risk-tier', 'ordinary', '--candidate', cand,
    '--trials', '2', '--artifacts', 'x']);
  assert.equal(short.code, 3);
  assert.match(short.err, /at least 3 paired trials/);
  const ok = acceptValidation(sb, c.review_id, cand);
  assert.equal(ok.code, 0, ok.err);
  const v = events(sb).find((e) => e.event_type === 'validation_completed');
  assert.equal(v.payload.decision, 'accepted');
  assert.equal(typeof v.payload.candidate_hash, 'string');
});

test('full landing path: land verifies hashes, replaces bytes, keeps a backup; close resolves the evidence', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  const cand = makeCandidate(sb);
  assert.equal(acceptValidation(sb, c.review_id, cand).code, 0);
  const land = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);
  assert.equal(land.code, 0, land.err);
  const l = JSON.parse(land.out);
  assert.equal(l.landed, true);
  assert.equal(l.mirror_status, 'ok');
  assert.equal(l.before_hash, c.target_hash);
  assert.deepEqual(l.changed_files, { added: [], removed: [], modified: ['SKILL.md'] });
  assert.match(readFileSync(join(sb.target, 'SKILL.md'), 'utf8'), /repaired/);
  const backup = join(sb.root, l.backup, 'SKILL.md');
  assert.match(readFileSync(backup, 'utf8'), /v1/);
  assert.ok(events(sb).some((e) => e.event_type === 'change_landed' && e.payload.after_hash === l.after_hash));
  const close = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'resolved_by_change', '--note', 'mechanism repaired and validated']);
  assert.equal(close.code, 0, close.err);
  const g = gate(sb);
  assert.equal(g.state, 'closed');
  assert.equal(g.active_review_id, null);
  assert.equal(g.last_completed_review_id, c.review_id);
  const disp = events(sb).find((e) => e.event_type === 'review_disposition');
  assert.deepEqual([...disp.payload.adjudicated_event_ids].sort(), [...c.trigger_event_ids].sort());
});

test('a landed review can classify a baseline packet incident as declined when it closes', () => {
  const sb = sandbox();
  seedEligible(sb);
  seedIncident(sb, 'unexamined packet residual', 'sResidual', 'state');
  const residualId = events(sb).at(-1).event_id;
  const c = claimReview(sb);
  const cand = makeCandidate(sb);
  assert.equal(acceptValidation(sb, c.review_id, cand).code, 0);
  const land = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);
  assert.equal(land.code, 0, land.err);

  const close = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'resolved_by_change', '--note', 'mechanism repaired; residual not examined',
    '--decline', residualId]);

  assert.equal(close.code, 0, close.err);
  assert.deepEqual(JSON.parse(close.out).declined_event_ids, [residualId]);
  assert.deepEqual(events(sb).at(-1).payload.declined_event_ids, [residualId]);
});

test('close refuses to decline an incident recorded after the bounded packet claim', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  seedIncident(sb, 'post-claim incident', 'sAfterClaim', 'state');
  const postClaimId = events(sb).at(-1).event_id;

  const close = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'cluster_not_actionable', '--note', 'packet premise failed',
    '--decline', postClaimId]);

  assert.equal(close.code, 3);
  assert.match(close.err, /not in this review's bounded evidence packet/);
  assert.equal(events(sb).some((event) => event.event_type === 'review_disposition'), false);
});

test('land refuses an absent or broken required mirror before any live-target mutation', () => {
  for (const { fixtureMirror, expectedStatus } of [
    { fixtureMirror: 'absent', expectedStatus: 'absent' },
    { fixtureMirror: 'broken', expectedStatus: 'broken' },
    { fixtureMirror: 'file', expectedStatus: 'broken' },
  ]) {
    const sb = sandbox({ mirror: fixtureMirror });
    seedEligible(sb);
    const c = claimReview(sb);
    const cand = makeCandidate(sb);
    assert.equal(acceptValidation(sb, c.review_id, cand).code, 0);
    const beforeTarget = readFileSync(join(sb.target, 'SKILL.md'));
    const beforeEventCount = events(sb).length;

    const r = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);

    assert.equal(r.code, 3, `${fixtureMirror}: ${r.err}`);
    assert.match(r.err, new RegExp(`Required agent mirror is ${expectedStatus}`));
    assert.match(r.err, /landing refused before live-target mutation/i);
    assert.deepEqual(readFileSync(join(sb.target, 'SKILL.md')), beforeTarget);
    assert.equal(events(sb).length, beforeEventCount);
    assert.equal(events(sb).some((e) => e.event_type === 'change_landed'), false);
    assert.equal(
      existsSync(join(evidenceDir(sb), 'reviews', c.review_id, 'pre-land-backup')),
      false,
    );
    rmSync(sb.root, { recursive: true, force: true });
  }
});

test('land retains successful non-applicable-mirror behavior outside the canonical skill tree', () => {
  const sb = sandbox({ targetPath: 'custom-skills/demo-skill', mirror: 'absent' });
  seedEligible(sb);
  const c = claimReview(sb);
  const cand = makeCandidate(sb);
  assert.equal(acceptValidation(sb, c.review_id, cand).code, 0);

  const r = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);

  assert.equal(r.code, 0, r.err);
  assert.equal(JSON.parse(r.out).mirror_status, 'not_applicable');
  assert.match(readFileSync(join(sb.target, 'SKILL.md'), 'utf8'), /repaired/);
});

test('land refuses when the live target moved after the claim', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  const cand = makeCandidate(sb);
  assert.equal(acceptValidation(sb, c.review_id, cand).code, 0);
  appendFileSync(join(sb.target, 'SKILL.md'), 'concurrent edit\n');
  const r = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);
  assert.equal(r.code, 3);
  assert.match(r.err, /no longer equals the review baseline/);
  assert.equal(events(sb).some((e) => e.event_type === 'change_landed'), false);
});

test('land refuses a candidate whose bytes were not the ones validated, and refuses without an accepted validation', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  const cand = makeCandidate(sb);
  const early = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);
  assert.equal(early.code, 3);
  assert.match(early.err, /No accepted validation_completed/);
  assert.equal(acceptValidation(sb, c.review_id, cand).code, 0);
  appendFileSync(join(cand, 'SKILL.md'), 'post-validation drift\n');
  const drift = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);
  assert.equal(drift.code, 3);
  assert.match(drift.err, /not exactly those validated/);
  assert.match(readFileSync(join(sb.target, 'SKILL.md'), 'utf8'), /v1/);
});

test('close enforces disposition consistency and a mandatory note', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  const noNote = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'monitor_for_recurrence']);
  assert.equal(noNote.code, 3);
  assert.match(noNote.err, /--note/);
  const noLand = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'resolved_by_change', '--note', 'x']);
  assert.equal(noLand.code, 3);
  assert.match(noLand.err, /requires a change_landed event/);
  const noReject = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'candidate_rejected_validation', '--note', 'x']);
  assert.equal(noReject.code, 3);
  assert.match(noReject.err, /decision=rejected/);
  const ok = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'monitor_for_recurrence', '--note', 'mechanism not established; watch for recurrence']);
  assert.equal(ok.code, 0, ok.err);
  assert.equal(gate(sb).state, 'closed');
  assert.equal(gate(sb).open_incident_ids.length, 0);
  const again = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'monitor_for_recurrence', '--note', 'x']);
  assert.equal(again.code, 3);
  assert.match(again.err, /already has a review_disposition/);
});

test('close records cluster_not_actionable with validated declined open incidents', () => {
  const sb = sandbox();
  seedIncident(sb, 'threshold incident', 's0', 'cost');
  for (let i = 1; i <= 9; i++) seedClean(sb, `clean ${i}`, `s${i}`);
  const triggerId = gate(sb).trigger_event_ids[0];
  seedIncident(sb, 'unexamined residual', 's10', 'execution');
  const declinedId = events(sb).at(-1).event_id;
  const c = claimReview(sb, 'sFresh');

  const unknown = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'cluster_not_actionable', '--note', 'cluster premise failed',
    '--decline', 'evt_unknown']);
  assert.equal(unknown.code, 3);
  assert.match(unknown.err, /--decline references unknown event_id/);

  const overlap = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'cluster_not_actionable', '--note', 'cluster premise failed',
    '--decline', triggerId]);
  assert.equal(overlap.code, 3);
  assert.match(overlap.err, /cannot be both adjudicated and declined/);

  const closed = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'cluster_not_actionable', '--note', 'authorization held; cluster premise failed',
    '--decline', declinedId]);
  assert.equal(closed.code, 0, closed.err);
  const output = JSON.parse(closed.out);
  assert.equal(output.disposition, 'cluster_not_actionable');
  assert.deepEqual(output.declined_event_ids, [declinedId]);
  const disposition = events(sb).at(-1);
  assert.equal(disposition.event_type, 'review_disposition');
  assert.equal(disposition.payload.disposition, 'cluster_not_actionable');
  assert.deepEqual(disposition.payload.adjudicated_event_ids, [triggerId]);
  assert.deepEqual(disposition.payload.declined_event_ids, [declinedId]);
});

test('a rejected validation supports candidate_rejected_validation and forbids landing', () => {
  const sb = sandbox();
  seedEligible(sb);
  const c = claimReview(sb);
  const cand = makeCandidate(sb);
  const rej = evo(sb, ['record-validation', '--target', sb.rel, '--review-id', c.review_id,
    '--decision', 'rejected', '--risk-tier', 'ordinary', '--candidate', cand,
    '--trials', '3', '--artifacts', 'trials', '--summary', 'regression on core case']);
  assert.equal(rej.code, 0, rej.err);
  const land = evo(sb, ['land', '--target', sb.rel, '--review-id', c.review_id, '--candidate', cand]);
  assert.equal(land.code, 3);
  const close = evo(sb, ['close', '--target', sb.rel, '--review-id', c.review_id,
    '--disposition', 'candidate_rejected_validation', '--note', 'regression on core case; no second candidate']);
  assert.equal(close.code, 0, close.err);
});

test('quarantined_eligible (severe incident) authorizes from a fresh session', () => {
  const sb = sandbox();
  seedIncident(sb, 'deploy', 'sA', 'state', 'severe_incident');
  const r = evo(sb, ['preflight', '--target', sb.rel, '--session-id', 'sFresh']);
  assert.equal(r.code, 0, r.err);
  const p = JSON.parse(r.out);
  assert.equal(p.gate.state, 'quarantined_eligible');
  assert.equal(p.gate.authorization_reason, 'severe');
});

test('a corrupt event stream refuses with the integrity condition', () => {
  const sb = sandbox();
  seedEligible(sb);
  appendFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl'), 'not json\n');
  const r = evo(sb, ['preflight', '--target', sb.rel, '--session-id', 'sFresh']);
  assert.equal(r.code, 3);
  assert.match(r.err, /Gate: blocked\./);
  assert.match(r.err, /Failed condition: event_stream_integrity_valid\./);
});

// ---------- portable top-level-session identity (#151) ----------

// Run with both supported host vars explicitly controlled ('' means absent), so an
// inherited CLAUDE_CODE_SESSION_ID from the test host cannot pollute host resolution.
function runEnv(script, args, env) {
  const r = spawnSync(process.execPath, [script, ...args],
    { encoding: 'utf8', env: { ...process.env, CLAUDE_CODE_SESSION_ID: '', CODEX_THREAD_ID: '', ...env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
// Complete a three-incident friction threshold whose final event is recorded from `env`'s host.
function seedThresholdFromHost(sb, label, env) {
  seedIncident(sb, 'task a', 'sA');
  seedIncident(sb, 'task b', 'sB');
  const r3 = runEnv(CAPTURE, ['record', '--root', sb.root, '--target', sb.rel,
    '--outcome', 'friction', '--task-label', label, '--symptom-key', 'execution',
    '--expected', 'exp', '--observed', 'obs', '--consequence', 'cons', '--evidence-ref', `logs/${label}.txt`],
    env);
  assert.equal(r3.code, 0, r3.err);
}

test('AC3/AC4: a Codex threshold refuses in the same thread and authorizes from a different one', () => {
  const sb = sandbox();
  seedThresholdFromHost(sb, 'task c', { CODEX_THREAD_ID: 'codex-thread-c' });
  assert.equal(gate(sb).threshold_session_id, 'codex-thread-c');
  // AC3: same Codex thread stays eligible_pending_cooldown and Skill Evolution refuses.
  const same = runEnv(SCRIPT, ['preflight', '--target', sb.rel, '--root', sb.root],
    { CODEX_THREAD_ID: 'codex-thread-c' });
  assert.equal(same.code, 3);
  assert.match(same.err, /Gate: eligible_pending_cooldown\./);
  assert.match(same.err, /Terminal outcome: refused_cooldown_or_same_session\./);
  // AC4: a different Codex thread satisfies the fresh-session term and is authorized.
  const fresh = runEnv(SCRIPT, ['preflight', '--target', sb.rel, '--root', sb.root],
    { CODEX_THREAD_ID: 'codex-thread-d' });
  assert.equal(fresh.code, 0, fresh.err);
  const p = JSON.parse(fresh.out);
  assert.equal(p.authorized, true);
  assert.equal(p.gate.state, 'eligible');
  assert.equal(p.gate.threshold_session_id, 'codex-thread-c');
});

test('cross-host: a Claude-session threshold authorizes a preflight from a different Codex thread', () => {
  const sb = sandbox();
  seedThresholdFromHost(sb, 'task c', { CLAUDE_CODE_SESSION_ID: 'claude-c' });
  assert.equal(gate(sb).threshold_session_id, 'claude-c');
  const fresh = runEnv(SCRIPT, ['preflight', '--target', sb.rel, '--root', sb.root],
    { CODEX_THREAD_ID: 'codex-d' });
  assert.equal(fresh.code, 0, fresh.err);
  assert.equal(JSON.parse(fresh.out).gate.state, 'eligible');
});

test('conflicting host identities fail closed in a preflight, appending nothing', () => {
  const sb = sandbox();
  seedEligible(sb);
  const before = readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl'));
  const r = runEnv(SCRIPT, ['preflight', '--target', sb.rel, '--root', sb.root],
    { CLAUDE_CODE_SESSION_ID: 'claude-x', CODEX_THREAD_ID: 'codex-y' });
  assert.equal(r.code, 3);
  assert.match(r.err, /[Cc]onflict/);
  assert.deepEqual(readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl')), before);
});
