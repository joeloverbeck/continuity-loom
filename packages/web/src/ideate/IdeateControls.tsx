import {
  IDEATION_FOCUS_MAX_CODE_POINTS,
  ideationFocusState,
  type IdeationRequest
} from "@loom/core";
import { useId } from "react";

export interface IdeateControlsProps {
  request: IdeationRequest;
  canIdeate: boolean;
  hasSlate: boolean;
  isSending: boolean;
  onRequestChange: (request: IdeationRequest) => void;
  onGenerate: () => void;
  onRegenerateAll: () => void;
  onClearAll: () => void;
}

export function IdeateControls({
  request,
  canIdeate,
  hasSlate,
  isSending,
  onRequestChange,
  onGenerate,
  onRegenerateAll,
  onClearAll
}: IdeateControlsProps): React.JSX.Element {
  const focusState = ideationFocusState(request.focus);
  const nonFocusControlsDisabled = isSending || Boolean(focusState.error);
  const disabled = !canIdeate || nonFocusControlsDisabled;
  const focusId = useId();
  const helpId = `${focusId}-help`;
  const countId = `${focusId}-count`;
  const errorId = `${focusId}-error`;
  const describedBy = [helpId, countId, ...(focusState.error ? [errorId] : [])].join(" ");

  return (
    <section className="ideateControls" aria-label="Ideation controls">
      <div className="ideateFocusField">
        <label htmlFor={focusId}>What do you need ideas or questions about?</label>
        <p className="muted" id={helpId}>
          Author focus is temporary, non-canonical request context. It steers treatment inside already assigned
          response slots; it does not choose response kinds or operators, change their grounding, change the active
          working set, or change story records. Typing here creates neither canon nor story prose.
        </p>
        <textarea
          id={focusId}
          rows={3}
          value={request.focus}
          aria-describedby={describedBy}
          aria-invalid={Boolean(focusState.error)}
          aria-errormessage={focusState.error ? errorId : undefined}
          onChange={(event) => onRequestChange({ ...request, focus: event.target.value })}
        />
        <span className="ideateFocusCount" id={countId} aria-live="polite">
          {focusState.codePointCount} / {IDEATION_FOCUS_MAX_CODE_POINTS}
        </span>
        {focusState.error ? (
          <p className="status statusError ideateFocusError" id={errorId} role="alert">
            {focusState.error}
          </p>
        ) : null}
      </div>
      <div className="segmentedControl" aria-label="Ideation mode">
        <button
          type="button"
          className={request.mode === "ideas" ? "segmentedControl-active" : "secondaryButton"}
          disabled={nonFocusControlsDisabled}
          onClick={() => onRequestChange({ ...request, mode: "ideas", avoidList: [] })}
        >
          Ideas
        </button>
        <button
          type="button"
          className={request.mode === "questions" ? "segmentedControl-active" : "secondaryButton"}
          disabled={nonFocusControlsDisabled}
          onClick={() => onRequestChange({ ...request, mode: "questions", avoidList: [] })}
        >
          Questions
        </button>
      </div>
      <label className="controlField">
        Count
        <select
          value={request.count}
          disabled={nonFocusControlsDisabled}
          onChange={(event) => onRequestChange({ ...request, count: Number(event.target.value), avoidList: [] })}
        >
          {[3, 4, 5, 6].map((count) => (
            <option value={count} key={count}>{count}</option>
          ))}
        </select>
      </label>
      <label className="checkboxField">
        <input
          type="checkbox"
          checked={request.dormantSlot}
          disabled={nonFocusControlsDisabled}
          onChange={(event) => onRequestChange({ ...request, dormantSlot: event.target.checked, avoidList: [] })}
        />
        Dormant slot
      </label>
      <div className="ideateControlActions">
        <button type="button" onClick={onGenerate} disabled={disabled}>{hasSlate ? "Get new slate" : "Get ideas"}</button>
        <button type="button" className="secondaryButton" onClick={onRegenerateAll} disabled={disabled || !hasSlate}>
          Regenerate all
        </button>
        <button
          type="button"
          className="secondaryButton"
          onClick={onClearAll}
          disabled={Boolean(focusState.error) || (!hasSlate && !isSending)}
        >
          Clear all
        </button>
      </div>
    </section>
  );
}
