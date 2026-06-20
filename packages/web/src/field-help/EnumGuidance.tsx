import {
  getFieldGuidance,
  normalizeListIndices,
  type EnumValueGuidance
} from "@loom/core";
import { useId } from "react";

export interface EnumGuidanceProps {
  fieldPath: string;
  enumValues: readonly string[];
  value: string;
  onChange: (value: string) => void;
  allowUnset?: boolean;
}

const cardEnumPaths = new Set([
  "STORY CONTRACT.content_intensity",
  "PROSE MODE.psychic_distance",
  "PROSE MODE.interiority_mode",
  "PROSE MODE.dialogue_density",
  "SECRET.reveal_permission",
  "CAST MEMBER.sample_utterances[].copy_policy",
  "GENERATION BRIEF.active_working_set.active_onstage_cast_full[].local_function"
]);

export function EnumGuidance({
  fieldPath,
  enumValues,
  value,
  onChange,
  allowUnset = false
}: EnumGuidanceProps): React.JSX.Element {
  const radioGroupName = useId();
  const canonicalPath = normalizeListIndices(fieldPath);
  const guidance = getFieldGuidance(canonicalPath);
  const valueGuidance = guidance?.enumValues;
  const selectedGuidance = valueGuidance?.[value];

  if (cardEnumPaths.has(canonicalPath) && valueGuidance) {
    return (
      <div className="enumGuidance">
        <div className="enumCardGroup" role="radiogroup" aria-label={`${fieldPath} values`}>
          {enumValues.map((option) => (
            <label className="enumCard" key={option}>
              <input
                type="radio"
                name={radioGroupName}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span className="enumCardText">
                <strong>{option}</strong>
                <small>{valueGuidance[option]?.short ?? "No value guidance."}</small>
              </span>
            </label>
          ))}
        </div>
        <SelectedEnumValue value={value} guidance={selectedGuidance} />
      </div>
    );
  }

  return (
    <div className="enumGuidance">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {allowUnset ? <option value="">Unset</option> : null}
        {enumValues.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <SelectedEnumValue value={value} guidance={selectedGuidance} />
    </div>
  );
}

function SelectedEnumValue({
  value,
  guidance
}: {
  value: string;
  guidance: EnumValueGuidance | undefined;
}): React.JSX.Element | null {
  if (!value || !guidance) {
    return null;
  }

  return (
    <p className="enumSelectedValue">
      <strong>{value}</strong>: {guidance.short}
    </p>
  );
}
