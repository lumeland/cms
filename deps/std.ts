import "temporal-polyfill/global";

export { escape } from "deno-std/html/entities.js";
import { type ImplicitType, parse } from "deno-std/yaml/unstable_parse.js";
import { stringify } from "deno-std/yaml/unstable_stringify.js";
export { acceptsLanguages } from "deno-std/http/negotiation.js";
export { test as testFrontMatter } from "deno-std/front_matter/test.js";
export { extract as extractFrontMatter } from "deno-std/front_matter/yaml.js";
export * as posix from "deno-std/path/posix/mod.js";
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
