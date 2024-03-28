import { push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-form",
  class Form extends Component {
    init() {
      const form = this.querySelector("form");

      // Capture Ctrl+S / Cmd+S to submit the form
      form.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          form.requestSubmit();
        }
      });

      form.addEventListener("submit", (e) => {
        if (e.submitter && e.submitter.formAction !== form.action) {
          return;
        }

        e.preventDefault();

        const tooltip = push(this, "div", {
          role: "tooltip",
          class: "is-toast",
        }, "Saving...");

        setTimeout(async () => {
          await this.sendForm(form);
          tooltip.innerText = "Saved";
          setTimeout(() => tooltip.remove(), 2000);
        }, 1);
      });
    }

    async sendForm(form) {
      const formData = new FormData(form);
      const action = form.action;
      const method = form.method;

      const response = await fetch(action, {
        method,
        body: formData,
      });

      if (response.ok && response.url !== location.href) {
        location.href = response.url;
      }

      // Preview
      const text = await response.text();
      const html = new DOMParser().parseFromString(text, "text/html");
      const preview = document.querySelector("u-pagepreview");

      if (preview) {
        const oldPreview = preview.dataset.src;
        const newPreview = html.querySelector("u-pagepreview")?.dataset.src;

        if (oldPreview !== newPreview) {
          preview.setAttribute("data-src", newPreview);
        }
      }
    }
  },
);
