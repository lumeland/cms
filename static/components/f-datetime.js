import {
  getFieldName,
  getNow,
  initField,
  oninvalid,
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

  format(value) {
    return value?.slice(0, 16);
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

    const div = dom("div", { class: "ly-rowStack" }, this);
    const input = dom("input", {
      ...schema.attributes,
      id,
      name,
      value: this.format(isNew ? value ?? schema.value : value),
      class: "input",
      ...this.inputAttributes,
      oninvalid,
    }, div);

    dom("button", {
      type: "button",
      html: this.nowButtonLabel,
      class: "button is-secondary",
      onclick: () => input.value = this.format(getNow().toISOString()),
    }, div);
  }

  get currentValue() {
    return this.querySelector("input[type=hidden]")?.value;
  }

  update(schema, value) {
    const input = this.querySelector(".input");
    input.value = this.format(value);
    updateField(this, schema, input);
  }
}

customElements.define("f-datetime", Input);
