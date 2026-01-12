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
export const initialViews = new Set(
  hash ? hash.split(",").map(decodeURIComponent) : [],
);

/** Common init code used by several components */
export function initField(element) {
  const { schema } = element;

  // Show or hide the element based on the current view
  if (schema.view) {
    element.setAttribute("data-view", schema.view);
    element.hidden = !initialViews.has(schema.view);

    element.addEventListener("cms:invalid", () => {
      element.hidden = false;
    });
  }

  if (!schema.cssSelector) {
    return;
  }

  // Add a button to highlight the element in the page preview
  dom("button", {
    class: "buttonIcon field-dom-picker",
    type: "button",
    html: '<u-icon name="crosshair-simple"></u-icon>',
    async onclick() {
      const preview = document.querySelector("u-pagepreview");
      if (preview) {
        const exists = await preview.highlight(schema.cssSelector);
        if (!exists) {
          this.animate([
            { transform: "translate(-40px, -8px)", opacity: 1 },
            { transform: "translate(-50px, -8px)" },
            { transform: "translate(-40px, -8px)" },
            { transform: "translate(-50px, -8px)" },
            { transform: "translate(-40px, -8px)", opacity: 1 },
          ], {
            duration: 500,
          });
        }
      }
    },
  }, element);
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
    case "avif":
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

/** Return the current data fixing the local timezone */
export function getNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now;
}

export function updateField(field, schema, input) {
  input.labels[0].innerHTML = schema.label;
  field.querySelector(".field-description").innerHTML = schema.description ??
    "";
}

export function getFieldName(field) {
  const { namePrefix, schema } = field;
  if (namePrefix) {
    return `${namePrefix}.${schema.name}`;
  }
  return schema.name;
}

const allowedTypes = new Set([
  "text",
  "textarea",
  "rich-text",
  "email",
  "tel",
  "url",
  "date",
  "datetime",
  "time",
  "select",
]);

export function getItemLabel(field, value, defaultDescription) {
  const label = field.label || field.name;
  const firstField = field.fields?.find((field) =>
    allowedTypes.has(field.type)
  );

  if (!firstField) {
    if (defaultDescription !== undefined) {
      return `${label}: <em>${defaultDescription}</em>`;
    }
    return label;
  }

  let description = cleanHtml(
    (typeof value === "object" && value[firstField.name]) ||
      defaultDescription || "",
  );

  if (!description) {
    return label;
  }

  if (description.length > 50) {
    description = description.slice(0, 50) + "…";
  }

  return `${label}: <em>${description}</em>`;
}

const domParser = new DOMParser();
function cleanHtml(html) {
  return domParser.parseFromString(String(html), "text/html").body?.textContent
    ?.trim() || "";
}
