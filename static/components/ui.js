import "./u-copy.js";
import "./u-draggable.js";
import "./u-filter.js";
import "./u-icon.js";
import "./u-modal.js";
import "./u-popover.js";
import "./u-preview.js";

document.querySelectorAll("[data-confirm]").forEach((element) => {
  element.addEventListener("click", (event) => {
    if (!confirm(element.dataset.confirm)) {
      event.preventDefault();
    }
  });
});
