// Grounds arrive as compiled citation keys wrapped in brackets (`[SECRET-1]`). Every Ideate
// surface displays the bare key, so it reads identically to the key the model names inside its own
// `why` prose ("...where SECRET-1 edges toward surfacing..."). Presentation only: the bracketed
// form remains the value carried in `grounds`, `unknownCitations`, and keeper payloads.

export function citationKeyText(citation: string): string {
  return citation.replace(/^\[/, "").replace(/\]$/, "");
}
