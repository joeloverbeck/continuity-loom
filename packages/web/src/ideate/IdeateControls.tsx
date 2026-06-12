import type { IdeationRequest } from "@loom/core";

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
  const disabled = !canIdeate || isSending;

  return (
    <section className="ideateControls" aria-label="Ideation controls">
      <div className="segmentedControl" aria-label="Ideation mode">
        <button
          type="button"
          className={request.mode === "ideas" ? "segmentedControl-active" : "secondaryButton"}
          onClick={() => onRequestChange({ ...request, mode: "ideas", avoidList: [] })}
        >
          Ideas
        </button>
        <button
          type="button"
          className={request.mode === "questions" ? "segmentedControl-active" : "secondaryButton"}
          onClick={() => onRequestChange({ ...request, mode: "questions", avoidList: [] })}
        >
          Questions
        </button>
      </div>
      <label className="controlField">
        Count
        <select
          value={request.count}
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
          onChange={(event) => onRequestChange({ ...request, dormantSlot: event.target.checked, avoidList: [] })}
        />
        Dormant slot
      </label>
      <div className="ideateControlActions">
        <button type="button" onClick={onGenerate} disabled={disabled}>{hasSlate ? "Get new slate" : "Get ideas"}</button>
        <button type="button" className="secondaryButton" onClick={onRegenerateAll} disabled={disabled || !hasSlate}>
          Regenerate all
        </button>
        <button type="button" className="secondaryButton" onClick={onClearAll} disabled={!hasSlate && !isSending}>
          Clear all
        </button>
      </div>
    </section>
  );
}
