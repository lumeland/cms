import { isEmpty } from "../core/utils/string.ts";
import type { Data, Field, InputField, Option } from "../types.ts";

export function applySelectChanges<
  T extends InputField & { options: Option[] },
>(
  data: Data,
  changes: Data,
  field: T,
) {
  if (!(field.name in changes)) {
    return;
  }
  const value = getSelectValue(field.options, changes[field.name]);

  if (value !== undefined) {
    data[field.name] = transform(field, value);
    return;
  }

  delete data[field.name];
}

export function compareOptions(a: Option, b: Option): number {
  return typeof a === "object"
    ? a.label.localeCompare(
      typeof b === "object" ? b.label.toString() : b.toString(),
    )
    : a.toString().localeCompare(
      typeof b === "object" ? b.label.toString() : b.toString(),
    );
}

export function getSelectValue(
  options: Option[],
  value: unknown,
): unknown | undefined {
  if (isEmpty(value)) {
    return;
  }

  for (const option of options) {
    if (typeof option === "object") {
      if (option.value == value) {
        return option.value;
      }
      continue;
    }
    if (option == value) {
      return option;
    }
  }
}

export function applyTextChanges<T extends InputField>(
  data: Data,
  changes: Data,
  field: T,
) {
  if (!(field.name in changes)) {
    return;
  }

  const value = changes[field.name];

  if (typeof value === "string" && value.trim().length > 0) {
    data[field.name] = transform(field, value.replaceAll("\r\n", "\n"));
    return;
  }

  if (field.attributes?.required) {
    data[field.name] = "";
    return;
  }

  delete data[field.name];
}

export function transform<V, T extends Field = Field>(
  field: T,
  value?: V | null,
): V | undefined | null {
  const transform = field.transform;
  return transform ? transform(value) : value;
}

// Matches content we want to ignore when searching for paths
const skipPattern = [
  /```[\s\S]*?```/.source,                // MD Block
  /`[^`]*`/.source,                       // MD Inline
  /<pre\b[^>]*>[\s\S]*?<\/pre>/.source,   // HTML <pre>
  /<code\b[^>]*>[\s\S]*?<\/code>/.source, // HTML <code>
  /<script\b[^>]*>[\s\S]*?<\/script>/.source, // HTML <script>
  /[a-z]+:\/\/[^\s"'\)]+/.source, // Full URLs
].join('|');

// Matches content we want to detect as paths.
// Requires dot-slash (./ or ../) OR slash (/), and must end with .extension
const targetPattern = /(?:(?:\.{1,2}\/)|(?:\/))[^"'\)\s\]]+\.[a-zA-Z0-9]+/.source;

// Combined RegExp
const combinedPattern = new RegExp(`(${skipPattern})|(${targetPattern})`, 'gi');

/**
 * Core function to traverse text and replace paths while respecting code blocks.
 */
function replacePaths(text: string, transformFn: (path: string) => string | undefined): string {
  return text.replace(combinedPattern, (match, skippedContent, foundPath) => {
    // We matched a protected block (Shield): return as is.
    if (skippedContent) {
      return skippedContent;
    }

    // We matched a path (Target): transform it.
    if (foundPath) {
      // If transformFn returns null/undefined, keep original match
      return transformFn(foundPath) ?? match;
    }

    return match;
  });
}

/**
 * Convert _relative_ paths (./xxx) to _absolute_ paths using the transformFn.
 * Ignores paths that are already absolute (start with /).
 */
export function toAbsolutePaths(text: string, transformFn: (relativePath: string) => string | undefined): string {
  return replacePaths(text, (path) => {
    if (path.startsWith('/')) return path; // Already absolute
    return transformFn(path);
  });
}

/**
 * Convert _absolute_ paths (/xxx) to _relative_ paths using the transformFn.
 * Ignores paths that are already relative (start with .).
 */
export function toRelativePaths(text: string, transformFn: (absPath: string) => string | undefined): string {
  return replacePaths(text, (path) => {
    if (path.startsWith('.')) return path; // Already relative
    return transformFn(path);
  });
}
