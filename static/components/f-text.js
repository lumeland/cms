import { Component } from "./component.js";
import { oninvalid, pushOptions, updateField, view } from "./utils.js";
import dom from "dom";

export class Input extends Component {
  get inputAttributes() {
    return { type: "text", class: "input" };
  }

  init() {
    this.classList.add("field");
    const { schema, value, namePrefix, isNew } = this;
    const name = `${namePrefix}.${schema.name}`;
    const id = `field_${name}`;

    view(this);
    dom("label", { for: id, html: schema.label }, this);

    dom(
      "div",
      { class: "field-description", html: schema.description },
      this,
    );

    const maxWidth = schema.attributes?.maxlength
      ? `${Math.max(3, schema.attributes.maxlength)}em`
      : "none";

    const input = dom("input", {
      ...schema.attributes,
      id,
      name,
      oninvalid,
      value: isNew ? value ?? schema.value : value,
      ...this.inputAttributes,
      style: { "--max-width": maxWidth },
    }, this);

    input.addEventListener("invalid", () => {
      input.dispatchEvent(
        new CustomEvent("cms:invalid", {
          bubbles: true,
          cancelable: false,
          detail: { input },
        }),
      );
    });

    if (schema.options) {
      const dataListId = `${id}_datalist`;
      const datalist = dom("datalist", { id: dataListId }, this);
      pushOptions(datalist, schema.options);
      input.setAttribute("list", dataListId);
      input.setAttribute("autocomplete", "off");
    }
  }

  get currentValue() {
    return this.querySelector("input")?.value;
  }

  update(schema, value) {
    const input = this.querySelector("input");
    input.value = value ?? null;
    updateField(this, schema, input);
  }
}

customElements.define("f-text", Input);
