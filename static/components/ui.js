import "./u-copy.js";
import "./u-draggable.js";
import "./u-filter.js";
import "./u-icon.js";
import "./u-modal.js";
import "./u-popover.js";
import "./u-preview.js";
import "./u-form.js";
import "./u-pagepreview.js";
import "./u-confirm.js";

if (!("anchorName" in document.documentElement.style)) {
  import("https://unpkg.com/@oddbird/css-anchor-positioning");
}
