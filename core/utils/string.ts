/** Convert slugs to labels */
export function labelify(slug: string) {
  if (slug === "[]") {
    return "";
  }

  // Remove extension
  slug = slug.replace(/\.([a-z]+)$/, "");

  // Capitalize
  slug = slug.replace(/^(.)/, (_, char) => char.toUpperCase());
  slug = slug.replaceAll(
    /([/.])(.)/g,
    (_, start, char) => `${start}${char.toUpperCase()}`,
  );

  // Format numbers
  slug = slug.replace(/^(\d+)\.(.)/, (_, number, char) => `${number}. ${char}`);
  slug = slug.replaceAll(
    /([\/])(\d+)\.(.)/g,
    (_, start, number, char) => `${start}${number}. ${char.toUpperCase()}`,
  );

  // Replace camelCase with spaces
  slug = slug.replaceAll(/([a-z])([A-Z])/g, "$1 $2");

  // Replace dashes with spaces
  slug = slug.replaceAll(/[-_]/g, " ");

  return slug;
}

/** Convert labels to slugs */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[<>:"\\|?*#]+/g, "-")
    .replace(/[\s-]+/g, "-");
}

/** Generate a short random ID */
export function generateId() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8);
}

/** Check if a value is empty */
export function isEmpty(value: unknown): value is Exclude<unknown, string> {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string" && value.trim() === "") {
    return true;
  }

  return false;
}
