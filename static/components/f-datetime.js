import {
  getFieldName,
  initField,
  oninvalid,
  toLocal,
  updateField,
} from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

export class Input extends Component {
  get inputAttributes() {
    return { type: "datetime-local" };
  }

  get nowButtonLabel() {
    return "Now";
  }

  // Get the value in the format "YYYY-MM-DDTHH:MM"
  format(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    return toLocal(date).toISOString().slice(0, 16);
  }

  init() {
    this.classList.add("field");
    const { schema, value, isNew } = this;
    const name = getFieldName(this);
    const id = `field_${name}`;

    initField(this);
    dom("label", {
      for: id,
      html: schema.label,
    }, this);

    dom("div", {
      class: "field-description",
      html: schema.description,
    }, this);

    const input = dom("input", {
      type: "hidden",
      name,
      value: isNew ? value ?? schema.value : value,
    }, this);

    const div = dom("div", { class: "ly-rowStack" }, this);

    const input2 = dom("input", {
      ...schema.attributes,
      id,
      value: input.value ? this.format(input.value) : undefined,
      class: "input",
      ...this.inputAttributes,
      oninvalid,
      oninput() {
        input.value = new Date(this.value).toISOString();
      },
    }, div);

    dom("button", {
      type: "button",
      html: this.nowButtonLabel,
      class: "button is-secondary",
      onclick: () => {
        input2.value = this.format(new Date());
        input2.dispatchEvent(new Event("input", { bubbles: true }));
      },
    }, div);
  }

  get currentValue() {
    return this.querySelector("input[type=hidden]")?.value;
  }

  update(schema, value) {
    const input = this.querySelector(".input");
    input.value = value ? this.format(value) : null;
    updateField(this, schema, input);
  }
}

customElements.define("f-datetime", Input);
