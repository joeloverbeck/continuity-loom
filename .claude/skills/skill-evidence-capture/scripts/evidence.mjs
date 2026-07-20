#!/usr/bin/env node
/**
 * Deterministic evidence helper for the evidence-governed skill-evolution system.
 * Contract: archive/workflows/00_shared-skill-evolution-contract.md
 *
 * Mechanical layer shared by Skill Evidence Capture, Skill Evolution, and Legacy
 * Skill Decontamination (the latter two import these primitives from the helpers in
 * their own skill directories): skill-directory hashing, event validation, atomic
 * append, gate derivation, and candidate landing utilities. Agents never hand-edit
 * events.jsonl or gate-status.json.
 *
 * Store layout: <root>/reports/skill-evidence/<skill-key>/{events.jsonl,gate-status.json}
 *
 * Commands:
 *   record --target <skill-dir> --outcome <o> --task-label "<label>" [options]
 *          Append one use_recorded event and re-derive gate state (the one capture operation).
 *   derive --target <skill-dir>   Re-derive gate-status.json and print it.
 *   hash   --target <skill-dir>   Print the target's content hash.
 *
 * Exit codes: 0 success; 3 refused, nothing written (validation, duplicate,
 * inadmissible retrospective, self-receipt rule); 1 unsafe failure, nothing partial.
 */

import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync, copyFileSync, existsSync, fsyncSync, mkdirSync, openSync, readdirSync,
  readFileSync, realpathSync, renameSync, rmSync, rmdirSync, statSync, writeFileSync,
  writeSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const EVENT_TYPES = [
  'use_recorded', 'review_started', 'review_disposition', 'validation_completed',
  'change_landed', 'decontamination_started', 'decontamination_completed',
];
const OUTCOMES = ['clean', 'friction', 'material_failure', 'severe_incident'];
const SEVERITY = { clean: 0, friction: 1, material_failure: 2, severe_incident: 3 };
const SYMPTOM_KEYS = [
  'triggering', 'execution', 'output', 'state', 'tool-compatibility',
  'coordination', 'cost', 'unknown',
];
export const DISPOSITIONS = [
  'resolved_by_change', 'closed_no_skill_defect', 'outside_target',
  'insufficient_independence', 'monitor_for_recurrence', 'superseded_by_target_version',
  'candidate_rejected_validation', 'blocked_no_valid_test',
];
const USE_PAYLOAD_KEYS = [
  'qualifying_use', 'retrospective', 'task_label', 'task_fingerprint', 'outcome',
  'symptom_key', 'expected', 'observed', 'consequence', 'workaround_taken',
  'evidence_refs', 'same_run_group',
];
const COOLDOWN_MS = 12 * 60 * 60 * 1000;
const OPERATOR = 'skill-evidence-capture';

export class Refusal extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Throw (not exit) so lock-release finally blocks run; the CLI entry point exits. */
function fail(code, msg) {
  throw new Refusal(code, msg);
}

// ---------- generic helpers ----------

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const normalizeLabel = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function detectRoot(rootArg) {
  if (rootArg) {
    if (!existsSync(rootArg)) fail(3, `--root does not exist: ${rootArg}`);
    return realpathSync(resolve(rootArg));
  }
  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (git.status === 0) return realpathSync(git.stdout.trim());
  return realpathSync(process.cwd());
}

export function repoHead(root) {
  const git = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return git.status === 0 ? git.stdout.trim() : 'unavailable';
}

export function resolveTargetDir(root, target) {
  if (!isNonEmptyString(target)) fail(3, 'Missing required --target <skill-dir>.');
  const candidates = [];
  if (isAbsolute(target)) candidates.push(target);
  else candidates.push(resolve(process.cwd(), target), resolve(root, target));
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isDirectory()) {
      const real = realpathSync(c);
      if (!existsSync(join(real, 'SKILL.md'))) {
        fail(3, `Target is not a skill directory (no SKILL.md): ${target}`);
      }
      return real;
    }
  }
  fail(3, `Target skill directory not found: ${target}`);
}

export function skillKey(root, targetReal) {
  const base = targetReal.split(sep).pop();
  for (const rootRel of ['.claude/skills', '.agents/skills']) {
    const dir = join(root, rootRel, base);
    try {
      if (existsSync(dir) && realpathSync(dir) !== targetReal) {
        const rel = relative(root, targetReal).split(sep).join('/');
        return `${base}-${sha256(rel).slice(0, 8)}`;
      }
    } catch { /* broken symlink: ignore for key purposes */ }
  }
  return base;
}

export function listFiles(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, base));
    else out.push(relative(base, p).split(sep).join('/'));
  }
  return out.sort();
}

/** sha256 over sorted relative paths and bytes of all shipped files. */
export function hashSkillDir(dir) {
  const h = createHash('sha256');
  const files = listFiles(dir);
  for (const rel of files) {
    h.update(rel);
    h.update(Buffer.from([0]));
    h.update(readFileSync(join(dir, rel)));
    h.update(Buffer.from([0]));
  }
  return { hash: h.digest('hex'), fileCount: files.length };
}

// ---------- event validation ----------

export function validateEvent(e, seenIds) {
  const errs = [];
  const bad = (m) => errs.push(m);
  if (typeof e !== 'object' || e === null || Array.isArray(e)) return ['event is not an object'];
  if (e.schema_version !== 1) bad('schema_version must be 1');
  if (!isNonEmptyString(e.event_id)) bad('event_id missing');
  else if (seenIds.has(e.event_id)) bad(`duplicate event_id ${e.event_id}`);
  if (!EVENT_TYPES.includes(e.event_type)) bad(`unknown event_type ${JSON.stringify(e.event_type)}`);
  if (!isNonEmptyString(e.recorded_at) || Number.isNaN(Date.parse(e.recorded_at))) bad('recorded_at is not a parseable timestamp');
  if (!isNonEmptyString(e.operator_workflow)) bad('operator_workflow missing');
  const t = e.target;
  if (typeof t !== 'object' || t === null) bad('target missing');
  else {
    for (const k of ['name', 'repo_relative_path', 'content_hash', 'repo_head']) {
      if (!isNonEmptyString(t[k])) bad(`target.${k} missing`);
    }
  }
  if (!isNonEmptyString(e.top_level_session_id)) bad('top_level_session_id missing');
  const p = e.payload;
  if (typeof p !== 'object' || p === null) { bad('payload missing'); return errs; }

  if (e.event_type === 'use_recorded') {
    const keys = Object.keys(p).sort();
    const expected = [...USE_PAYLOAD_KEYS].sort();
    if (JSON.stringify(keys) !== JSON.stringify(expected)) {
      bad(`use_recorded payload keys must be exactly [${expected.join(', ')}]`);
      return errs;
    }
    if (p.qualifying_use !== true) bad('qualifying_use must be true');
    if (typeof p.retrospective !== 'boolean') bad('retrospective must be boolean');
    if (!isNonEmptyString(p.task_label)) bad('task_label missing');
    if (!isNonEmptyString(p.task_fingerprint)) bad('task_fingerprint missing');
    if (!OUTCOMES.includes(p.outcome)) bad(`outcome must be one of ${OUTCOMES.join('|')}`);
    if (!isNonEmptyString(p.same_run_group)) bad('same_run_group missing');
    if (!Array.isArray(p.evidence_refs) || p.evidence_refs.some((r) => !isNonEmptyString(r))) {
      bad('evidence_refs must be an array of non-empty strings');
    } else if (p.retrospective === true && p.evidence_refs.length === 0) {
      bad('retrospective events require at least one evidence_ref');
    }
    if (p.outcome === 'clean') {
      for (const k of ['symptom_key', 'expected', 'observed', 'consequence', 'workaround_taken']) {
        if (p[k] !== null) bad(`${k} must be null for a clean outcome`);
      }
    } else {
      if (!SYMPTOM_KEYS.includes(p.symptom_key)) bad(`symptom_key must be one of ${SYMPTOM_KEYS.join('|')}`);
      for (const k of ['expected', 'observed', 'consequence']) {
        if (!isNonEmptyString(p[k])) bad(`${k} required for a non-clean outcome`);
      }
      if (p.workaround_taken !== null && !isNonEmptyString(p.workaround_taken)) bad('workaround_taken must be null or a non-empty string');
    }
  } else if (e.event_type === 'review_disposition') {
    if (!isNonEmptyString(p.review_id)) bad('review_id missing');
    if (!DISPOSITIONS.includes(p.disposition)) bad(`disposition must be one of ${DISPOSITIONS.join('|')}`);
    if (!Array.isArray(p.adjudicated_event_ids) || p.adjudicated_event_ids.length === 0
        || p.adjudicated_event_ids.some((x) => !isNonEmptyString(x))) {
      bad('adjudicated_event_ids must be a non-empty array of event ids');
    }
  } else if (!isNonEmptyString(p.review_id)) {
    bad(`${e.event_type} payload requires review_id`);
  }
  return errs;
}

export function readEventsFile(file) {
  if (!existsSync(file)) return { events: [], errors: [] };
  const events = [];
  const errors = [];
  const seenIds = new Set();
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() !== '');
  lines.forEach((line, i) => {
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      errors.push(`line ${i + 1}: not valid JSON`);
      return;
    }
    const errs = validateEvent(e, seenIds);
    if (errs.length) errors.push(...errs.map((m) => `line ${i + 1}: ${m}`));
    else {
      seenIds.add(e.event_id);
      events.push(e);
    }
  });
  return { events, errors };
}

// ---------- gate derivation ----------

const independenceKey = (e) => `${e.top_level_session_id}::${e.payload.task_fingerprint}`;
const independentCount = (list) => new Set(list.map(independenceKey)).size;

/**
 * Deterministic projection of events.jsonl plus the current target content hash.
 * Thresholds (shared contract): one contemporaneous severe incident; two independent
 * material_failure+ incidents sharing a symptom cluster; three independent friction+
 * incidents sharing a symptom cluster; ten qualifying uses on the unchanged hash with
 * an open contemporaneous incident. The event completing a threshold must be
 * contemporaneous — retrospective evidence never opens a gate. Adjudicated events
 * leave the active set. First threshold to fire wins.
 */
export function deriveGate({ events, errors, currentHash, target, sessionId, nowMs }) {
  const base = {
    schema_version: 1,
    generated_at: new Date(nowMs).toISOString(),
    target_content_hash: currentHash,
    qualifying_uses_on_current_hash: 0,
    open_incident_ids: [],
    candidate_clusters: [],
    state: 'closed',
    authorized_workflow: null,
    authorization_reason: null,
    trigger_event_ids: [],
    threshold_session_id: null,
    not_before: null,
    active_review_id: null,
    last_completed_review_id: null,
    target_name: target.name,
    target_repo_relative_path: target.repo_relative_path,
    derivation_session_id: sessionId === 'unavailable' ? null : sessionId,
  };
  if (errors.length) {
    return { ...base, state: 'blocked', integrity_errors: errors };
  }

  const adjudicated = new Set(
    events.filter((e) => e.event_type === 'review_disposition')
      .flatMap((e) => e.payload.adjudicated_event_ids),
  );

  let uses = 0;
  const clusters = new Map(); // symptom_key -> open incident events on current hash, in order
  let fired = null;
  for (const e of events) {
    if (e.event_type !== 'use_recorded' || e.target.content_hash !== currentHash) continue;
    uses += 1;
    const p = e.payload;
    const openIncident = p.outcome !== 'clean' && !adjudicated.has(e.event_id);
    if (openIncident) {
      if (!clusters.has(p.symptom_key)) clusters.set(p.symptom_key, []);
      clusters.get(p.symptom_key).push(e);
    }
    if (fired) continue;
    const contemporaneous = p.retrospective !== true;
    if (!contemporaneous) continue; // a retrospective event never completes a threshold
    const mk = (reason, triggers) => ({
      reason,
      trigger_event_ids: triggers.map((x) => x.event_id),
      fired_at: e.recorded_at,
      threshold_session_id: e.top_level_session_id === 'unavailable' ? null : e.top_level_session_id,
    });
    if (openIncident && p.outcome === 'severe_incident') {
      fired = mk('severe', [e]);
      continue;
    }
    if (openIncident) {
      const cluster = clusters.get(p.symptom_key);
      const material = cluster.filter((x) => SEVERITY[x.payload.outcome] >= SEVERITY.material_failure);
      if (SEVERITY[p.outcome] >= SEVERITY.material_failure && independentCount(material) >= 2) {
        fired = mk(`material_recurrence:${p.symptom_key}`, material);
        continue;
      }
      if (independentCount(cluster) >= 3) {
        fired = mk(`friction_recurrence:${p.symptom_key}`, cluster);
        continue;
      }
    }
    const openContemporaneous = [...clusters.values()].flat().filter((x) => x.payload.retrospective !== true);
    if (uses >= 10 && openContemporaneous.length >= 1) {
      fired = mk('ten_use_unresolved', openContemporaneous);
    }
  }

  const started = events.filter((e) => ['review_started', 'decontamination_started'].includes(e.event_type));
  const terminated = new Set(
    events.filter((e) => ['review_disposition', 'change_landed', 'decontamination_completed'].includes(e.event_type))
      .map((e) => e.payload.review_id),
  );
  const activeStarts = started.filter((s) => !terminated.has(s.payload.review_id));
  const activeReviewId = activeStarts.length ? activeStarts[activeStarts.length - 1].payload.review_id : null;
  const completedStarts = started.filter((s) => terminated.has(s.payload.review_id));
  const lastCompletedReviewId = completedStarts.length
    ? completedStarts[completedStarts.length - 1].payload.review_id : null;

  const openIncidents = [...clusters.values()].flat();
  const status = {
    ...base,
    qualifying_uses_on_current_hash: uses,
    open_incident_ids: openIncidents.map((e) => e.event_id),
    candidate_clusters: [...clusters.entries()].map(([key, list]) => ({
      symptom_key: key,
      open_event_ids: list.map((e) => e.event_id),
      independent_incidents: independentCount(list),
      max_severity: list.reduce((m, e) => (SEVERITY[e.payload.outcome] > SEVERITY[m] ? e.payload.outcome : m), 'friction'),
    })),
    active_review_id: activeReviewId,
    last_completed_review_id: lastCompletedReviewId,
  };

  if (activeReviewId !== null) {
    status.state = 'review_in_progress';
    return status;
  }
  if (fired) {
    status.authorized_workflow = 'skill-evolution';
    status.authorization_reason = fired.reason;
    status.trigger_event_ids = fired.trigger_event_ids;
    status.threshold_session_id = fired.threshold_session_id;
    let cooldownPassed;
    if (fired.threshold_session_id !== null) {
      cooldownPassed = sessionId !== 'unavailable' && sessionId !== fired.threshold_session_id;
    } else {
      status.not_before = new Date(Date.parse(fired.fired_at) + COOLDOWN_MS).toISOString();
      cooldownPassed = nowMs >= Date.parse(fired.fired_at) + COOLDOWN_MS;
    }
    const severe = fired.reason === 'severe';
    if (severe) status.state = cooldownPassed ? 'quarantined_eligible' : 'quarantined_pending_cooldown';
    else status.state = cooldownPassed ? 'eligible' : 'eligible_pending_cooldown';
    return status;
  }
  status.state = openIncidents.length ? 'collecting' : 'closed';
  return status;
}

// ---------- store operations ----------

export function withLock(evidenceDir, fn) {
  const lockDir = join(evidenceDir, '.lock');
  let acquired = false;
  for (let i = 0; i < 40; i++) {
    try {
      mkdirSync(lockDir);
      acquired = true;
      break;
    } catch {
      sleepMs(50);
    }
  }
  if (!acquired) fail(1, `Could not acquire evidence lock at ${lockDir}; nothing recorded.`);
  try {
    return fn();
  } finally {
    try { rmdirSync(lockDir); } catch { /* already released */ }
  }
}

export function appendEventLine(eventsFile, event) {
  const line = `${JSON.stringify(event)}\n`;
  const fd = openSync(eventsFile, 'a');
  try {
    writeSync(fd, line);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

export function writeGateStatus(evidenceDir, status) {
  const file = join(evidenceDir, 'gate-status.json');
  const tmp = join(evidenceDir, '.gate-status.json.tmp');
  writeFileSync(tmp, `${JSON.stringify(status, null, 2)}\n`);
  renameSync(tmp, file);
}

// ---------- candidate landing utilities (Skill Evolution + Legacy Skill Decontamination) ----------

export function syncDir(srcDir, destDir) {
  const srcFiles = listFiles(srcDir);
  const destFiles = listFiles(destDir);
  const srcSet = new Set(srcFiles);
  for (const rel of srcFiles) {
    const dest = join(destDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(srcDir, rel), dest);
  }
  for (const rel of destFiles) {
    if (!srcSet.has(rel)) rmSync(join(destDir, rel));
  }
  pruneEmptyDirs(destDir);
}

export function pruneEmptyDirs(dir, isRoot = true) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) pruneEmptyDirs(p, false);
  }
  if (!isRoot && readdirSync(dir).length === 0) rmdirSync(dir);
}

export function diffDirs(beforeDir, afterDir) {
  const before = listFiles(beforeDir);
  const after = listFiles(afterDir);
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((f) => !beforeSet.has(f));
  const removed = before.filter((f) => !afterSet.has(f));
  const modified = after.filter((f) => beforeSet.has(f)
    && !readFileSync(join(beforeDir, f)).equals(readFileSync(join(afterDir, f))));
  return { added, removed, modified };
}

// ---------- terminal replies (Skill Evidence Capture step 6 templates) ----------

function buildReply(eventId, status) {
  const head = `Evidence recorded: ${eventId}.`;
  switch (status.state) {
    case 'closed':
      return `${head}\nGate: closed.\nNo action authorized.`;
    case 'collecting': {
      const byKey = status.candidate_clusters
        .map((c) => `${c.symptom_key}=${c.independent_incidents}`).join(', ');
      return `${head}\nGate: collecting — open incidents: ${status.open_incident_ids.length}`
        + ` (independent by symptom: ${byKey}); qualifying uses on current target hash:`
        + ` ${status.qualifying_uses_on_current_hash}.\nNo action authorized.`;
    }
    case 'eligible_pending_cooldown':
      return `${head}\nGate: eligible pending fresh-session/cooldown requirement.\n`
        + 'Skill Evolution is not authorized in this session. No target action authorized.';
    case 'eligible':
      return `${head}\nGate: eligible for Skill Evolution after a fresh derivation in a permitted session.\n`
        + 'No target action performed by Evidence Capture.';
    case 'quarantined_pending_cooldown':
    case 'quarantined_eligible':
      return `${head}\nGate: target quarantined pending fresh Skill Evolution eligibility.\n`
        + 'Stop using the target. Immediate operational containment is allowed; permanent skill edits are not.';
    case 'review_in_progress':
      return `${head}\nGate: review_in_progress — active review ${status.active_review_id} owns the target.\n`
        + 'No action authorized.';
    default:
      return `${head}\nGate: ${status.state}.\nNo action authorized.`;
  }
}

// ---------- commands ----------

function parseArgs(argv) {
  const args = { evidenceRefs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) fail(3, `Unexpected argument: ${a}`);
    const key = a.slice(2);
    if (key === 'retrospective') { args.retrospective = true; continue; }
    const val = argv[++i];
    if (val === undefined) fail(3, `Missing value for --${key}`);
    if (key === 'evidence-ref') args.evidenceRefs.push(val);
    else args[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  }
  return args;
}

function targetContext(args) {
  const root = detectRoot(args.root);
  const targetReal = resolveTargetDir(root, args.target);
  const key = skillKey(root, targetReal);
  const rel = relative(root, targetReal);
  const repoRelativePath = rel.startsWith('..') ? targetReal : rel.split(sep).join('/');
  const target = { name: targetReal.split(sep).pop(), repo_relative_path: repoRelativePath };
  const evidenceDir = join(root, 'reports', 'skill-evidence', key);
  return { root, targetReal, target, evidenceDir };
}

function cmdRecord(args) {
  const outcome = args.outcome;
  if (!OUTCOMES.includes(outcome)) fail(3, `--outcome must be one of ${OUTCOMES.join('|')}`);
  if (!isNonEmptyString(args.taskLabel)) fail(3, 'Missing required --task-label.');
  const clean = outcome === 'clean';
  if (clean) {
    for (const [flag, v] of [['symptom-key', args.symptomKey], ['expected', args.expected],
      ['observed', args.observed], ['consequence', args.consequence], ['workaround', args.workaround]]) {
      if (v !== undefined) fail(3, `--${flag} is not allowed for a clean outcome.`);
    }
  } else {
    if (!SYMPTOM_KEYS.includes(args.symptomKey)) fail(3, `--symptom-key must be one of ${SYMPTOM_KEYS.join('|')}`);
    for (const [flag, v] of [['expected', args.expected], ['observed', args.observed], ['consequence', args.consequence]]) {
      if (!isNonEmptyString(v)) fail(3, `--${flag} is required for a non-clean outcome.`);
    }
  }
  const retrospective = args.retrospective === true;
  if (retrospective && args.evidenceRefs.length === 0) {
    fail(3, 'Retrospective evidence requires a concrete recoverable reference (artifact, diff, log, transcript); '
      + 'memory alone is inadmissible. Nothing recorded.');
  }

  const { root, targetReal, target, evidenceDir } = targetContext(args);

  const selfDir = (() => {
    try { return realpathSync(dirname(dirname(fileURLToPath(import.meta.url)))); } catch { return null; }
  })();
  if (selfDir !== null && targetReal === selfDir) {
    if (outcome !== 'material_failure' && outcome !== 'severe_incident') {
      fail(3, 'Self-receipts are incident-only: Skill Evidence Capture never records its own clean or friction uses. '
        + 'Nothing recorded.');
    }
    if (args.evidenceRefs.length === 0) {
      fail(3, 'A self-targeted incident must cite concrete evidence of the failed capture attempt (--evidence-ref). '
        + 'Nothing recorded.');
    }
  }

  const sessionId = (args.sessionId ?? process.env.CLAUDE_CODE_SESSION_ID) || 'unavailable';
  const nowMs = Date.now();
  const normalized = normalizeLabel(args.taskLabel);
  const fingerprint = sha256(normalized).slice(0, 16);
  const sameRunGroup = args.sameRunGroup ?? sha256(`${target.name}::${normalized}`).slice(0, 12);

  mkdirSync(evidenceDir, { recursive: true });
  const eventsFile = join(evidenceDir, 'events.jsonl');

  withLock(evidenceDir, () => {
    const { events, errors } = readEventsFile(eventsFile);
    if (errors.length) {
      fail(1, `Event stream integrity failure — nothing recorded:\n  ${errors.join('\n  ')}`);
    }
    const { hash } = hashSkillDir(targetReal);
    const dup = events.find((e) => e.event_type === 'use_recorded'
      && e.target.content_hash === hash && e.payload.same_run_group === sameRunGroup);
    if (dup) {
      fail(3, `Duplicate receipt refused: run group ${sameRunGroup} already recorded on the unchanged target `
        + `(${dup.event_id}). A retry or continuation of the same task is the same qualifying use; `
        + 'a genuinely distinct use needs a distinct --task-label.');
    }
    const event = {
      schema_version: 1,
      event_id: `evt_${randomUUID()}`,
      event_type: 'use_recorded',
      recorded_at: new Date(nowMs).toISOString(),
      operator_workflow: OPERATOR,
      target: { ...target, content_hash: hash, repo_head: repoHead(root) },
      top_level_session_id: sessionId,
      payload: {
        qualifying_use: true,
        retrospective,
        task_label: args.taskLabel,
        task_fingerprint: fingerprint,
        outcome,
        symptom_key: clean ? null : args.symptomKey,
        expected: clean ? null : args.expected,
        observed: clean ? null : args.observed,
        consequence: clean ? null : args.consequence,
        workaround_taken: clean ? null : (args.workaround ?? null),
        evidence_refs: args.evidenceRefs,
        same_run_group: sameRunGroup,
      },
    };
    appendEventLine(eventsFile, event);
    try {
      const status = deriveGate({
        events: [...events, event], errors: [], currentHash: hash, target, sessionId, nowMs,
      });
      writeGateStatus(evidenceDir, status);
      process.stdout.write(`${buildReply(event.event_id, status)}\n`);
    } catch (err) {
      fail(1, `Evidence recorded: ${event.event_id}, but gate derivation failed (${err.message}). `
        + 'Rerun: evidence.mjs derive --target <skill-dir>.');
    }
  });
}

function cmdDerive(args) {
  const { targetReal, target, evidenceDir } = targetContext(args);
  const sessionId = (args.sessionId ?? process.env.CLAUDE_CODE_SESSION_ID) || 'unavailable';
  mkdirSync(evidenceDir, { recursive: true });
  withLock(evidenceDir, () => {
    const { events, errors } = readEventsFile(join(evidenceDir, 'events.jsonl'));
    const { hash } = hashSkillDir(targetReal);
    const status = deriveGate({ events, errors, currentHash: hash, target, sessionId, nowMs: Date.now() });
    writeGateStatus(evidenceDir, status);
    process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
  });
}

function cmdHash(args) {
  const { targetReal } = targetContext(args);
  const { hash, fileCount } = hashSkillDir(targetReal);
  process.stdout.write(`${hash}  (${fileCount} files)\n`);
}

const HELP = `Deterministic evidence helper (shared skill-evolution contract).

Usage:
  evidence.mjs record --target <skill-dir> --outcome <clean|friction|material_failure|severe_incident>
               --task-label "<short factual label>"
               [--symptom-key <${SYMPTOM_KEYS.join('|')}>]
               [--expected "..."] [--observed "..."] [--consequence "..."] [--workaround "..."]
               [--retrospective] [--evidence-ref <ref>]...
               [--session-id <id>] [--same-run-group <id>] [--root <repo-root>]
  evidence.mjs derive --target <skill-dir> [--session-id <id>] [--root <repo-root>]
  evidence.mjs hash   --target <skill-dir> [--root <repo-root>]

Defaults: --root = git toplevel of the working directory; --session-id = $CLAUDE_CODE_SESSION_ID
(else "unavailable", which switches the eligibility cooldown to a 12-hour clock);
--same-run-group = hash of target name + normalized task label, so a retry of the same task
deduplicates and distinct tasks need distinct labels. Evidence lives under
<root>/reports/skill-evidence/<skill-key>/. Exit codes: 0 ok; 3 refused, nothing written; 1 unsafe failure.
`;

function main() {
  const cmd = process.argv[2];
  if (cmd === undefined || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(HELP);
    process.exit(cmd === undefined ? 3 : 0);
  }
  try {
    const args = parseArgs(process.argv.slice(3));
    if (cmd === 'record') cmdRecord(args);
    else if (cmd === 'derive') cmdDerive(args);
    else if (cmd === 'hash') cmdHash(args);
    else fail(3, `Unknown command: ${cmd}. See --help.`);
  } catch (err) {
    if (err instanceof Refusal) {
      process.stderr.write(`${err.message}\n`);
      process.exit(err.code);
    }
    process.stderr.write(`Unsafe failure — nothing partial was recorded: ${err.message}\n`);
    process.exit(1);
  }
}

const isMain = process.argv[1] !== undefined
  && (() => { try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } })();
if (isMain) main();
