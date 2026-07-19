// Shared CAST MEMBER browse-identity presentation contract.
//
// A CAST MEMBER dossier links to the durable ENTITY that owns character identity.
// Record-presentation surfaces (the Records browser and the Active Working Set)
// lead a CAST MEMBER with the linked ENTITY's browse identity and keep the
// dossier one-line as secondary context, falling back explicitly when the link
// is archived or unresolved. This is presentation metadata only: it never
// becomes prompt authority, and it never substitutes a raw record id.

import type { BrowseIdentity } from "../api.js";

export interface BrowseIdentityRecord {
  type: string;
  displayLabel: string;
  browseIdentity?: BrowseIdentity;
}

export function browsePrimaryLabel(record: BrowseIdentityRecord): string {
  if (record.type !== "CAST MEMBER" || !record.browseIdentity) {
    return record.displayLabel;
  }

  if (record.browseIdentity.availability === "archived") {
    return record.browseIdentity.primaryLabel
      ? `${record.browseIdentity.primaryLabel} (linked ENTITY archived)`
      : "Linked ENTITY unavailable (archived)";
  }

  if (record.browseIdentity.availability === "missing" || !record.browseIdentity.primaryLabel) {
    return "Linked ENTITY unavailable";
  }

  return record.browseIdentity.primaryLabel;
}

export function browseSecondaryLabel(record: BrowseIdentityRecord): string {
  return record.type === "CAST MEMBER" ? record.browseIdentity?.secondaryLabel ?? "" : "";
}

export function browseUnavailableMessage(record: BrowseIdentityRecord): string | null {
  if (record.type !== "CAST MEMBER" || !record.browseIdentity) {
    return null;
  }

  if (record.browseIdentity.availability === "archived") {
    return "The linked ENTITY is archived and unavailable for active use.";
  }

  if (record.browseIdentity.availability === "missing") {
    return "The linked ENTITY could not be resolved. The CAST MEMBER record and its exact payload remain available.";
  }

  return null;
}
