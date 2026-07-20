import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'decontamination.mjs');
const CAPTURE = join(HERE, '..', '..', 'skill-evidence-capture', 'scripts', 'evidence.mjs');
const EVOLUTION = join(HERE, '..', '..', 'skill-evolution', 'scripts', 'evolution.mjs');
const SELF_SKILL_DIR = dirname(HERE);

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), 'skill-decontamination-test-'));
  const target = join(root, '.claude', 'skills', 'demo-skill');
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'SKILL.md'), '---\nname: demo-skill\n---\nDemo body v1 with audit accretion.\n');
  return { root, target, rel: '.claude/skills/demo-skill' };
}

function run(script, args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { ...process.env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const dec = (sb, args) => run(SCRIPT, [...args, '--root', sb.root]);
const OWNER = ['--basis', 'owner-confirmed'];

function seedIncident(sb, label, session, key = 'execution', outcome = 'friction') {
  const r = run(CAPTURE, ['record', '--root', sb.root, '--target', sb.rel, '--session-id', session,
    '--outcome', outcome, '--task-label', label, '--symptom-key', key,
    '--expected', 'exp', '--observed', 'obs', '--consequence', 'cons', '--evidence-ref', `logs/${label}.txt`]);
  assert.equal(r.code, 0, r.err);
}

const events = (sb) => readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl'), 'utf8')
  .split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
const gate = (sb) => JSON.parse(readFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'gate-status.json'), 'utf8'));

function claimRun(sb, extra = []) {
  const r = dec(sb, ['claim', '--target', sb.rel, ...OWNER, '--session-id', 'sDecon', ...extra]);
  assert.equal(r.code, 0, r.err);
  return JSON.parse(r.out);
}

function makeCandidate(sb, body = 'Demo body v2 (decontaminated).\n') {
  const cand = join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'decontamination', 'cand');
  mkdirSync(cand, { recursive: true });
  cpSync(sb.target, cand, { recursive: true });
  writeFileSync(join(cand, 'SKILL.md'), `---\nname: demo-skill\n---\n${body}`);
  return cand;
}

function acceptValidation(sb, runId, cand, trials = '5') {
  return dec(sb, ['record-validation', '--target', sb.rel, '--run-id', runId,
    '--decision', 'accepted', '--candidate', cand, '--trials', trials,
    '--artifacts', 'reports/skill-evidence/demo-skill/decontamination/trials']);
}

test('preflight refuses a self-target before touching any store', () => {
  const sb = sandbox();
  const r = dec(sb, ['preflight', '--target', SELF_SKILL_DIR, ...OWNER]);
  assert.equal(r.code, 3);
  assert.match(r.err, /Failed condition: operator_skill_path != target_skill_path\./);
  assert.match(r.err, /Terminal outcome: refused_self_target\./);
  assert.equal(existsSync(join(sb.root, 'reports', 'skill-evidence', 'legacy-skill-decontamination')), false);
});

test('preflight requires an accepted legacy basis, with per-basis evidence flags', () => {
  const sb = sandbox();
  const missing = dec(sb, ['preflight', '--target', sb.rel]);
  assert.equal(missing.code, 3);
  assert.equal(missing.err,
    'Legacy Skill Decontamination not eligible.\n'
    + 'Gate: not derived.\n'
    + 'Failed condition: accepted_legacy_basis_provided (--basis owner-confirmed|audit-history|imported|routed-review).\n'
    + 'No target analysis or modification performed.\n'
    + 'Terminal outcome: refused_not_legacy_eligible.\n');
  const noNote = dec(sb, ['preflight', '--target', sb.rel, '--basis', 'audit-history']);
  assert.equal(noNote.code, 3);
  assert.match(noNote.err, /audit_history_basis_describes_provenance/);
  const badRef = dec(sb, ['preflight', '--target', sb.rel, '--basis', 'routed-review', '--basis-ref', 'evt_nope']);
  assert.equal(badRef.code, 3);
  assert.match(badRef.err, /routed_review_basis_cites_existing_review_disposition/);
});

test('preflight is eligible for a legacy target under the standing owner confirmation', () => {
  const sb = sandbox();
  seedIncident(sb, 'one open incident', 'sA');
  const r = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(r.code, 0, r.err);
  const p = JSON.parse(r.out);
  assert.equal(p.eligible, true);
  assert.equal(p.gate_state, 'collecting');
  assert.equal(p.open_incident_count, 1);
  assert.equal(p.legacy_basis.basis, 'owner-confirmed');
  assert.equal(p.min_paired_trials, 5);
  assert.deepEqual(p.prior_completions, []);
  assert.equal(p.artifacts_dir, 'reports/skill-evidence/demo-skill/decontamination');
});

test('preflight refuses while a Skill Evolution authorization or review is pending', () => {
  const sb = sandbox();
  seedIncident(sb, 'task a', 'sA');
  seedIncident(sb, 'task b', 'sB');
  seedIncident(sb, 'task c', 'sC');
  const pending = dec(sb, ['preflight', '--target', sb.rel, ...OWNER, '--session-id', 'sFresh']);
  assert.equal(pending.code, 3);
  assert.match(pending.err, /no_pending_skill_evolution_authorization/);
  assert.match(pending.err, /Terminal outcome: refused_not_legacy_eligible\./);
  const claim = run(EVOLUTION, ['claim', '--target', sb.rel, '--root', sb.root, '--session-id', 'sFresh']);
  assert.equal(claim.code, 0, claim.err);
  const owned = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(owned.code, 3);
  assert.match(owned.err, /no_other_review_owns_target/);
});

test('claim snapshots a verified baseline, owns the target, and blocks a second claim', () => {
  const sb = sandbox();
  const short = dec(sb, ['claim', '--target', sb.rel, ...OWNER, '--trials', '3']);
  assert.equal(short.code, 3);
  assert.match(short.err, /--trials must be an integer >= 5/);
  const c = claimRun(sb, ['--trials', '6', '--risk-rationale', 'governs stateful actions']);
  assert.match(c.run_id, /^dec_/);
  assert.equal(c.state, 'review_in_progress');
  assert.equal(c.provisional_trial_count, 6);
  const baseline = readFileSync(join(sb.root, c.baseline_copy, 'SKILL.md'), 'utf8');
  assert.match(baseline, /v1 with audit accretion/);
  const started = events(sb).find((e) => e.event_type === 'decontamination_started');
  assert.equal(started.operator_workflow, 'legacy-skill-decontamination');
  assert.equal(started.payload.legacy_basis.basis, 'owner-confirmed');
  assert.equal(started.payload.risk_rationale, 'governs stateful actions');
  const again = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(again.code, 3);
  assert.match(again.err, /no_other_review_owns_target/);
  assert.equal(dec(sb, ['claim', '--target', sb.rel, ...OWNER]).code, 3);
});

test('record-validation enforces the five-trial broad-change floor and freezes the candidate hash', () => {
  const sb = sandbox();
  const c = claimRun(sb);
  const cand = makeCandidate(sb);
  const short = acceptValidation(sb, c.run_id, cand, '4');
  assert.equal(short.code, 3);
  assert.match(short.err, /at least 5 paired trials/);
  const ok = acceptValidation(sb, c.run_id, cand);
  assert.equal(ok.code, 0, ok.err);
  const v = events(sb).find((e) => e.event_type === 'validation_completed');
  assert.equal(v.payload.risk_tier, 'high');
  assert.equal(typeof v.payload.candidate_hash, 'string');
});

test('full landing path: land verifies hashes and mirror, complete closes, rerun is refused as completed', () => {
  const sb = sandbox();
  mkdirSync(join(sb.root, '.agents', 'skills'), { recursive: true });
  symlinkSync(join('..', '..', '.claude', 'skills', 'demo-skill'), join(sb.root, '.agents', 'skills', 'demo-skill'));
  const c = claimRun(sb);
  const cand = makeCandidate(sb);
  assert.equal(acceptValidation(sb, c.run_id, cand).code, 0);
  const land = dec(sb, ['land', '--target', sb.rel, '--run-id', c.run_id, '--candidate', cand]);
  assert.equal(land.code, 0, land.err);
  const l = JSON.parse(land.out);
  assert.equal(l.landed, true);
  assert.equal(l.before_hash, c.target_hash);
  assert.equal(l.mirror_status, 'ok');
  assert.deepEqual(l.changed_files, { added: [], removed: [], modified: ['SKILL.md'] });
  assert.match(readFileSync(join(sb.target, 'SKILL.md'), 'utf8'), /decontaminated/);
  assert.match(readFileSync(join(sb.root, l.backup, 'SKILL.md'), 'utf8'), /v1/);
  const wrongOutcome = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'healthy_no_change', '--note', 'x']);
  assert.equal(wrongOutcome.code, 3);
  assert.match(wrongOutcome.err, /only valid outcome is validated_simplification_landed/);
  const done = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'validated_simplification_landed', '--note', 'noninferior on all five paired trials and smaller']);
  assert.equal(done.code, 0, done.err);
  const d = JSON.parse(done.out);
  assert.equal(d.report_path, `reports/skill-evidence/demo-skill/decontamination/${c.run_id}.md`);
  assert.equal(gate(sb).state, 'closed');
  assert.equal(gate(sb).active_review_id, null);
  const rerun = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(rerun.code, 3);
  assert.match(rerun.err, /no_completed_decontamination_covers_target_version/);
  assert.match(rerun.err, /Terminal outcome: refused_already_completed\./);
});

test('a moved target refuses landing, completes as superseded, and stays legacy-eligible on the new version', () => {
  const sb = sandbox();
  const c = claimRun(sb);
  const cand = makeCandidate(sb);
  assert.equal(acceptValidation(sb, c.run_id, cand).code, 0);
  appendFileSync(join(sb.target, 'SKILL.md'), 'concurrent edit\n');
  const land = dec(sb, ['land', '--target', sb.rel, '--run-id', c.run_id, '--candidate', cand]);
  assert.equal(land.code, 3);
  assert.match(land.err, /complete with superseded_by_target_version/);
  const wrong = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'healthy_no_change', '--note', 'x']);
  assert.equal(wrong.code, 3);
  assert.match(wrong.err, /only valid outcome is superseded_by_target_version/);
  const done = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'superseded_by_target_version', '--note', 'target changed mid-run']);
  assert.equal(done.code, 0, done.err);
  const again = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(again.code, 0, again.err);
  assert.equal(JSON.parse(again.out).prior_completions.length, 1);
});

test('healthy_no_change adjudicates the baseline; a changed target re-enters only through routed-review', () => {
  const sb = sandbox();
  const c = claimRun(sb);
  const supersededEarly = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'superseded_by_target_version', '--note', 'x']);
  assert.equal(supersededEarly.code, 3);
  assert.match(supersededEarly.err, /requires the live target to differ/);
  const done = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'healthy_no_change', '--note', 'accretion already minimal; candidate not meaningfully simpler']);
  assert.equal(done.code, 0, done.err);
  const sameHash = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(sameHash.code, 3);
  assert.match(sameHash.err, /refused_already_completed/);
  appendFileSync(join(sb.target, 'SKILL.md'), 'later imported change\n');
  const changed = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(changed.code, 3);
  assert.match(changed.err, /legacy_baseline_already_adjudicated/);
  seedIncident(sb, 'task a', 'sA');
  seedIncident(sb, 'task b', 'sB');
  seedIncident(sb, 'task c', 'sC');
  assert.equal(run(EVOLUTION, ['claim', '--target', sb.rel, '--root', sb.root, '--session-id', 'sFresh']).code, 0);
  const review = events(sb).find((e) => e.event_type === 'review_started');
  const close = run(EVOLUTION, ['close', '--target', sb.rel, '--root', sb.root,
    '--review-id', review.payload.review_id,
    '--disposition', 'monitor_for_recurrence', '--note', 'legacy-style accretion; route to decontamination']);
  assert.equal(close.code, 0, close.err);
  const disposition = events(sb).find((e) => e.event_type === 'review_disposition');
  const routed = dec(sb, ['preflight', '--target', sb.rel, '--basis', 'routed-review', '--basis-ref', disposition.event_id]);
  assert.equal(routed.code, 0, routed.err);
  assert.equal(JSON.parse(routed.out).eligible, true);
});

test('a blocked run leaves the version eligible only with a basis note naming new corpus material', () => {
  const sb = sandbox();
  const c = claimRun(sb);
  const blocked = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'blocked_no_valid_test', '--note', 'no representative corpus constructible from available history']);
  assert.equal(blocked.code, 0, blocked.err);
  const bare = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(bare.code, 3);
  assert.match(bare.err, /blocked_rerun_names_new_corpus_material/);
  const withNote = dec(sb, ['preflight', '--target', sb.rel, ...OWNER,
    '--basis-note', 'six real qualifying-use transcripts recorded since the blocked run']);
  assert.equal(withNote.code, 0, withNote.err);
});

test('complete enforces landing prerequisites, rejection evidence, a mandatory note, and one completion per run', () => {
  const sb = sandbox();
  const c = claimRun(sb);
  const cand = makeCandidate(sb);
  const noLand = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'validated_simplification_landed', '--note', 'x']);
  assert.equal(noLand.code, 3);
  assert.match(noLand.err, /requires a change_landed event/);
  const noReject = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'candidate_rejected_validation', '--note', 'x']);
  assert.equal(noReject.code, 3);
  assert.match(noReject.err, /decision=rejected/);
  const noNote = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'healthy_no_change']);
  assert.equal(noNote.code, 3);
  assert.match(noNote.err, /--note/);
  const rej = dec(sb, ['record-validation', '--target', sb.rel, '--run-id', c.run_id,
    '--decision', 'rejected', '--candidate', cand, '--trials', '5', '--artifacts', 'trials',
    '--summary', 'regression on fragile branch']);
  assert.equal(rej.code, 0, rej.err);
  assert.equal(dec(sb, ['land', '--target', sb.rel, '--run-id', c.run_id, '--candidate', cand]).code, 3);
  const done = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'candidate_rejected_validation', '--note', 'regression on fragile branch; current skill retained']);
  assert.equal(done.code, 0, done.err);
  const twice = dec(sb, ['complete', '--target', sb.rel, '--run-id', c.run_id,
    '--outcome', 'candidate_rejected_validation', '--note', 'x']);
  assert.equal(twice.code, 3);
  assert.match(twice.err, /already has a decontamination_completed/);
});

test('a corrupt event stream refuses with the integrity condition', () => {
  const sb = sandbox();
  seedIncident(sb, 'seed', 'sA');
  appendFileSync(join(sb.root, 'reports', 'skill-evidence', 'demo-skill', 'events.jsonl'), 'not json\n');
  const r = dec(sb, ['preflight', '--target', sb.rel, ...OWNER]);
  assert.equal(r.code, 3);
  assert.match(r.err, /Gate: blocked\./);
  assert.match(r.err, /Failed condition: event_stream_integrity_valid\./);
});
