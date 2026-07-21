#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CONTRACT_URL = new URL("../../skill-evidence-capture/scripts/evidence.mjs", import.meta.url);
const ELIGIBILITY_STATES = new Set([
  "eligible",
  "eligible_pending_cooldown",
  "quarantined_eligible",
  "quarantined_pending_cooldown"
]);
const START_EVENT_TYPES = new Set(["review_started", "decontamination_started"]);

let contractPromise;

async function loadContract() {
  if (!contractPromise) {
    contractPromise = (async () => {
      const contractPath = fileURLToPath(CONTRACT_URL);
      if (!existsSync(contractPath)) {
        throw new Error(`Required sibling evidence contract not found: ${contractPath}`);
      }
      const contract = await import(CONTRACT_URL.href);
      for (const name of ["deriveGate", "detectRoot", "hashSkillDir", "readEventsFile"]) {
        if (typeof contract[name] !== "function") {
          throw new Error(`Sibling evidence contract is incompatible: missing export ${name}.`);
        }
      }
      return contract;
    })();
  }
  return contractPromise;
}

const toRepoPath = (root, path) => {
  const rel = relative(root, path);
  return rel.startsWith("..") ? path : rel.split(sep).join("/");
};

function readProjection(path) {
  if (!existsSync(path)) return { value: null, error: null };
  try {
    return { value: JSON.parse(readFileSync(path, "utf8")), error: null };
  } catch (error) {
    return { value: null, error: `gate-status.json is not valid JSON: ${error.message}` };
  }
}

function resolveRecordedTarget(root, recordedPath) {
  const candidate = resolve(root, recordedPath);
  if (!existsSync(candidate) || !statSync(candidate).isDirectory()) {
    throw new Error(`target skill directory not found: ${recordedPath}`);
  }
  const targetReal = realpathSync(candidate);
  if (!existsSync(join(targetReal, "SKILL.md"))) {
    throw new Error(`target is not a skill directory (no SKILL.md): ${recordedPath}`);
  }
  return targetReal;
}

function targetIdentity(events, projection) {
  const eventPaths = [...new Set(events.map((event) => event.target.repo_relative_path))];
  if (eventPaths.length > 1) {
    return { error: `validated events name multiple target paths: ${eventPaths.join(", ")}` };
  }
  if (eventPaths.length === 1) {
    const latest = [...events]
      .reverse()
      .find((event) => event.target.repo_relative_path === eventPaths[0]);
    return { path: eventPaths[0], name: latest.target.name };
  }
  if (
    typeof projection?.target_repo_relative_path === "string" &&
    projection.target_repo_relative_path.length > 0
  ) {
    return {
      path: projection.target_repo_relative_path,
      name: projection.target_name ?? basename(projection.target_repo_relative_path)
    };
  }
  return { error: "no target path exists in events.jsonl or gate-status.json" };
}

function activeStart(events, reviewId) {
  return (
    [...events]
      .reverse()
      .find(
        (event) => START_EVENT_TYPES.has(event.event_type) && event.payload.review_id === reviewId
      ) ?? null
  );
}

function isSkillEvolutionTarget(root, targetReal) {
  const operator = join(root, ".claude", "skills", "skill-evolution");
  if (!existsSync(operator)) return false;
  try {
    return realpathSync(operator) === targetReal;
  } catch {
    return false;
  }
}

const quarantined = (status) =>
  status.authorization_reason === "severe" || status.state.startsWith("quarantined_");

function timerDetails(status, nowMs) {
  if (typeof status.not_before !== "string") return null;
  const notBeforeMs = Date.parse(status.not_before);
  if (Number.isNaN(notBeforeMs)) return null;
  return {
    not_before: new Date(notBeforeMs).toISOString(),
    remaining_ms: Math.max(0, notBeforeMs - nowMs)
  };
}

function commandFor(targetPath) {
  const escaped = targetPath.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `$skill-evolution "${escaped}"`;
}

function inspectStore({ api, root, storeDir, storeKey, sessionId, nowMs }) {
  const eventsPath = join(storeDir, "events.jsonl");
  const { events, errors } = api.readEventsFile(eventsPath);
  const projection = readProjection(join(storeDir, "gate-status.json"));
  const identity = targetIdentity(events, projection.value);

  if (identity.error) {
    return {
      category: "indeterminate",
      value: {
        kind: errors.length ? "integrity" : "unidentified_store",
        store_key: storeKey,
        target_name: projection.value?.target_name ?? storeKey,
        target_path: projection.value?.target_repo_relative_path ?? null,
        errors: [...errors, projection.error, identity.error].filter(Boolean)
      }
    };
  }

  let targetReal;
  try {
    targetReal = resolveRecordedTarget(root, identity.path);
  } catch (error) {
    return {
      category: "indeterminate",
      value: {
        kind: errors.length ? "integrity" : "missing_target",
        store_key: storeKey,
        target_name: identity.name,
        target_path: identity.path,
        errors: [...errors, error.message]
      }
    };
  }

  const targetPath = toRepoPath(root, targetReal);
  const target = { name: basename(targetReal), repo_relative_path: targetPath };
  const currentHash = api.hashSkillDir(targetReal).hash;
  const status = api.deriveGate({
    events,
    errors,
    currentHash,
    target,
    sessionId,
    nowMs
  });

  if (status.state === "blocked") {
    return {
      category: "indeterminate",
      value: {
        kind: "integrity",
        store_key: storeKey,
        target_name: target.name,
        target_path: targetPath,
        errors: status.integrity_errors ?? errors
      }
    };
  }

  if (status.state === "review_in_progress") {
    const started = activeStart(events, status.active_review_id);
    const isEvolutionReview = started?.event_type === "review_started";
    const withoutActiveStart = started
      ? events.filter((event) => event.event_id !== started.event_id)
      : events;
    const underlying = api.deriveGate({
      events: withoutActiveStart,
      errors: [],
      currentHash,
      target,
      sessionId,
      nowMs
    });
    if (!isEvolutionReview && !ELIGIBILITY_STATES.has(underlying.state)) {
      return { category: "omitted" };
    }
    return {
      category: "blocked",
      value: {
        kind: "review_in_progress",
        store_key: storeKey,
        target_name: target.name,
        target_path: targetPath,
        review_id: status.active_review_id,
        started_at: started?.recorded_at ?? null,
        operator_workflow: started?.operator_workflow ?? null,
        risk_tier: started?.payload?.risk_tier ?? null,
        review_artifacts: `${toRepoPath(root, storeDir)}/reviews`,
        quarantined: underlying.authorization_reason === "severe",
        authorization_reason:
          started?.payload?.authorizing_rule ?? underlying.authorization_reason ?? null
      }
    };
  }

  if (!ELIGIBILITY_STATES.has(status.state)) return { category: "omitted" };

  const timer = timerDetails(status, nowMs);
  const common = {
    store_key: storeKey,
    target_name: target.name,
    target_path: targetPath,
    gate_state: status.state,
    authorization_reason: status.authorization_reason,
    quarantined: quarantined(status),
    trigger_event_ids: status.trigger_event_ids
  };

  if (isSkillEvolutionTarget(root, targetReal)) {
    return {
      category: "blocked",
      value: {
        ...common,
        kind: "self_target",
        proof:
          status.threshold_session_id === null
            ? { type: "clock", ...timer }
            : { type: "different_session" }
      }
    };
  }

  if (status.threshold_session_id !== null) {
    return {
      category: "ready",
      value: {
        ...common,
        command: commandFor(targetPath),
        proof: {
          type: "different_session",
          current_host_has_session_id: sessionId !== "unavailable"
        }
      }
    };
  }

  if (timer === null) {
    return {
      category: "indeterminate",
      value: {
        kind: "incompatible_projection",
        store_key: storeKey,
        target_name: target.name,
        target_path: targetPath,
        errors: ["eligible clock-based gate did not provide a valid not_before timestamp"]
      }
    };
  }

  if (timer.remaining_ms > 0) {
    return {
      category: "blocked",
      value: {
        ...common,
        ...timer,
        kind: "timer"
      }
    };
  }

  return {
    category: "ready",
    value: {
      ...common,
      command: commandFor(targetPath),
      proof: { type: "cooldown_elapsed", not_before: timer.not_before }
    }
  };
}

function sortEntries(report) {
  const byTarget = (a, b) => a.target_path.localeCompare(b.target_path);
  report.ready.sort((a, b) => Number(b.quarantined) - Number(a.quarantined) || byTarget(a, b));
  report.blocked.sort(
    (a, b) =>
      Number(b.quarantined) - Number(a.quarantined) ||
      (a.not_before ?? "").localeCompare(b.not_before ?? "") ||
      byTarget(a, b)
  );
  report.indeterminate.sort((a, b) =>
    (a.target_path ?? a.store_key).localeCompare(b.target_path ?? b.store_key)
  );
}

export async function scanRepository({
  root,
  sessionId = process.env.CLAUDE_CODE_SESSION_ID || "unavailable",
  nowMs = Date.now(),
  contract
} = {}) {
  const api = contract ?? (await loadContract());
  const repoRoot = root ? realpathSync(resolve(root)) : api.detectRoot();
  const evolutionSkill = join(repoRoot, ".claude", "skills", "skill-evolution", "SKILL.md");
  if (!existsSync(evolutionSkill)) {
    throw new Error(`Required sibling Skill Evolution not found: ${evolutionSkill}`);
  }
  const evidenceRoot = join(repoRoot, "reports", "skill-evidence");
  const storeDirs = existsSync(evidenceRoot)
    ? readdirSync(evidenceRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({ key: entry.name, dir: join(evidenceRoot, entry.name) }))
        .sort((a, b) => a.key.localeCompare(b.key))
    : [];

  const report = {
    schema_version: 1,
    generated_at: new Date(nowMs).toISOString(),
    repository_root: repoRoot,
    current_host_has_session_id: sessionId !== "unavailable",
    ready: [],
    blocked: [],
    indeterminate: [],
    summary: {
      stores_scanned: storeDirs.length,
      ready: 0,
      blocked: 0,
      indeterminate: 0,
      omitted_not_eligible: 0
    }
  };

  for (const store of storeDirs) {
    let result;
    try {
      result = inspectStore({
        api,
        root: repoRoot,
        storeDir: store.dir,
        storeKey: store.key,
        sessionId,
        nowMs
      });
    } catch (error) {
      result = {
        category: "indeterminate",
        value: {
          kind: "scan_failure",
          store_key: store.key,
          target_name: store.key,
          target_path: null,
          errors: [error.message]
        }
      };
    }
    if (result.category === "omitted") report.summary.omitted_not_eligible += 1;
    else report[result.category].push(result.value);
  }

  sortEntries(report);
  report.summary.ready = report.ready.length;
  report.summary.blocked = report.blocked.length;
  report.summary.indeterminate = report.indeterminate.length;
  return report;
}

function formatDuration(ms) {
  if (ms <= 0) return "0m";
  const minutes = Math.ceil(ms / 60_000);
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${String(hours).padStart(days ? 2 : 1, "0")}h`);
  parts.push(`${String(mins).padStart(hours || days ? 2 : 1, "0")}m`);
  return parts.join(" ");
}

function formatLocal(iso, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short"
  }).format(new Date(iso));
}

function explainReason(reason) {
  if (reason === "severe") return "one contemporaneous severe incident (`severe`)";
  if (reason === "ten_use_unresolved") {
    return "ten qualifying uses on the unchanged target with an open contemporaneous incident (`ten_use_unresolved`)";
  }
  if (reason?.startsWith("material_recurrence:")) {
    const symptom = reason.slice("material_recurrence:".length);
    return `two independent material-failure-or-worse incidents in the \`${symptom}\` symptom cluster (\`${reason}\`)`;
  }
  if (reason?.startsWith("friction_recurrence:")) {
    const symptom = reason.slice("friction_recurrence:".length);
    return `three independent friction-or-worse incidents in the \`${symptom}\` symptom cluster (\`${reason}\`)`;
  }
  return reason ? `gate rule \`${reason}\`` : "authorization rule unavailable";
}

function quarantineLine(entry) {
  return entry.quarantined
    ? "- Quarantine: Stop using this target. Immediate containment is allowed; permanent edits still require the authorized review."
    : null;
}

function renderReady(entry, timeZone) {
  const lines = [
    `### ${entry.target_path}${entry.quarantined ? " — QUARANTINED" : ""}`,
    "",
    `- Eligibility: ${explainReason(entry.authorization_reason)}.`
  ];
  if (entry.proof.type === "different_session") {
    lines.push(
      "- Destination proof: Paste into a session-ID-capable fresh session whose `CLAUDE_CODE_SESSION_ID` differs from the threshold session. A no-ID destination will be refused; waiting will not help."
    );
  } else {
    lines.push(
      `- Destination proof: The 12-hour clock proof already passed at ${formatLocal(entry.proof.not_before, timeZone)} (${timeZone}); ${entry.proof.not_before}. A destination session ID is not required.`
    );
  }
  const quarantine = quarantineLine(entry);
  if (quarantine) lines.push(quarantine);
  lines.push("", "Paste into another top-level session:", "", "```text", entry.command, "```");
  return lines.join("\n");
}

function renderBlocked(entry, timeZone) {
  const lines = [
    `### ${entry.target_path}${entry.quarantined ? " — QUARANTINED" : ""}`,
    "",
    `- Eligibility: ${explainReason(entry.authorization_reason)}.`
  ];
  if (entry.kind === "timer") {
    lines.push(
      `- Blocker: 12-hour clock fallback; ${formatDuration(entry.remaining_ms)} remaining.`
    );
    lines.push(
      `- Eligible at: ${formatLocal(entry.not_before, timeZone)} (${timeZone}); ${entry.not_before}.`
    );
    lines.push("- Session effect: Changing sessions will not bypass this timer.");
  } else if (entry.kind === "review_in_progress") {
    lines.push(`- Blocker: Active review \`${entry.review_id}\` already owns the target.`);
    if (entry.started_at)
      lines.push(
        `- Claimed at: ${formatLocal(entry.started_at, timeZone)} (${timeZone}); ${entry.started_at}.`
      );
    if (entry.operator_workflow)
      lines.push(
        `- Owner workflow: \`${entry.operator_workflow}\`${entry.risk_tier ? `; risk tier \`${entry.risk_tier}\`` : ""}.`
      );
    lines.push(`- Review artifacts: \`${entry.review_artifacts}\`.`);
  } else if (entry.kind === "self_target") {
    lines.push(
      "- Blocker: Skill Evolution cannot target itself, so no `$skill-evolution` command is valid."
    );
    lines.push("- Route: Give the bounded evidence packet to an independent skill-writer.");
    if (entry.proof?.type === "clock" && entry.proof.remaining_ms > 0) {
      lines.push(
        `- Additional clock blocker: ${formatDuration(entry.proof.remaining_ms)} remaining; ${entry.proof.not_before}.`
      );
    } else if (entry.proof?.type === "different_session") {
      lines.push(
        "- Session note: A different session can satisfy freshness but cannot remove the self-target prohibition."
      );
    }
  }
  const quarantine = quarantineLine(entry);
  if (quarantine) lines.push(quarantine);
  return lines.join("\n");
}

function renderIndeterminate(entry) {
  const label = entry.target_path ?? `evidence store ${entry.store_key}`;
  return [
    `### ${label}`,
    "",
    `- Status: \`${entry.kind}\`.`,
    ...entry.errors.map((error) => `- ${error}`)
  ].join("\n");
}

export function renderReport(
  report,
  { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" } = {}
) {
  const lines = [
    "# Skill Evolution Status",
    "",
    `Scanned ${report.summary.stores_scanned} evidence ${report.summary.stores_scanned === 1 ? "store" : "stores"} read-only. ` +
      `Ready: ${report.summary.ready}; blocked after eligibility: ${report.summary.blocked}; ` +
      `indeterminate: ${report.summary.indeterminate}; omitted as not eligible: ${report.summary.omitted_not_eligible}.`
  ];

  if (report.ready.length === 0 && report.blocked.length === 0) {
    lines.push("", "No eligible targets found.");
  }
  if (report.ready.length) {
    lines.push("", "## Ready to evolve", "");
    lines.push(report.ready.map((entry) => renderReady(entry, timeZone)).join("\n\n"));
  }
  if (report.blocked.length) {
    lines.push("", "## Eligible but blocked", "");
    lines.push(report.blocked.map((entry) => renderBlocked(entry, timeZone)).join("\n\n"));
  }
  if (report.indeterminate.length) {
    lines.push("", "## Could not determine", "");
    lines.push(report.indeterminate.map(renderIndeterminate).join("\n\n"));
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  if (process.argv.length !== 2) {
    process.stderr.write("Usage: $skill-evolution-status (no arguments).\n");
    process.exitCode = 3;
    return;
  }
  try {
    const report = await scanRepository();
    process.stdout.write(renderReport(report));
  } catch (error) {
    process.stderr.write(
      `Skill Evolution Status failed safely: ${error.message}\n` +
        "No evidence, gate, or target files were changed.\n"
    );
    process.exitCode = 1;
  }
}

const isMain =
  process.argv[1] !== undefined &&
  (() => {
    try {
      return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
    } catch {
      return false;
    }
  })();

if (isMain) await main();
