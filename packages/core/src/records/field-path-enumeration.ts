import type { FieldDescriptor } from "./editor-descriptors.js";
import { buildFieldPath, type FieldPathSegment } from "./field-paths.js";

export function enumerateCanonicalPaths(
  ownerKind: string,
  fields: readonly FieldDescriptor[]
): readonly string[] {
  return fields.flatMap((field) => enumerateField(ownerKind, [], field));
}

function enumerateField(
  ownerKind: string,
  parentSegments: readonly FieldPathSegment[],
  field: FieldDescriptor
): readonly string[] {
  if (field.kind === "nested_group") {
    const segments = [...parentSegments, { name: field.name }];

    return (field.fields ?? []).flatMap((child) => enumerateField(ownerKind, segments, child));
  }

  if (field.kind === "list") {
    const segments = [...parentSegments, { name: field.name, list: true }];

    if (field.itemDescriptor?.fields) {
      return field.itemDescriptor.fields.flatMap((child) => enumerateField(ownerKind, segments, child));
    }

    return [buildFieldPath(ownerKind, segments)];
  }

  return [buildFieldPath(ownerKind, [...parentSegments, { name: field.name }])];
}
