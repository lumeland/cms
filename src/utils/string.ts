import { extname } from "std/path/extname.ts";

/** Convert slugs to labels */
export function labelify(slug: string) {
  // Remove extension
  const ext = extname(slug);
  if (ext) {
    slug = slug.slice(0, -ext.length);
  }

  // Capitalize first letter
  slug = slug[0].toUpperCase() + slug.slice(1);

  // Replace dashes with spaces
  slug = slug.replace(/[-_]/g, " ");

  // Replace camelCase with spaces
  slug = slug.replace(/([a-z])([A-Z])/g, "$1 $2");

  return slug;
}

/** Convert labels to slugs */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function getUrl(...parts: string[]) {
  return "/" + parts
    .filter((part) => typeof part === "string")
    .map((part) => encodeURIComponent(part))
    .join("/");
}
