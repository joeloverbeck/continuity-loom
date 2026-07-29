import { useEffect, useState } from "react";

import {
  isRecoverableOutputLimitReceipt,
  lowerOutputLimitEffort,
  raiseOutputLimitCeiling
} from "./openrouter-output-limit-recovery.js";
import type { OpenRouterReasoningEffort } from "./api.js";
import type { OpenRouterDiagnosticReceipt as Receipt } from "./openrouter-transport.js";

export function OpenRouterDiagnosticReceipt({
  receipt,
  onClear
}: {
  receipt: Receipt;
  onClear?: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const recoverable = isRecoverableOutputLimitReceipt(receipt) ? receipt : undefined;
  const defaultLowerEffort = recoverable?.sentPolicy.supportedLowerEfforts.at(-1) ?? "";
  const defaultHigherCeiling = String((recoverable?.sentPolicy.completionCeiling ?? 0) + 1);
  const recoveryPolicyIdentity = recoverable === undefined
    ? "none"
    : [
        recoverable.sentPolicy.outputClass,
        recoverable.sentPolicy.completionCeiling,
        recoverable.sentPolicy.reasoningEffort,
        ...recoverable.sentPolicy.supportedLowerEfforts
      ].join(":");
  const [lowerEffort, setLowerEffort] = useState<OpenRouterReasoningEffort | "">(
    defaultLowerEffort
  );
  const [higherCeiling, setHigherCeiling] = useState(defaultHigherCeiling);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const lines = receiptLines(receipt);

  useEffect(() => {
    setLowerEffort(defaultLowerEffort);
    setHigherCeiling(defaultHigherCeiling);
    setRecoveryStatus(null);
  }, [defaultHigherCeiling, defaultLowerEffort, recoveryPolicyIdentity]);

  async function copyReceipt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  async function applyLowerEffort(): Promise<void> {
    if (recoverable === undefined || lowerEffort === "") {
      return;
    }
    setIsRecovering(true);
    setRecoveryStatus(null);
    try {
      await lowerOutputLimitEffort(recoverable, lowerEffort);
      setRecoveryStatus(
        `${outputClassLabel(recoverable.sentPolicy.outputClass)} reasoning effort changed to ${lowerEffort}. ` +
        "Prior inspection is stale. Inspect again, then use the original action explicitly. No request was sent."
      );
    } catch (error) {
      setRecoveryStatus(error instanceof Error ? error.message : "The reasoning effort could not be changed.");
    } finally {
      setIsRecovering(false);
    }
  }

  async function applyHigherCeiling(): Promise<void> {
    if (recoverable === undefined) {
      return;
    }
    setIsRecovering(true);
    setRecoveryStatus(null);
    try {
      const completionCeiling = Number(higherCeiling);
      await raiseOutputLimitCeiling(recoverable, completionCeiling);
      setRecoveryStatus(
        `${outputClassLabel(recoverable.sentPolicy.outputClass)} completion ceiling changed to ${completionCeiling}. ` +
        "Prior inspection is stale. Inspect again, then use the original action explicitly. No request was sent."
      );
    } catch (error) {
      setRecoveryStatus(error instanceof Error ? error.message : "The completion ceiling could not be changed.");
    } finally {
      setIsRecovering(false);
    }
  }

  return (
    <section className="status statusError openRouterDiagnostic" role="alert" aria-label="OpenRouter diagnostic">
      <p><strong>{receipt.summary}</strong></p>
      <p>{receipt.recovery}</p>
      {receipt.structuralReason ? (
        <p>
          <strong>Safe structural reason:</strong>{" "}
          {receipt.structuralReason.findingNumber === undefined
            ? receipt.structuralReason.message
            : `Finding ${receipt.structuralReason.findingNumber}: ${receipt.structuralReason.message}`}
        </p>
      ) : null}
      {recoverable ? (
        <>
          <p><strong>{outputClassLabel(recoverable.sentPolicy.outputClass)} output policy sent</strong></p>
          <p>
            {recoverable.sentPolicy.reasoningEffort} reasoning effort with a {recoverable.sentPolicy.completionCeiling}-token
            completion ceiling. Reasoning was enabled and its content was excluded.
          </p>
          {recoverable.details.usage?.reasoningTokens !== undefined ? (
            <p>
              OpenRouter reported {recoverable.details.usage.reasoningTokens} aggregate reasoning tokens. This transient
              count is not reasoning content, prose, canon, prompt context, or accepted provenance.
            </p>
          ) : null}
          <fieldset>
            <legend>Output-limit recovery</legend>
            <p>Each control makes one explicit change for the affected output class. Neither route sends or refreshes anything.</p>
            <label>
              Lower {outputClassLabel(recoverable.sentPolicy.outputClass)} reasoning effort
              <select
                value={lowerEffort}
                disabled={recoverable.sentPolicy.supportedLowerEfforts.length === 0 || isRecovering}
                onChange={(event) => setLowerEffort(event.target.value as typeof lowerEffort)}
              >
                {recoverable.sentPolicy.supportedLowerEfforts.length === 0 ? (
                  <option value="">No supported lower effort</option>
                ) : null}
                {recoverable.sentPolicy.supportedLowerEfforts.map((effort) => (
                  <option key={effort} value={effort}>{effort}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={lowerEffort === "" || isRecovering}
              onClick={() => void applyLowerEffort()}
            >
              Lower {outputClassLabel(recoverable.sentPolicy.outputClass)} effort
            </button>
            <label>
              Higher {outputClassLabel(recoverable.sentPolicy.outputClass)} completion ceiling
              <input
                type="number"
                min={recoverable.sentPolicy.completionCeiling + 1}
                step="1"
                value={higherCeiling}
                disabled={isRecovering}
                onChange={(event) => setHigherCeiling(event.target.value)}
              />
            </label>
            <button type="button" disabled={isRecovering} onClick={() => void applyHigherCeiling()}>
              Raise {outputClassLabel(recoverable.sentPolicy.outputClass)} ceiling
            </button>
          </fieldset>
        </>
      ) : null}
      <details>
        <summary>Technical details</summary>
        <ul>
          {lines.slice(2).map((line) => <li key={line}>{line}</li>)}
        </ul>
      </details>
      <div className="buttonRow">
        <button type="button" onClick={() => void copyReceipt()}>Copy diagnostic receipt</button>
        {receipt.details.generationId ? (
          <a
            href={`https://openrouter.ai/activity?generation_id=${encodeURIComponent(receipt.details.generationId)}`}
            target="_blank"
            rel="noreferrer"
          >
            Open OpenRouter Logs
          </a>
        ) : null}
        {onClear ? <button type="button" onClick={onClear}>Clear diagnostic</button> : null}
      </div>
      {copyStatus === "copied" ? <p role="status">Copied diagnostic receipt.</p> : null}
      {copyStatus === "failed" ? <p role="status">Copy failed. Select the visible details manually.</p> : null}
      {recoveryStatus ? <p role="status">{recoveryStatus}</p> : null}
    </section>
  );
}

export function receiptLines(receipt: Receipt): string[] {
  const { details } = receipt;
  const lines = [
    `Classification: ${receipt.classification}`,
    `Summary: ${receipt.summary}`,
    `HTTP status: ${details.httpStatus}`,
    `Requested model: ${details.requestedModel}`,
    `Termination: ${details.termination}`,
    `Choice count: ${details.choiceCount}`,
    `Content shape: ${details.contentShape}`
  ];
  if (receipt.sentPolicy) {
    lines.push(`Output class: ${receipt.sentPolicy.outputClass}`);
    lines.push(`Completion ceiling: ${receipt.sentPolicy.completionCeiling}`);
    lines.push(`Reasoning enabled: ${receipt.sentPolicy.reasoningEnabled}`);
    lines.push(`Reasoning effort: ${receipt.sentPolicy.reasoningEffort}`);
    lines.push(`Reasoning content excluded: ${receipt.sentPolicy.reasoningExcluded}`);
    lines.push(`Supported lower efforts: ${receipt.sentPolicy.supportedLowerEfforts.join(", ") || "none"}`);
  }
  if (receipt.structuralReason) {
    lines.push(`Structural rule: ${receipt.structuralReason.code}`);
    if (receipt.structuralReason.slotNumber !== undefined) {
      lines.push(`Structural slot: ${receipt.structuralReason.slotNumber}`);
    }
    if (receipt.structuralReason.findingNumber !== undefined) {
      lines.push(`Structural finding: ${receipt.structuralReason.findingNumber}`);
    }
    lines.push(`Structural reason: ${receipt.structuralReason.message}`);
  }
  if (details.generationId) lines.push(`Generation ID: ${details.generationId}`);
  if (details.returnedModel) lines.push(`Returned model: ${details.returnedModel}`);
  if (details.provider) lines.push(`Provider: ${details.provider}`);
  if (details.nativeFinishReason) lines.push(`Native finish reason: ${details.nativeFinishReason}`);
  if (details.contentLength !== undefined) lines.push(`Content length: ${details.contentLength}`);
  if (details.structuralOutcome) lines.push(`Structural outcome: ${details.structuralOutcome}`);
  if (details.usage?.promptTokens !== undefined) lines.push(`Input tokens: ${details.usage.promptTokens}`);
  if (details.usage?.completionTokens !== undefined) lines.push(`Output tokens: ${details.usage.completionTokens}`);
  if (details.usage?.totalTokens !== undefined) lines.push(`Total tokens: ${details.usage.totalTokens}`);
  if (details.usage?.reasoningTokens !== undefined) lines.push(`Aggregate reasoning tokens: ${details.usage.reasoningTokens}`);
  if (details.retryAfter !== undefined) lines.push(`Retry after seconds: ${details.retryAfter}`);
  lines.push(`Recovery: ${receipt.recovery}`);
  return lines;
}

function outputClassLabel(outputClass: "prose" | "assistance"): "Prose" | "Assistance" {
  return outputClass === "prose" ? "Prose" : "Assistance";
}
