import "./u-fields.js";
import "./u-copy.js";
import "./u-draggable.js";
import "./u-filter.js";
import "./u-icon.js";
import "./u-modal.js";
import "./u-popover.js";
import "./u-preview.js";
import "./u-views.js";
import "./u-form.js";
import "./u-form-join.js";
import "./u-form-restart.js";
import "./u-pagepreview.js";
import "./u-confirm.js";
import "./u-upload.js";
import "./u-cropper.js";
import "./u-tree.js";
import "./navigation.js";
import { url } from "./utils.js";

globalThis.$ui = {
  toggleTheme() {
    if (localStorage.getItem(darkLightModeStorageKey) == "dark") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem(darkLightModeStorageKey);
      dispatchEvent(
        new CustomEvent("themeChange", {
          detail: { theme: "light" },
        }),
      );
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem(darkLightModeStorageKey, "dark");
      dispatchEvent(
        new CustomEvent("themeChange", {
          detail: { theme: "dark" },
        }),
      );
    }
  },
  togglePreview() {
    const preview = document.querySelector("u-pagepreview");
    if (preview) {
      preview.closed = !preview.closed
    }
  },
  logout() {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", url("auth", "logout"), true, "logout");
    xmlHttp.send();
    document.body.innerHTML =
      '<p class="emptyState is-fullscreen">Logged out.</p>';
  },
};
