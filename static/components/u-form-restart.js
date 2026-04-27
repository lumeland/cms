import { Component } from "./component.js";
import dom from "dom";
import { t } from "./utils.js";

customElements.define(
  "u-form-restart",
  class FormRestart extends Component {
    init() {
      const button = this.querySelector("button");
      const { message = t("busy.wait") } = this.dataset;
      this.classList.add("ly-none");

      button.form.addEventListener("submit", (ev) => {
        document.querySelectorAll("dialog[open]").forEach((dialog) =>
          dialog.close()
        );
        dom("dialog", {
          class: "u-busy",
          html: `<p>${message}</p>`,
        }, document.body).showModal();

        ev.preventDefault();
        this.sendForm(button.form);
      });
    }

    async sendForm(form) {
      const formData = new FormData(form);
      const action = form.action;
      const method = form.method;

      try {
        await fetch(action, {
          method,
          body: formData,
        });
      } finally {
        this.wait();
      }

      location.reload();
    }

    async wait() {
      try {
        await fetch(document.location);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.wait();
      }
    }
  },
);
