import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { deriveGate, hashSkillDir } from "../../skill-evidence-capture/scripts/evidence.mjs";
import { renderReport, scanRepository } from "./status.mjs";

const NOW = Date.parse("2026-07-21T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const HERE = dirname(fileURLToPath(import.meta.url));
const STATUS_SKILL = dirname(HERE);
const CAPTURE_SKILL = join(HERE, "..", "..", "skill-evidence-capture");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "skill-evolution-status-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  function skill(name, body = `# ${name}\n`) {
    const dir = join(root, ".claude", "skills", name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\n---\n${body}`);
    return {
      dir,
      name,
      path: relative(root, dir).split(sep).join("/"),
      hash: hashSkillDir(dir).hash
    };
  }

  skill("skill-evolution");

  function store(key, target, events, gate = {}) {
    const dir = join(root, "reports", "skill-evidence", key);
    mkdirSync(dir, { recursive: true });
    if (events !== null) {
      writeFileSync(
        join(dir, "events.jsonl"),
        events.map((event) => JSON.stringify(event)).join("\n") + (events.length ? "\n" : "")
      );
    }
    writeFileSync(
      join(dir, "gate-status.json"),
      `${JSON.stringify(
        {
          schema_version: 1,
          target_name: target.name,
          target_repo_relative_path: target.path,
          state: "deliberately_stale_fixture",
          ...gate
        },
        null,
        2
      )}\n`
    );
    return dir;
  }

  return { root, skill, store };
}

let eventSerial = 0;

function useEvent(
  target,
  { at, label, outcome = "friction", session = "session-a", symptom = "execution" } = {}
) {
  eventSerial += 1;
  const clean = outcome === "clean";
  return {
    schema_version: 1,
    event_id: `evt_fixture_${eventSerial}`,
    event_type: "use_recorded",
    recorded_at: new Date(at).toISOString(),
    operator_workflow: "skill-evidence-capture",
    target: {
      name: target.name,
      repo_relative_path: target.path,
      content_hash: target.hash,
      repo_head: "fixture-head"
    },
    top_level_session_id: session,
    payload: {
      qualifying_use: true,
      retrospective: false,
      task_label: label,
      task_fingerprint: `fingerprint-${label}`,
      outcome,
      symptom_key: clean ? null : symptom,
      expected: clean ? null : "expected",
      observed: clean ? null : "observed",
      consequence: clean ? null : "consequence",
      workaround_taken: null,
      evidence_refs: [],
      same_run_group: `run-${label}`
    }
  };
}

function frictionThreshold(target, thirdAt, sessions = ["session-a", "session-b", "session-c"]) {
  return [
    useEvent(target, { at: thirdAt - 2_000, label: `${target.name}-a`, session: sessions[0] }),
    useEvent(target, { at: thirdAt - 1_000, label: `${target.name}-b`, session: sessions[1] }),
    useEvent(target, { at: thirdAt, label: `${target.name}-c`, session: sessions[2] })
  ];
}

function reviewStarted(target, triggerIds, at = NOW - HOUR) {
  eventSerial += 1;
  return {
    schema_version: 1,
    event_id: `evt_fixture_${eventSerial}`,
    event_type: "review_started",
    recorded_at: new Date(at).toISOString(),
    operator_workflow: "skill-evolution",
    target: {
      name: target.name,
      repo_relative_path: target.path,
      content_hash: target.hash,
      repo_head: "fixture-head"
    },
    top_level_session_id: "review-session",
    payload: {
      review_id: "rev_active_fixture",
      target_hash: target.hash,
      trigger_event_ids: triggerIds,
      authorizing_rule: "friction_recurrence:execution",
      risk_tier: "provisional",
      session_or_cooldown_proof: { type: "different_session" }
    }
  };
}

test("a session-ID threshold on a no-ID host is blocked with no command (fail closed)", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("session-threshold");
  fx.store(target.name, target, frictionThreshold(target, NOW - HOUR));

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "unavailable" });

  assert.equal(report.summary.stores_scanned, 1);
  assert.equal(report.ready.length, 0);
  assert.equal(report.blocked.length, 1);
  assert.equal(report.blocked[0].kind, "session_host_required");
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.match(rendered, /session-ID-capable host/i);
  assert.match(rendered, /waiting will not help/i);
  assert.doesNotMatch(rendered, /\$skill-evolution/);
});

test("a session-ID threshold on a session-ID-capable host is ready with a command", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("session-ready");
  fx.store(target.name, target, frictionThreshold(target, NOW - HOUR));

  // Any supported host identity (here a Codex thread) that differs from the threshold session.
  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "codex-thread-x" });

  assert.equal(report.summary.stores_scanned, 1);
  assert.equal(report.ready.length, 1);
  assert.equal(report.ready[0].proof.type, "different_session");
  assert.equal(report.ready[0].command, '$skill-evolution ".claude/skills/session-ready"');
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.match(rendered, /differs from the threshold session/i);
  // Terminology is host-neutral: it must not imply Claude Code is the only capable host.
  assert.doesNotMatch(rendered, /CLAUDE_CODE_SESSION_ID/);
});

test("a census inside the threshold session stays ready and names the refusal it foresees", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("threshold-session-census");
  fx.store(target.name, target, frictionThreshold(target, NOW - HOUR));

  // The event completing the threshold carries session-c, so this census runs inside it.
  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "session-c" });

  assert.equal(report.ready.length, 1);
  assert.equal(report.ready[0].threshold_session_id, "session-c");
  assert.equal(
    report.ready[0].command,
    '$skill-evolution ".claude/skills/threshold-session-census"'
  );
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.match(rendered, /## Ready to evolve/);
  assert.match(rendered, /this census session recorded the threshold \(`session-c`\)/i);
  assert.match(rendered, /cannot be the destination/i);
  // The warning must not loosen the destination proof stated directly above it: a
  // session-ID threshold still refuses a no-ID destination.
  assert.doesNotMatch(rendered, /any other top-level session/i);
});

test("a quarantined census inside the threshold session renders quarantine and the warning", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("threshold-session-severe");
  fx.store(target.name, target, [
    useEvent(target, {
      at: NOW - HOUR,
      label: "severe-threshold-session",
      outcome: "severe_incident",
      session: "threshold-session",
      symptom: "state"
    })
  ]);

  const report = await scanRepository({
    root: fx.root,
    nowMs: NOW,
    sessionId: "threshold-session"
  });

  assert.equal(report.ready.length, 1);
  assert.equal(report.ready[0].quarantined, true);
  assert.equal(report.ready[0].threshold_session_id, "threshold-session");
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.match(rendered, /Stop using this target/);
  assert.match(rendered, /recorded the threshold \(`threshold-session`\)/i);
  assert.match(rendered, /cannot be the destination/i);
});

test("a census outside the threshold session renders no threshold-session warning", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("other-session-census");
  fx.store(target.name, target, frictionThreshold(target, NOW - HOUR));

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready.length, 1);
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.doesNotMatch(rendered, /recorded the threshold/i);
  assert.doesNotMatch(rendered, /cannot be the destination/i);
});

test("an eligible_pending_cooldown gate state never removes a ready target from the census", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("pending-cooldown-ready");
  const events = frictionThreshold(target, NOW - HOUR);
  fx.store(target.name, target, events);

  // Derived inside the threshold session, this store carries the exact state
  // $skill-evolution refuses; readiness must come from session-invariant facts instead,
  // because the destination session is a different one.
  const derived = deriveGate({
    events,
    errors: [],
    currentHash: target.hash,
    target: { name: target.name, repo_relative_path: target.path },
    sessionId: "session-c",
    nowMs: NOW
  });
  assert.equal(derived.state, "eligible_pending_cooldown");

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "session-c" });

  assert.equal(report.ready.length, 1);
  assert.equal(report.summary.omitted_not_eligible, 0);
});

test("entries carry the session-invariant threshold identity and never a derived gate state", async (t) => {
  const fx = fixture(t);
  const ready = fx.skill("shape-ready");
  fx.store(ready.name, ready, frictionThreshold(ready, NOW - HOUR));

  const waiting = fx.skill("shape-timer");
  fx.store(
    waiting.name,
    waiting,
    frictionThreshold(waiting, NOW - 2 * HOUR, ["unavailable", "unavailable", "unavailable"])
  );

  const claimed = fx.skill("shape-claimed");
  const triggers = frictionThreshold(claimed, NOW - 2 * HOUR);
  fx.store(claimed.name, claimed, [
    ...triggers,
    reviewStarted(
      claimed,
      triggers.map((event) => event.event_id)
    )
  ]);

  const corrupt = fx.skill("shape-corrupt");
  const corruptDir = fx.store(corrupt.name, corrupt, frictionThreshold(corrupt, NOW - HOUR));
  writeFileSync(
    join(corruptDir, "events.jsonl"),
    `${readFileSync(join(corruptDir, "events.jsonl"), "utf8")}not-json\n`
  );

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready.length, 1);
  assert.equal(report.blocked.length, 2);
  assert.equal(report.indeterminate.length, 1);
  for (const entry of [...report.ready, ...report.blocked, ...report.indeterminate]) {
    assert.equal(
      Object.hasOwn(entry, "gate_state"),
      false,
      `${entry.store_key} carries gate_state`
    );
  }
  for (const entry of [...report.ready, ...report.blocked]) {
    assert.equal(
      Object.hasOwn(entry, "threshold_session_id"),
      true,
      `${entry.store_key} lacks threshold_session_id`
    );
  }
  assert.equal(report.ready[0].threshold_session_id, "session-c");
  assert.equal(report.blocked.find((entry) => entry.kind === "timer").threshold_session_id, null);
  assert.equal(
    report.blocked.find((entry) => entry.kind === "review_in_progress").threshold_session_id,
    "session-c"
  );
});

test("an unelapsed clock gate is blocked with an exact countdown and timestamps", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("timer-waiting");
  fx.store(
    target.name,
    target,
    frictionThreshold(target, NOW - 2 * HOUR, ["unavailable", "unavailable", "unavailable"])
  );

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "unavailable" });

  assert.equal(report.ready.length, 0);
  assert.equal(report.blocked.length, 1);
  assert.equal(report.blocked[0].kind, "timer");
  assert.equal(report.blocked[0].remaining_ms, 10 * HOUR);
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.match(rendered, /10h 00m/);
  assert.match(rendered, /2026-07-21T22:00:00\.000Z/);
  assert.doesNotMatch(rendered, /\$skill-evolution/);
});

test("an elapsed clock gate is ready in either host family", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("timer-ready");
  fx.store(
    target.name,
    target,
    frictionThreshold(target, NOW - 13 * HOUR, ["unavailable", "unavailable", "unavailable"])
  );

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "unavailable" });

  assert.equal(report.ready.length, 1);
  assert.equal(report.ready[0].proof.type, "cooldown_elapsed");
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.match(rendered, /clock proof already passed/);
  // A clock threshold has no session identity, so a no-ID census host must not be
  // mistaken for it.
  assert.doesNotMatch(rendered, /recorded the threshold/i);
});

test("quarantine remains visible for both ready and timer-blocked severe incidents", async (t) => {
  const fx = fixture(t);
  const ready = fx.skill("quarantined-ready");
  const waiting = fx.skill("quarantined-waiting");
  fx.store(ready.name, ready, [
    useEvent(ready, {
      at: NOW - HOUR,
      label: "severe-ready",
      outcome: "severe_incident",
      session: "threshold-session",
      symptom: "state"
    })
  ]);
  fx.store(waiting.name, waiting, [
    useEvent(waiting, {
      at: NOW - HOUR,
      label: "severe-waiting",
      outcome: "severe_incident",
      session: "unavailable",
      symptom: "state"
    })
  ]);

  // The session-ID (ready) severe threshold needs a session-ID-capable host to be ready;
  // the unavailable-session (waiting) one is on the 12-hour clock regardless of host.
  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready[0].quarantined, true);
  assert.equal(report.blocked[0].quarantined, true);
  assert.equal(report.blocked[0].remaining_ms, 11 * HOUR);
  assert.match(renderReport(report, { timeZone: "UTC" }), /Stop using this target/);
});

test("an authorized claimed review is reported as owned rather than ready", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("claimed");
  const triggers = frictionThreshold(target, NOW - 2 * HOUR);
  fx.store(target.name, target, [
    ...triggers,
    reviewStarted(
      target,
      triggers.map((event) => event.event_id)
    )
  ]);

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready.length, 0);
  assert.equal(report.blocked.length, 1);
  assert.equal(report.blocked[0].kind, "review_in_progress");
  assert.equal(report.blocked[0].review_id, "rev_active_fixture");
  assert.match(renderReport(report, { timeZone: "UTC" }), /rev_active_fixture/);
});

test("a non-evolution decontamination claim without an evidence gate stays omitted", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("legacy-claimed-only");
  const started = reviewStarted(target, []);
  started.event_type = "decontamination_started";
  started.operator_workflow = "legacy-skill-decontamination";
  fx.store(target.name, target, [started]);

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready.length, 0);
  assert.equal(report.blocked.length, 0);
  assert.equal(report.summary.omitted_not_eligible, 1);
});

test("skill-evolution self-target eligibility routes to an independent writer without a command", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("skill-evolution");
  fx.store(target.name, target, frictionThreshold(target, NOW - HOUR));

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready.length, 0);
  assert.equal(report.blocked[0].kind, "self_target");
  const rendered = renderReport(report, { timeZone: "UTC" });
  assert.match(rendered, /independent skill-writer/);
  assert.doesNotMatch(rendered, /\$skill-evolution ".claude\/skills\/skill-evolution"/);
});

test("corrupt streams and missing targets are surfaced as indeterminate", async (t) => {
  const fx = fixture(t);
  const corrupt = fx.skill("corrupt");
  const corruptDir = fx.store(corrupt.name, corrupt, [
    useEvent(corrupt, {
      at: NOW - HOUR,
      label: "corrupt-use",
      outcome: "clean",
      session: "session-a"
    })
  ]);
  writeFileSync(
    join(corruptDir, "events.jsonl"),
    `${readFileSync(join(corruptDir, "events.jsonl"), "utf8")}not-json\n`
  );

  const missing = {
    name: "missing",
    path: ".claude/skills/missing",
    hash: "missing-target-hash"
  };
  fx.store(missing.name, missing, [
    useEvent(missing, {
      at: NOW - HOUR,
      label: "missing-use",
      outcome: "clean",
      session: "session-a"
    })
  ]);

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "unavailable" });

  assert.equal(report.indeterminate.length, 2);
  assert.deepEqual(report.indeterminate.map((entry) => entry.kind).sort(), [
    "integrity",
    "missing_target"
  ]);
  assert.match(renderReport(report, { timeZone: "UTC" }), /Could not determine/);
});

test("closed, collecting, and old-hash eligibility are omitted but counted", async (t) => {
  const fx = fixture(t);
  const closed = fx.skill("closed");
  fx.store(closed.name, closed, [
    useEvent(closed, {
      at: NOW - HOUR,
      label: "clean",
      outcome: "clean",
      session: "session-a"
    })
  ]);

  const collecting = fx.skill("collecting");
  fx.store(collecting.name, collecting, frictionThreshold(collecting, NOW - HOUR).slice(0, 2));

  const changed = fx.skill("changed");
  fx.store(changed.name, changed, frictionThreshold(changed, NOW - HOUR));
  writeFileSync(join(changed.dir, "SKILL.md"), "---\nname: changed\n---\nchanged bytes\n");

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready.length, 0);
  assert.equal(report.blocked.length, 0);
  assert.equal(report.indeterminate.length, 0);
  assert.equal(report.summary.omitted_not_eligible, 3);
});

test("an empty repository returns a complete zero census", async (t) => {
  const fx = fixture(t);

  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "unavailable" });

  assert.deepEqual(report.summary, {
    stores_scanned: 0,
    ready: 0,
    blocked: 0,
    indeterminate: 0,
    omitted_not_eligible: 0
  });
  assert.match(renderReport(report, { timeZone: "UTC" }), /No eligible targets found/);
});

test("a repository without the sibling evolution skill fails safely", async (t) => {
  const fx = fixture(t);
  rmSync(join(fx.root, ".claude", "skills", "skill-evolution"), {
    recursive: true,
    force: true
  });

  await assert.rejects(
    scanRepository({ root: fx.root, nowMs: NOW, sessionId: "unavailable" }),
    /Required sibling Skill Evolution not found/
  );
});

test("the census leaves event and gate projections byte-for-byte and mtime unchanged", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("read-only");
  const storeDir = fx.store(target.name, target, frictionThreshold(target, NOW - HOUR));
  const paths = ["events.jsonl", "gate-status.json"].map((name) => join(storeDir, name));
  const before = paths.map((path) => ({
    bytes: readFileSync(path),
    mtimeMs: statSync(path).mtimeMs
  }));

  await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "unavailable" });

  paths.forEach((path, index) => {
    assert.deepEqual(readFileSync(path), before[index].bytes);
    assert.equal(statSync(path).mtimeMs, before[index].mtimeMs);
  });
});

test("target names are derived from evidence rather than report-directory keys", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("colliding-name");
  fx.store("colliding-name-deadbeef", target, frictionThreshold(target, NOW - HOUR));

  // A session-ID threshold is ready only from a session-ID-capable host.
  const report = await scanRepository({ root: fx.root, nowMs: NOW, sessionId: "fresh-session" });

  assert.equal(report.ready[0].target_name, basename(target.dir));
  assert.equal(report.ready[0].target_path, ".claude/skills/colliding-name");
});

test("the copied skill runs from another repository with only its sibling contract", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("portable-target");
  // A clock-elapsed threshold emits a command on any host, so portability is proven
  // independently of the current host's top-level-session identity.
  fx.store(
    target.name,
    target,
    frictionThreshold(target, NOW - 13 * HOUR, ["unavailable", "unavailable", "unavailable"])
  );
  const skillsDir = join(fx.root, ".claude", "skills");
  cpSync(STATUS_SKILL, join(skillsDir, "skill-evolution-status"), { recursive: true });
  cpSync(CAPTURE_SKILL, join(skillsDir, "skill-evidence-capture"), { recursive: true });
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  delete env.CODEX_THREAD_ID;

  const result = spawnSync(
    process.execPath,
    [join(skillsDir, "skill-evolution-status", "scripts", "status.mjs")],
    { cwd: fx.root, encoding: "utf8", env }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Scanned 1 evidence store read-only/);
  assert.match(result.stdout, /\$skill-evolution ".claude\/skills\/portable-target"/);
});

test("a session-ID threshold is command-ready end-to-end from a Codex host", async (t) => {
  const fx = fixture(t);
  const target = fx.skill("codex-host-target");
  fx.store(target.name, target, frictionThreshold(target, NOW - HOUR));
  const skillsDir = join(fx.root, ".claude", "skills");
  cpSync(STATUS_SKILL, join(skillsDir, "skill-evolution-status"), { recursive: true });
  cpSync(CAPTURE_SKILL, join(skillsDir, "skill-evidence-capture"), { recursive: true });
  // Codex host identity, distinct from the threshold session, with no Claude Code identity.
  const env = { ...process.env, CODEX_THREAD_ID: "codex-thread-run" };
  delete env.CLAUDE_CODE_SESSION_ID;

  const result = spawnSync(
    process.execPath,
    [join(skillsDir, "skill-evolution-status", "scripts", "status.mjs")],
    { cwd: fx.root, encoding: "utf8", env }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /## Ready to evolve/);
  assert.match(result.stdout, /\$skill-evolution ".claude\/skills\/codex-host-target"/);
});
