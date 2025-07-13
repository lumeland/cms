import { oninvalid, toLocal, updateField, view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

export class Input extends Component {
  get inputAttributes() {
    return { type: "datetime-local" };
  }

  // Get the value in the format "YYYY-MM-DDTHH:MM"
  format(date) {
    return toLocal(new Date(date)).toISOString().slice(0, 16);
  }

  init() {
    this.classList.add("field");
    const { schema, value, namePrefix, isNew } = this;
    const name = `${namePrefix}.${schema.name}`;
    const id = `field_${name}`;

    view(this);
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

    dom("input", {
      ...schema.attributes,
      id,
      value: input.value ? this.format(input.value) : undefined,
      class: "input",
      ...this.inputAttributes,
      oninvalid,
      oninput() {
        input.value = new Date(this.value).toISOString();
      },
    }, this);
  }

  get currentValue() {
    return this.querySelector("input[type=hidden]")?.value;
  }

  update(schema, value) {
    const input = this.querySelector("input");
    input.value = value ? this.format(value) : null;
    updateField(this, schema, input);
  }
}

customElements.define("f-datetime", Input);
