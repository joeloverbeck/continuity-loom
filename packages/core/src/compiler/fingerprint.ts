export function fingerprintPrompt(prompt: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < prompt.length; index += 1) {
    hash ^= prompt.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function estimatePromptTokens(prompt: string): number {
  return Math.max(1, Math.ceil(prompt.length / 4));
}
