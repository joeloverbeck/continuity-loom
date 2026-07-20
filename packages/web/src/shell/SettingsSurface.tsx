import { useEffect, useId, useState } from "react";

import {
  type ApiFailure,
  getOpenRouterSettings,
  putOpenRouterSettings,
  refreshModels,
  type OpenRouterModelListEntry,
  type OpenRouterSettings,
  type OpenRouterSettingsResponse
} from "../api.js";
import { presentOpenRouterFailure, presentThrownOpenRouterFailure } from "../openrouter-failure.js";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; settings: OpenRouterSettingsResponse }
  | { status: "error"; message: string };

interface SettingsFormState {
  model: string;
  temperature: string;
  maxOutputTokens: string;
  topP: string;
  cachedModels: OpenRouterModelListEntry[];
}

export function SettingsSurface(): React.JSX.Element {
  const modelSelectId = useId();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [form, setForm] = useState<SettingsFormState>({
    model: "",
    temperature: "1",
    maxOutputTokens: "1024",
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

            <div className="settingsNumberGrid">
              <label>
                Temperature
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(event) => setForm((current) => ({ ...current, temperature: event.target.value }))}
                />
              </label>

              <label>
                Max output tokens
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxOutputTokens}
                  onChange={(event) => setForm((current) => ({ ...current, maxOutputTokens: event.target.value }))}
                />
              </label>

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
    temperature: String(settings.temperature),
    maxOutputTokens: String(settings.maxOutputTokens),
    topP: settings.topP === undefined ? "" : String(settings.topP),
    cachedModels: settings.cachedModels ?? []
  };
}

function toPatch(form: SettingsFormState): OpenRouterSettings {
  return {
    model: form.model,
    temperature: Number(form.temperature),
    maxOutputTokens: Number(form.maxOutputTokens),
    ...(form.topP.trim() ? { topP: Number(form.topP) } : {}),
    cachedModels: form.cachedModels
  };
}

function isApiFailure(value: OpenRouterSettingsResponse | ApiFailure): value is ApiFailure {
  return "ok" in value && value.ok === false;
}
