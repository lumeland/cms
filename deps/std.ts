export { escape } from "jsr:@std/html@1.0.5/entities";
import { type ImplicitType, parse } from "jsr:@std/yaml@1.0.10/unstable-parse";
import { stringify } from "jsr:@std/yaml@1.0.10/unstable-stringify";

export { test as testFrontMatter } from "jsr:@std/front-matter@1.0.9";
export { extract as extractFrontMatter } from "jsr:@std/front-matter@1.0.9/yaml";
export { emptyDir, ensureDir, expandGlob } from "jsr:@std/fs@1.0.19";
export * as posix from "jsr:@std/path@1.1.2/posix";
export {
  basename,
  dirname,
  extname,
  fromFileUrl,
  globToRegExp,
  relative,
  SEPARATOR,
} from "jsr:@std/path@1.1.2";
export { format as formatBytes } from "jsr:@std/fmt@1.0.8/bytes";
export { decodeBase64, encodeBase64 } from "jsr:@std/encoding@1.0.10/base64";
export { contentType } from "jsr:@std/media-types@1.1.0/content-type";
export * as logger from "jsr:@std/log@0.224.14";

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

export function stringifyYaml(yaml: string) {
  return stringify(yaml, {
    extraTypes: [date, datetime],
  });
}
