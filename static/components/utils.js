import dom from "dom";

/** Push options to an element like select or datalist */
export function pushOptions(el, options) {
  for (const option of options) {
    if (typeof option === "string") {
      dom("option", { html: option }, el);
    } else {
      const { label, ...attrs } = option;
      dom("option", { ...attrs, html: label }, el);
    }
  }
}

/** Show or hide an element based on the current view */
const hash = location.hash.slice(1);
export const initialViews = new Set(hash ? hash.split(",") : []);
export function view(element) {
  const { schema } = element;

  if (schema.view) {
    element.setAttribute("data-view", schema.view);
    element.hidden = !initialViews.has(schema.view);

    element.addEventListener("cms:invalid", () => {
      element.hidden = false;
    });
  }
}

/** Dispatch a bubbled event on error */
export function oninvalid(event) {
  const input = event.target;
  input.dispatchEvent(
    new CustomEvent("cms:invalid", {
      bubbles: true,
      cancelable: false,
      detail: { input },
    }),
  );
}

const { baseassets, baseurls } = document.documentElement.dataset;

export function url(...parts) {
  return [
    baseurls === "/" ? "" : baseurls,
    ...parts
      .filter((part) => part && typeof part === "string")
      .map((part) => encodeURIComponent(part)),
  ].join("/");
}

export function asset(...parts) {
  return [
    baseassets === "/" ? location.origin : baseassets,
    ...parts
      .filter((part) => part && typeof part === "string")
      .map((part) => encodeURIComponent(part)),
  ].join("/");
}

export function fileType(path) {
  const extension = path.split(".").pop().toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "svg":
    case "gif":
    case "webp":
    case "ico":
      return "image";

    case "mp4":
    case "webm":
    case "mov":
    case "mkv":
    case "ogv":
    case "avi":
      return "video";

    case "mp3":
    case "wav":
    case "aif":
    case "ogg":
    case "aiff":
      return "audio";

    case "pdf":
      return "pdf";
  }
}

export function randomId() {
  return `id_${Math.random().toString(36).slice(2)}`;
}

/** Convert slugs to labels */
export function labelify(slug) {
  if (!slug || slug === "[]") { // Special case for array fields
    return "";
  }

  // Capitalize first letter
  slug = slug[0].toUpperCase() + slug.slice(1);

  // Replace dashes with spaces
  slug = slug.replace(/[-_]/g, " ");

  // Replace camelCase with spaces
  slug = slug.replace(/([a-z])([A-Z])/g, "$1 $2");

  return slug;
}

const optionsKey = "lumecms_options";
const initVal = localStorage.getItem(optionsKey);
const currOptions = initVal ? JSON.parse(initVal) : {};

export const options = {
  get: (key) => currOptions[key],
  set: (key, value) => {
    currOptions[key] = value;
    localStorage.setItem(optionsKey, JSON.stringify(currOptions));
  },
};

/** Convert a Date to local timezone */
export function toLocal(date) {
  const offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offset);
  return date;
}
