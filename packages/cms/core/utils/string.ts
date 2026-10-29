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
