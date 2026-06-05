export interface Settings {
  openRouterModel: string;
  hasOpenRouterCredential: boolean;
}

export function getSettings(): Settings {
  return {
    openRouterModel: "unset",
    hasOpenRouterCredential: false
  };
}
