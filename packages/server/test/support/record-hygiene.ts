export function decorateRecordHygieneContract(response: string): string {
  return response.split("\n").map((line) => {
    if (line === "HYGIENE REVIEW") {
      return "## **HYGIENE REVIEW**";
    }
    if (line === "END HYGIENE REVIEW") {
      return "> **END HYGIENE REVIEW**";
    }
    if (line.startsWith("FINDING ")) {
      return `> ### **${line}**`;
    }
    const separator = line.indexOf(":");
    if (separator > 0) {
      return `- **${line.slice(0, separator)}:** **${line.slice(separator + 1).trim()}**`;
    }
    return line;
  }).join("\n");
}
