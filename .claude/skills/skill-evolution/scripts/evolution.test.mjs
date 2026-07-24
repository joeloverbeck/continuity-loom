import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'evolution.mjs');
const CAPTURE = join(HERE, '..', '..', 'skill-evidence-capture', 'scripts', 'evidence.mjs');
const SELF_SKILL_DIR = dirname(HERE);

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), 'skill-evolution-test-'));
  const target = join(root, '.claude', 'skills', 'demo-skill');
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'SKILL.md'), '---\nname: demo-skill\n---\nDemo body v1.\n');
  return { root, target, rel: '.claude/skills/demo-skill' };
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

/** Three independent friction incidents, one cluster: gate eligible from a fresh session. */
function seedEligible(sb) {
  seedIncident(sb, 'task a', 'sA');
  seedIncident(sb, 'task b', 'sB');
  seedIncident(sb, 'task c', 'sC');
}

const events = (sb) => readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl'), 'utf8')
  .split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
const gate = (sb) => JSON.parse(readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'gate-status.json'), 'utf8'));

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
