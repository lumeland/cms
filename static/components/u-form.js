import { Component } from "./component.js";
import dom from "dom";

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
        if (e.submitter && !sameURL(e.submitter.formAction, form.action)) {
          return;
        }

        e.preventDefault();

        const tooltip = dom("div", {
          class: "tooltip is-toast",
          html: "Saving...",
        }, this);

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

      if (response.ok && !sameURL(response.url, location.href)) {
        location.href = response.url;
        return;
      }

      // Preview
      const text = await response.text();
      const html = new DOMParser().parseFromString(text, "text/html");
      const preview = document.querySelector("u-pagepreview");

      if (preview) {
        const oldPreview = preview.dataset.url;
        const newPreview = html.querySelector("u-pagepreview")?.dataset.url;

        if (oldPreview !== newPreview) {
          preview.setAttribute("data-url", newPreview);
        }
      }

      // Update the form with the new HTML
      const newFields = html.querySelector("u-fields");
      if (newFields) {
        const { fields, value } = newFields.dataset;
        const currentFields = this.querySelector("u-fields");
        currentFields.update(fields, value);
      }
    }
  },
);

function sameURL(url1, url2) {
  const u1 = new URL(url1);
  const u2 = new URL(url2);

  return u1.origin === u2.origin &&
    u1.pathname === u2.pathname &&
    u1.search === u2.search;
}
