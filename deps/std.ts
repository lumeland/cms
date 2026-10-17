export { escape } from "deno-std/html/entities.js";
import { type ImplicitType, parse } from "jsr:@std/yaml@1.1.2/unstable-parse";
import { stringify } from "jsr:@std/yaml@1.1.2/unstable-stringify";
export { acceptsLanguages } from "deno-std/http/negotiation.js";
export { test as testFrontMatter } from "deno-std/front_matter/test.js";
export { extract as extractFrontMatter } from "deno-std/front_matter/yaml.js";
export { emptyDir, ensureDir, expandGlob } from "jsr:@std/fs@1.0.24";
export * as posix from "jsr:@std/path@1.1.6/posix";
export {
  basename,
  dirname,
  extname,
  fromFileUrl,
  globToRegExp,
  relative,
  SEPARATOR,
} from "deno-std/path/mod.js";
export { format as formatBytes } from "deno-std/fmt/bytes.js";
export { decodeBase64, encodeBase64 } from "deno-std/encoding/base64.js";
export { contentType } from "deno-std/media_types/content_type.js";

const YAML_DATE = /^\d{4}-\d{2}-\d{2}$/;
const YAML_DATETIME = /^\d{4}-\d{2}-\d{2}[Tt\s]\d{2}:\d{2}:\d{2}$/;

const date: ImplicitType = {
  tag: "tag:cms:date",
  kind: "scalar",
  resolve: (data): boolean => typeof data === "string" && YAML_DATE.test(data),
  construct: (data: string): Temporal.PlainDate =>
    Temporal.PlainDate.from(data),
  predicate: (data): data is Temporal.PlainDate =>
    data instanceof Temporal.PlainDate,
  represent: (data): string => data.toString(),
};

const datetime: ImplicitType = {
  tag: "tag:cms:datetime",
  kind: "scalar",
  resolve: (data): boolean =>
    typeof data === "string" && YAML_DATETIME.test(data),
  construct: (data: string): Temporal.PlainDateTime =>
    Temporal.PlainDateTime.from(data),
  predicate: (data): data is Temporal.PlainDateTime =>
    data instanceof Temporal.PlainDateTime,
  represent: (data): string => data.toString().replace("T", " "),
};

export function parseYaml(yaml: string) {
  return parse(yaml, {
    extraTypes: [date, datetime],
  });
}

export function stringifyYaml(yaml: Record<string, unknown>) {
  return stringify(yaml, {
    extraTypes: [date, datetime],
  });
}
