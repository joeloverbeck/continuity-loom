export const SPLIT_CORE_INDEX_HEADING = "Linked acceptance-audit chunks:";
export const SPLIT_CORE_PREINDEX_LINE =
  "Linked acceptance-audit chunks: not indexed in this first-post core; this core claims only the disjoint rows in its supplied subset manifest.";
export const SPLIT_CORE_PREINDEX_INSPECTION =
  "shared core body inspected; linked audit chunk bodies do not exist in the pre-index state";
export const SPLIT_CORE_FINAL_INSPECTION =
  "shared core body and every linked audit chunk body inspected after URL capture";

const isConcreteHttpsUrl = (value) => /^https:\/\/\S+$/i.test(value);

const validateUrls = (urls) => {
  if (urls.length === 0) {
    throw new Error("final split-core state requires at least one linked audit chunk URL");
  }
  for (const url of urls) {
    if (!isConcreteHttpsUrl(url)) {
      throw new Error(`linked audit chunk URL must be a concrete HTTPS URL: ${url}`);
    }
  }
  if (new Set(urls).size !== urls.length) {
    throw new Error("linked audit chunk URLs must be unique");
  }
};

export const renderSplitCoreIndex = (mode, urls = []) => {
  if (mode === undefined) {
    if (urls.length > 0) throw new Error("linked audit chunk URLs require final split-core state");
    return "";
  }
  if (mode === "preindex") {
    if (urls.length > 0) {
      throw new Error("pre-index split-core state cannot include linked audit chunk URLs");
    }
    return SPLIT_CORE_PREINDEX_LINE;
  }
  if (mode === "final") {
    validateUrls(urls);
    return `${SPLIT_CORE_INDEX_HEADING}\n${urls.map((url) => `- ${url}`).join("\n")}`;
  }
  throw new Error("split-core mode must be preindex or final");
};

export const hasSplitCoreIndex = (body) => body
  .split(/\r?\n/)
  .some((line) => line.trim().startsWith(SPLIT_CORE_INDEX_HEADING));

export const validateSplitCoreIndex = (body, mode) => {
  const lines = body.split(/\r?\n/).map((line) => line.trim());
  const indexes = lines.flatMap((line, index) =>
    line.startsWith(SPLIT_CORE_INDEX_HEADING) ? [index] : []
  );
  if (indexes.length !== 1) {
    throw new Error(`split-core body requires exactly one ${SPLIT_CORE_INDEX_HEADING} field`);
  }

  const index = indexes[0];
  if (mode === "preindex") {
    if (lines[index] !== SPLIT_CORE_PREINDEX_LINE) {
      throw new Error("pre-index split-core body requires the exact truthful first-post index line");
    }
    return [];
  }
  if (mode !== "final") throw new Error("split-core mode must be preindex or final");
  if (lines[index] !== SPLIT_CORE_INDEX_HEADING) {
    throw new Error("final split-core body requires a URL list under the exact index heading");
  }

  const urls = [];
  for (let row = index + 1; row < lines.length && lines[row].startsWith("-"); row += 1) {
    const url = lines[row].match(/^-\s+(\S+)$/)?.[1];
    if (!url || !isConcreteHttpsUrl(url)) {
      throw new Error("final split-core index contains a non-HTTPS or malformed URL row");
    }
    urls.push(url);
  }
  if (urls.length === 0) {
    throw new Error("final split-core index requires at least one concrete HTTPS URL");
  }
  if (new Set(urls).size !== urls.length) {
    throw new Error("final split-core index URLs must be unique");
  }
  return urls;
};
