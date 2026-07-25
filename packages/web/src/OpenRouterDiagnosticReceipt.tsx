import { useState } from "react";

import type { OpenRouterDiagnosticReceipt as Receipt } from "./openrouter-transport.js";

export function OpenRouterDiagnosticReceipt({
  receipt,
  onClear
}: {
  receipt: Receipt;
  onClear?: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const lines = receiptLines(receipt);

  async function copyReceipt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section className="status statusError openRouterDiagnostic" role="alert" aria-label="OpenRouter diagnostic">
      <p><strong>{receipt.summary}</strong></p>
      <p>{receipt.recovery}</p>
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
  if (details.generationId) lines.push(`Generation ID: ${details.generationId}`);
  if (details.returnedModel) lines.push(`Returned model: ${details.returnedModel}`);
  if (details.provider) lines.push(`Provider: ${details.provider}`);
  if (details.nativeFinishReason) lines.push(`Native finish reason: ${details.nativeFinishReason}`);
  if (details.contentLength !== undefined) lines.push(`Content length: ${details.contentLength}`);
  if (details.structuralOutcome) lines.push(`Structural outcome: ${details.structuralOutcome}`);
  if (details.usage?.promptTokens !== undefined) lines.push(`Input tokens: ${details.usage.promptTokens}`);
  if (details.usage?.completionTokens !== undefined) lines.push(`Output tokens: ${details.usage.completionTokens}`);
  if (details.usage?.totalTokens !== undefined) lines.push(`Total tokens: ${details.usage.totalTokens}`);
  if (details.retryAfter !== undefined) lines.push(`Retry after seconds: ${details.retryAfter}`);
  lines.push(`Recovery: ${receipt.recovery}`);
  return lines;
}
