import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTopLevelSessionId } from './evidence.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'evidence.mjs');
const SELF_SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), 'skill-evidence-test-'));
  const target = join(root, '.claude', 'skills', 'demo-skill');
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'SKILL.md'), '---\nname: demo-skill\n---\nDemo body.\n');
  return { root, target, rel: '.claude/skills/demo-skill' };
}

function run(args, env = {}) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

const incidentArgs = (outcome, key, label, session) => [
  '--outcome', outcome, '--task-label', label, '--session-id', session,
  '--symptom-key', key, '--expected', 'exp', '--observed', 'obs', '--consequence', 'cons',
];

function record(sb, extra, session = 's-default') {
  return run(['record', '--root', sb.root, '--target', sb.rel, '--session-id', session, ...extra]);
}

const events = (sb) => readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl'), 'utf8')
  .split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
const gate = (sb) => JSON.parse(readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'gate-status.json'), 'utf8'));

test('clean use records one event, gate closed, exact reply template', () => {
  const sb = sandbox();
  const r = record(sb, ['--outcome', 'clean', '--task-label', 'Task one']);
  assert.equal(r.code, 0, r.err);
  const evs = events(sb);
  assert.equal(evs.length, 1);
  const e = evs[0];
  assert.equal(e.event_type, 'use_recorded');
  assert.equal(e.payload.outcome, 'clean');
  assert.equal(e.payload.symptom_key, null);
  assert.equal(e.top_level_session_id, 's-default');
  assert.equal(r.out, `Evidence recorded: ${e.event_id}.\nGate: closed.\nNo action authorized.\n`);
  const g = gate(sb);
  assert.equal(g.state, 'closed');
  assert.equal(g.qualifying_uses_on_current_hash, 1);
  assert.equal(g.target_content_hash, e.target.content_hash);
});

test('duplicate run group on unchanged target is refused, nothing written', () => {
  const sb = sandbox();
  assert.equal(record(sb, ['--outcome', 'clean', '--task-label', 'same task']).code, 0);
  const r = record(sb, ['--outcome', 'clean', '--task-label', 'Same  TASK'], 's-other');
  assert.equal(r.code, 3);
  assert.match(r.err, /Duplicate receipt refused/);
  assert.equal(events(sb).length, 1);
});

test('three independent friction incidents in one cluster fire the gate; fresh session sees eligible', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'execution', 'task a', 'sA'));
  record(sb, incidentArgs('friction', 'execution', 'task b', 'sB'));
  assert.equal(gate(sb).state, 'collecting');
  const r3 = record(sb, incidentArgs('friction', 'execution', 'task c', 'sC'));
  assert.equal(r3.code, 0);
  assert.match(r3.out, /Gate: eligible pending fresh-session\/cooldown requirement/);
  assert.match(r3.out, /Skill Evolution is not authorized in this session/);
  assert.equal(gate(sb).state, 'eligible_pending_cooldown');
  const d = run(['derive', '--root', sb.root, '--target', sb.rel, '--session-id', 'sD']);
  assert.equal(d.code, 0);
  const g = JSON.parse(d.out);
  assert.equal(g.state, 'eligible');
  assert.equal(g.authorized_workflow, 'skill-evolution');
  assert.equal(g.authorization_reason, 'friction_recurrence:execution');
  assert.equal(g.threshold_session_id, 'sC');
  assert.equal(g.trigger_event_ids.length, 3);
});

test('two independent material failures fire the material recurrence gate', () => {
  const sb = sandbox();
  record(sb, incidentArgs('material_failure', 'output', 'task a', 'sA'));
  const r2 = record(sb, incidentArgs('material_failure', 'output', 'task b', 'sB'));
  assert.equal(r2.code, 0);
  assert.equal(gate(sb).state, 'eligible_pending_cooldown');
  const d = run(['derive', '--root', sb.root, '--target', sb.rel, '--session-id', 'fresh']);
  assert.equal(JSON.parse(d.out).authorization_reason, 'material_recurrence:output');
});

test('same-session incidents with same task are not independent', () => {
  const sb = sandbox();
  record(sb, [...incidentArgs('friction', 'execution', 'task a', 'sA'), '--same-run-group', 'g1']);
  record(sb, [...incidentArgs('friction', 'execution', 'task a', 'sA'), '--same-run-group', 'g2']);
  record(sb, [...incidentArgs('friction', 'execution', 'task a', 'sA'), '--same-run-group', 'g3']);
  const g = gate(sb);
  assert.equal(g.state, 'collecting');
  assert.equal(g.candidate_clusters[0].independent_incidents, 1);
});

test('one contemporaneous severe incident quarantines the target', () => {
  const sb = sandbox();
  const r = record(sb, incidentArgs('severe_incident', 'state', 'deploy task', 'sA'));
  assert.equal(r.code, 0);
  assert.match(r.out, /Gate: target quarantined pending fresh Skill Evolution eligibility/);
  assert.match(r.out, /Stop using the target\. Immediate operational containment is allowed; permanent skill edits are not\./);
  assert.equal(gate(sb).state, 'quarantined_pending_cooldown');
  const d = run(['derive', '--root', sb.root, '--target', sb.rel, '--session-id', 'fresh']);
  const g = JSON.parse(d.out);
  assert.equal(g.state, 'quarantined_eligible');
  assert.equal(g.authorization_reason, 'severe');
});

test('retrospective without evidence refs is inadmissible; with refs it records', () => {
  const sb = sandbox();
  const r1 = record(sb, ['--outcome', 'clean', '--task-label', 'old task', '--retrospective']);
  assert.equal(r1.code, 3);
  assert.match(r1.err, /memory alone is inadmissible/i);
  assert.equal(existsSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl')), false);
  const r2 = record(sb, ['--outcome', 'clean', '--task-label', 'old task', '--retrospective',
    '--evidence-ref', 'reports/some-artifact.md']);
  assert.equal(r2.code, 0);
  assert.equal(events(sb)[0].payload.retrospective, true);
});

test('a retrospective incident never completes a threshold; the next contemporaneous one does', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'cost', 'task a', 'sA'));
  record(sb, incidentArgs('friction', 'cost', 'task b', 'sB'));
  record(sb, [...incidentArgs('friction', 'cost', 'task c', 'sC'), '--retrospective', '--evidence-ref', 'log.txt']);
  assert.equal(gate(sb).state, 'collecting');
  record(sb, incidentArgs('friction', 'cost', 'task d', 'sD'));
  assert.equal(gate(sb).state, 'eligible_pending_cooldown');
});

test('non-clean outcome requires symptom key and facts; clean forbids them', () => {
  const sb = sandbox();
  const r1 = record(sb, ['--outcome', 'friction', '--task-label', 'task x']);
  assert.equal(r1.code, 3);
  assert.match(r1.err, /--symptom-key/);
  const r2 = record(sb, ['--outcome', 'clean', '--task-label', 'task y', '--symptom-key', 'cost']);
  assert.equal(r2.code, 3);
  assert.match(r2.err, /not allowed for a clean outcome/);
  assert.equal(existsSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl')), false);
});

test('self-receipts are incident-only and need evidence refs', () => {
  const sb = sandbox();
  const base = ['record', '--root', sb.root, '--target', SELF_SKILL_DIR, '--session-id', 's1'];
  const r1 = run([...base, '--outcome', 'clean', '--task-label', 'self clean']);
  assert.equal(r1.code, 3);
  assert.match(r1.err, /Self-receipts are incident-only/);
  const r2 = run([...base, ...incidentArgs('material_failure', 'execution', 'failed capture', 's1').slice(0)]);
  assert.equal(r2.code, 3);
  assert.match(r2.err, /must cite concrete evidence/);
  const r3 = run([...base, ...incidentArgs('material_failure', 'execution', 'failed capture', 's1'),
    '--evidence-ref', 'transcript excerpt']);
  assert.equal(r3.code, 0, r3.err);
});

test('ten uses with an open contemporaneous incident fire the ten-use gate', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'cost', 'incident task', 's1'));
  for (let i = 1; i <= 8; i++) {
    assert.equal(record(sb, ['--outcome', 'clean', '--task-label', `clean task ${i}`], `s${i}`).code, 0);
  }
  assert.equal(gate(sb).state, 'collecting');
  record(sb, ['--outcome', 'clean', '--task-label', 'clean task 9'], 's9');
  const g = gate(sb);
  assert.equal(g.qualifying_uses_on_current_hash, 10);
  assert.equal(g.state, 'eligible_pending_cooldown');
  const d = run(['derive', '--root', sb.root, '--target', sb.rel, '--session-id', 'fresh']);
  assert.equal(JSON.parse(d.out).authorization_reason, 'ten_use_unresolved');
});

test('ten clean uses authorize nothing', () => {
  const sb = sandbox();
  for (let i = 1; i <= 10; i++) {
    assert.equal(record(sb, ['--outcome', 'clean', '--task-label', `clean task ${i}`], `s${i}`).code, 0);
  }
  const g = gate(sb);
  assert.equal(g.qualifying_uses_on_current_hash, 10);
  assert.equal(g.state, 'closed');
});

test('a target hash change partitions prospective evidence', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'execution', 'task a', 'sA'));
  record(sb, incidentArgs('friction', 'execution', 'task b', 'sB'));
  appendFileSync(join(sb.target, 'SKILL.md'), '\nEdited.\n');
  record(sb, incidentArgs('friction', 'execution', 'task c', 'sC'));
  const g = gate(sb);
  assert.equal(g.state, 'collecting');
  assert.equal(g.qualifying_uses_on_current_hash, 1);
  assert.equal(g.open_incident_ids.length, 1);
});

test('a corrupt event stream blocks derivation and refuses new receipts', () => {
  const sb = sandbox();
  record(sb, ['--outcome', 'clean', '--task-label', 'task a']);
  const file = join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl');
  appendFileSync(file, 'not json\n');
  const linesBefore = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() !== '').length;
  const r = record(sb, ['--outcome', 'clean', '--task-label', 'task b']);
  assert.equal(r.code, 1);
  assert.match(r.err, /integrity failure — nothing recorded/);
  const linesAfter = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() !== '').length;
  assert.equal(linesAfter, linesBefore);
  const d = run(['derive', '--root', sb.root, '--target', sb.rel]);
  assert.equal(JSON.parse(d.out).state, 'blocked');
});

test('review dispositions close incidents; review_started owns the target', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'execution', 'task a', 'sA'));
  record(sb, incidentArgs('friction', 'execution', 'task b', 'sB'));
  const ids = events(sb).map((e) => e.event_id);
  const file = join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl');
  const envelope = (type, payload) => JSON.stringify({
    schema_version: 1,
    event_id: `evt_${type}_${Math.random().toString(16).slice(2)}`,
    event_type: type,
    recorded_at: new Date().toISOString(),
    operator_workflow: 'skill-evolution',
    target: events(sb)[0].target,
    top_level_session_id: 'sZ',
    payload,
  });
  appendFileSync(file, `${envelope('review_started', { review_id: 'r1' })}\n`);
  let d = JSON.parse(run(['derive', '--root', sb.root, '--target', sb.rel]).out);
  assert.equal(d.state, 'review_in_progress');
  assert.equal(d.active_review_id, 'r1');
  appendFileSync(file, `${envelope('review_disposition', {
    review_id: 'r1', disposition: 'monitor_for_recurrence', adjudicated_event_ids: ids,
  })}\n`);
  d = JSON.parse(run(['derive', '--root', sb.root, '--target', sb.rel]).out);
  assert.equal(d.state, 'closed');
  assert.equal(d.open_incident_ids.length, 0);
  assert.equal(d.last_completed_review_id, 'r1');
});

test('missing or invalid target refuses safely', () => {
  const sb = sandbox();
  const r1 = run(['record', '--root', sb.root, '--target', 'no/such/dir', '--outcome', 'clean', '--task-label', 'x']);
  assert.equal(r1.code, 3);
  assert.match(r1.err, /not found/);
  mkdirSync(join(sb.root, 'plain-dir'));
  const r2 = run(['record', '--root', sb.root, '--target', 'plain-dir', '--outcome', 'clean', '--task-label', 'x']);
  assert.equal(r2.code, 3);
  assert.match(r2.err, /no SKILL\.md/);
});

test('hash is stable across runs and changes when a file changes', () => {
  const sb = sandbox();
  const h1 = run(['hash', '--root', sb.root, '--target', sb.rel]).out;
  const h2 = run(['hash', '--root', sb.root, '--target', sb.rel]).out;
  assert.equal(h1, h2);
  appendFileSync(join(sb.target, 'SKILL.md'), 'x');
  const h3 = run(['hash', '--root', sb.root, '--target', sb.rel]).out;
  assert.notEqual(h1, h3);
});

test('session id falls back to env, then to the 12-hour cooldown path', () => {
  const sb = sandbox();
  const r = run(['record', '--root', sb.root, '--target', sb.rel, '--outcome', 'clean', '--task-label', 'env task'],
    { CLAUDE_CODE_SESSION_ID: 'env-session', CODEX_THREAD_ID: '' });
  assert.equal(r.code, 0);
  assert.equal(events(sb)[0].top_level_session_id, 'env-session');
  const sb2 = sandbox();
  const bare = spawnSync(process.execPath, [SCRIPT, 'record', '--root', sb2.root, '--target', sb2.rel,
    ...incidentArgs('severe_incident', 'state', 'no session task', 'IGNORED').filter((a) => a !== '--session-id' && a !== 'IGNORED')],
  { encoding: 'utf8', env: { ...process.env, CLAUDE_CODE_SESSION_ID: '', CODEX_THREAD_ID: '' } });
  assert.equal(bare.status, 0, bare.stderr);
  const g = gate(sb2);
  assert.equal(g.threshold_session_id, null);
  assert.notEqual(g.not_before, null);
  assert.equal(g.state, 'quarantined_pending_cooldown');
});

// ---------- portable top-level-session identity resolver (#151) ----------

// Incident args without an explicit --session-id, so the resolver reads the host env.
const incidentArgsNoSession = (outcome, key, label) => [
  '--outcome', outcome, '--task-label', label,
  '--symptom-key', key, '--expected', 'exp', '--observed', 'obs', '--consequence', 'cons',
];

// Record with both supported host vars explicitly controlled ('' means the var is absent),
// so an inherited CLAUDE_CODE_SESSION_ID from the test host cannot pollute the resolution.
function recordEnv(sb, extra, env) {
  return run(['record', '--root', sb.root, '--target', sb.rel, ...extra],
    { CLAUDE_CODE_SESSION_ID: '', CODEX_THREAD_ID: '', ...env });
}
function deriveEnv(sb, env) {
  return run(['derive', '--root', sb.root, '--target', sb.rel],
    { CLAUDE_CODE_SESSION_ID: '', CODEX_THREAD_ID: '', ...env });
}
const eventsBytes = (sb) => readFileSync(
  join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl'));

test('resolveTopLevelSessionId honors an explicit override, both host vars, and fails closed on conflict', () => {
  // Explicit override wins over any host env (the --session-id / test interface).
  assert.equal(
    resolveTopLevelSessionId({ explicit: 'explicit-id', env: { CLAUDE_CODE_SESSION_ID: 'c', CODEX_THREAD_ID: 'x' } }),
    'explicit-id');
  // An explicit empty override collapses to 'unavailable' and ignores host env (prior behavior).
  assert.equal(
    resolveTopLevelSessionId({ explicit: '', env: { CLAUDE_CODE_SESSION_ID: 'claude-1' } }), 'unavailable');
  // Claude Code host only.
  assert.equal(resolveTopLevelSessionId({ env: { CLAUDE_CODE_SESSION_ID: 'claude-1' } }), 'claude-1');
  // Codex host only.
  assert.equal(resolveTopLevelSessionId({ env: { CODEX_THREAD_ID: 'codex-1' } }), 'codex-1');
  // No supported identity -> unavailable (empty strings count as absent).
  assert.equal(resolveTopLevelSessionId({ env: {} }), 'unavailable');
  assert.equal(resolveTopLevelSessionId({ env: { CLAUDE_CODE_SESSION_ID: '', CODEX_THREAD_ID: '' } }), 'unavailable');
  // Identical dual identities are not a conflict; the shared value resolves.
  assert.equal(
    resolveTopLevelSessionId({ env: { CLAUDE_CODE_SESSION_ID: 'same', CODEX_THREAD_ID: 'same' } }), 'same');
  // Conflicting simultaneous identities fail closed (Refusal, exit code 3), naming both.
  assert.throws(
    () => resolveTopLevelSessionId({ env: { CLAUDE_CODE_SESSION_ID: 'c-id', CODEX_THREAD_ID: 'x-id' } }),
    (err) => err.code === 3 && /[Cc]onflict/.test(err.message)
      && err.message.includes('CLAUDE_CODE_SESSION_ID') && err.message.includes('CODEX_THREAD_ID'));
});

test('AC1: a Claude-session threshold becomes eligible in a different Codex thread', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'execution', 'task a', 'sA'));
  record(sb, incidentArgs('friction', 'execution', 'task b', 'sB'));
  const r3 = recordEnv(sb, incidentArgsNoSession('friction', 'execution', 'task c'),
    { CLAUDE_CODE_SESSION_ID: 'claude-c' });
  assert.equal(r3.code, 0, r3.err);
  const g0 = gate(sb);
  assert.equal(g0.state, 'eligible_pending_cooldown');
  assert.equal(g0.threshold_session_id, 'claude-c');
  const d = deriveEnv(sb, { CODEX_THREAD_ID: 'codex-d' });
  assert.equal(d.code, 0, d.err);
  const g = JSON.parse(d.out);
  assert.equal(g.state, 'eligible');
  assert.equal(g.derivation_session_id, 'codex-d');
});

test('AC2: a Codex-thread threshold becomes eligible in a different Claude session', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'output', 'task a', 'sA'));
  record(sb, incidentArgs('friction', 'output', 'task b', 'sB'));
  const r3 = recordEnv(sb, incidentArgsNoSession('friction', 'output', 'task c'),
    { CODEX_THREAD_ID: 'codex-c' });
  assert.equal(r3.code, 0, r3.err);
  assert.equal(gate(sb).threshold_session_id, 'codex-c');
  const d = deriveEnv(sb, { CLAUDE_CODE_SESSION_ID: 'claude-d' });
  assert.equal(d.code, 0, d.err);
  const g = JSON.parse(d.out);
  assert.equal(g.state, 'eligible');
  assert.equal(g.derivation_session_id, 'claude-d');
});

test('AC6: conflicting simultaneous host identities fail closed, nothing recorded', () => {
  const sb = sandbox();
  const r = recordEnv(sb, ['--outcome', 'clean', '--task-label', 'conflict task'],
    { CLAUDE_CODE_SESSION_ID: 'claude-x', CODEX_THREAD_ID: 'codex-y' });
  assert.equal(r.code, 3, r.out);
  assert.match(r.err, /[Cc]onflict/);
  assert.equal(existsSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl')), false);
  // The same conflict on the read-only derive path also refuses and writes nothing.
  const d = deriveEnv(sb, { CLAUDE_CODE_SESSION_ID: 'claude-x', CODEX_THREAD_ID: 'codex-y' });
  assert.equal(d.code, 3);
  assert.equal(existsSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'gate-status.json')), false);
});

test('AC7: an unavailable-session threshold keeps the 12-hour clock and no host session bypasses it', () => {
  const sb = sandbox();
  record(sb, incidentArgs('friction', 'cost', 'task a', 'unavailable'));
  record(sb, incidentArgs('friction', 'cost', 'task b', 'unavailable'));
  record(sb, incidentArgs('friction', 'cost', 'task c', 'unavailable'));
  const g0 = gate(sb);
  assert.equal(g0.state, 'eligible_pending_cooldown');
  assert.equal(g0.threshold_session_id, null);
  assert.notEqual(g0.not_before, null);
  const before = eventsBytes(sb);
  // A real Codex host does not bypass the clock, and the immutable event stream is untouched.
  const d = deriveEnv(sb, { CODEX_THREAD_ID: 'codex-fresh' });
  assert.equal(d.code, 0, d.err);
  const g = JSON.parse(d.out);
  assert.equal(g.state, 'eligible_pending_cooldown');
  assert.notEqual(g.not_before, null);
  assert.deepEqual(eventsBytes(sb), before);
});
