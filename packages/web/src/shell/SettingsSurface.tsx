import { useEffect, useId, useState } from "react";

import {
  type ApiFailure,
  getOpenRouterSettings,
  putOpenRouterSettings,
  refreshModels,
  type OpenRouterModelListEntry,
  type OpenRouterSettingsPatch,
  type OpenRouterSettingsResponse
} from "../api.js";
import { presentOpenRouterFailure, presentThrownOpenRouterFailure } from "../openrouter-failure.js";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; settings: OpenRouterSettingsResponse }
  | { status: "error"; message: string };

interface SettingsFormState {
  model: string;
  temperatureMode: "explicit" | "provider_default";
  temperature: string;
  proseMaxOutputTokens: string;
  assistanceMaxOutputTokens: string;
  topP: string;
  cachedModels: OpenRouterModelListEntry[];
}

export function SettingsSurface(): React.JSX.Element {
  const modelSelectId = useId();
  const proseCeilingId = useId();
  const proseCeilingDescriptionId = useId();
  const assistanceCeilingId = useId();
  const assistanceCeilingDescriptionId = useId();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [form, setForm] = useState<SettingsFormState>({
    model: "",
    temperatureMode: "explicit",
    temperature: "1",
    proseMaxOutputTokens: "1024",
    assistanceMaxOutputTokens: "4096",
    topP: "",
    cachedModels: []
  });
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    getOpenRouterSettings()
      .then((settings) => {
        if (!isCurrent) {
          return;
        }

        setLoadState({ status: "ready", settings });
        setForm(toForm(settings));
      })
      .catch(() => {
        if (isCurrent) {
          setLoadState({ status: "error", message: "Settings could not be loaded." });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function saveSettings(): Promise<void> {
    setIsSaving(true);
    setSaveNotice(null);

    try {
      const result = await putOpenRouterSettings(toPatch(form));
      if (isApiFailure(result)) {
        setSaveNotice(result.message);
        return;
      }

      setLoadState({ status: "ready", settings: result });
      setForm(toForm(result));
      setSaveNotice("Settings saved.");
    } catch {
      setSaveNotice("Settings could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function refreshModelList(): Promise<void> {
    setIsRefreshing(true);
    setRefreshNotice(null);

    try {
      const result = await refreshModels();
      if (!result.ok) {
        setRefreshNotice(presentOpenRouterFailure(result));
        return;
      }

      setForm((current) => ({ ...current, cachedModels: result.models }));
      setRefreshNotice("Model list refreshed.");
    } catch (error) {
      setRefreshNotice(presentThrownOpenRouterFailure(error, "Model list could not be refreshed."));
    } finally {
      setIsRefreshing(false);
    }
  }

  const isReady = loadState.status === "ready";

  return (
    <section className="surface" aria-labelledby="settings-title">
      <div className="projectHeader">
        <p className="eyebrow">Local settings</p>
        <h2 id="settings-title">Settings</h2>
      </div>

      {loadState.status === "loading" ? <p className="muted">Loading settings...</p> : null}
      {loadState.status === "error" ? (
        <p role="alert" className="status statusError">
          {loadState.message}
        </p>
      ) : null}

      {isReady ? (
        <div className="settingsLayout">
          <dl className="runtimeGrid" aria-label="Settings status">
            <div>
              <dt>OpenRouter key</dt>
              <dd>{loadState.settings.hasOpenRouterCredential ? "API key configured" : "API key missing"}</dd>
            </div>
          </dl>

          <form
            className="settingsForm"
            onSubmit={(event) => {
              event.preventDefault();
              void saveSettings();
            }}
          >
            <label>
              Model ID
              <input
                value={form.model}
                onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
                placeholder="provider/model"
              />
            </label>

            <label htmlFor={modelSelectId}>
              Model list
              <select
                id={modelSelectId}
                value=""
                onChange={(event) => {
                  if (event.target.value) {
                    setForm((current) => ({ ...current, model: event.target.value }));
                  }
                }}
              >
                <option value="">Manual entry</option>
                {form.cachedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend>Temperature mode</legend>
              <label>
                <input
                  type="radio"
                  name="temperature-mode"
                  value="explicit"
                  checked={form.temperatureMode === "explicit"}
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      temperatureMode: "explicit",
                      temperature: current.temperature || "1"
                    }))
                  }
                />
                Explicit value
              </label>
              <label>
                <input
                  type="radio"
                  name="temperature-mode"
                  value="provider_default"
                  checked={form.temperatureMode === "provider_default"}
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      temperatureMode: "provider_default",
                      temperature: ""
                    }))
                  }
                />
                Provider default
              </label>
              {form.temperatureMode === "provider_default" ? (
                <p className="muted">
                  Provider default omits Temperature and cannot know the provider's effective numeric value.
                </p>
              ) : null}
            </fieldset>

            <div className="settingsNumberGrid">
              <label>
                Temperature
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  disabled={form.temperatureMode === "provider_default"}
                  required={form.temperatureMode === "explicit"}
                  value={form.temperature}
                  onChange={(event) => setForm((current) => ({ ...current, temperature: event.target.value }))}
                />
              </label>

              <div>
                <label htmlFor={proseCeilingId}>Prose ceiling</label>
                <input
                  id={proseCeilingId}
                  type="number"
                  min="1"
                  step="1"
                  required
                  aria-describedby={proseCeilingDescriptionId}
                  value={form.proseMaxOutputTokens}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, proseMaxOutputTokens: event.target.value }))
                  }
                />
                <p id={proseCeilingDescriptionId} className="muted">
                  Upper bound for Generate prose. It is not a target or a guarantee of output length.
                </p>
              </div>

              <div>
                <label htmlFor={assistanceCeilingId}>Assistance ceiling</label>
                <input
                  id={assistanceCeilingId}
                  type="number"
                  min="1"
                  step="1"
                  required
                  aria-describedby={assistanceCeilingDescriptionId}
                  value={form.assistanceMaxOutputTokens}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, assistanceMaxOutputTokens: event.target.value }))
                  }
                />
                <p id={assistanceCeilingDescriptionId} className="muted">
                  Upper bound for Ideate, Record Hygiene, Cast Possibilities, and Change Review. 4096 is a starting
                  allowance, not a guarantee of complete structured output.
                </p>
              </div>

              <label>
                Top P
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={form.topP}
                  onChange={(event) => setForm((current) => ({ ...current, topP: event.target.value }))}
                />
              </label>
            </div>

            <div className="settingsActions">
              <button type="submit" disabled={isSaving}>
                Save settings
              </button>
              <button type="button" onClick={() => void refreshModelList()} disabled={isRefreshing}>
                Refresh model list
              </button>
            </div>
          </form>

          {saveNotice ? <p className="status statusSuccess">{saveNotice}</p> : null}
          {refreshNotice ? <p role="alert" className="status statusWarning">{refreshNotice}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function toForm(settings: OpenRouterSettingsResponse): SettingsFormState {
  return {
    model: settings.model,
    temperatureMode: settings.temperatureMode,
    temperature: settings.temperature === undefined ? "" : String(settings.temperature),
    proseMaxOutputTokens: String(settings.proseMaxOutputTokens),
    assistanceMaxOutputTokens: String(settings.assistanceMaxOutputTokens),
    topP: settings.topP === undefined ? "" : String(settings.topP),
    cachedModels: settings.cachedModels ?? []
  };
}

function toPatch(form: SettingsFormState): OpenRouterSettingsPatch {
  return {
    model: form.model,
    temperatureMode: form.temperatureMode,
    ...(form.temperatureMode === "explicit" ? { temperature: Number(form.temperature) } : {}),
    proseMaxOutputTokens: Number(form.proseMaxOutputTokens),
    assistanceMaxOutputTokens: Number(form.assistanceMaxOutputTokens),
    topP: form.topP.trim() ? Number(form.topP) : null,
    cachedModels: form.cachedModels
  };
}

function isApiFailure(value: OpenRouterSettingsResponse | ApiFailure): value is ApiFailure {
  return "ok" in value && value.ok === false;
}
