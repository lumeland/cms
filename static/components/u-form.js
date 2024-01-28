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

        setTimeout(() => this.sendForm(form), 1);
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
        history.replaceState(null, "", response.url);
        form.action = response.url;
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

      const tooltip = push(this, "div", {
        role: "tooltip",
        class: "is-toast",
      }, "Updated!");
      setTimeout(() => tooltip.remove(), 2000);
    }
  },
);
