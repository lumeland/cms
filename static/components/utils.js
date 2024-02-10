/** Create and append a DOM element to another */
export function push(el, tag, attrs, ...children) {
  const child = dom(tag, attrs, ...children);
  el.append(child);
  return child;
}

/** Push options to an element like select or datalist */
export function pushOptions(el, options) {
  for (const option of options) {
    if (typeof option === "string") {
      push(el, "option", null, option);
    } else {
      const { label, ...attrs } = option;
      push(el, "option", attrs, label);
    }
  }
}

const props = new Set(["namePrefix", "value", "schema"]);

/** Create a new DOM element */
export function dom(tag, attrs, ...children) {
  const el = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (k.startsWith("on")) {
      el.addEventListener(k.slice(2), v);
      continue;
    }

    if (props.has(k)) {
      el[k] = v ?? null;
      continue;
    }

    if (k === "data") {
      for (const [name, value] of Object.entries(v)) {
        el.dataset[name] = value;
      }
      continue;
    }

    if (v !== undefined) {
      if (v === false && k !== "draggable") {
        continue;
      }
      if (v === true && k !== "draggable") {
        el.setAttribute(k, "");
        continue;
      }
      el.setAttribute(k, v);
    }
  }

  for (const child of children) {
    if (child === null || child === undefined) {
      continue;
    }

    if (typeof child === "string") {
      if (child.startsWith("<")) {
        el.append(
          ...new DOMParser().parseFromString(child, "text/html").body
            .childNodes,
        );
        continue;
      }
      el.append(document.createTextNode(child));
    } else {
      el.append(child);
    }
  }
  return el;
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
    baseassets === "/" ? "" : baseassets,
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
  // Capitalize first letter
  slug = slug[0].toUpperCase() + slug.slice(1);

  // Replace dashes with spaces
  slug = slug.replace(/[-_]/g, " ");

  // Replace camelCase with spaces
  slug = slug.replace(/([a-z])([A-Z])/g, "$1 $2");

  return slug;
}
