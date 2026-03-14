import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-form-join",
  class Form extends Component {
    init() {
      const form = this.querySelector("form");
      const id = this.dataset.form;

      form.addEventListener("submit", (e) => {
        const joinedForm = document.getElementById(id);
        e.preventDefault();

        joinedForm.action = form.action;
        const data = new FormData(form);
        for (const [name, value] of data) {
          dom("input", { type: "hidden", name, value }, joinedForm);
        }
        joinedForm.submit();
      });
    }
  },
);
