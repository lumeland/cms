import {
  asset,
  fileType,
  initField,
  labelify,
  oninvalid,
  updateField,
  url,
} from "./utils.js";
import { init } from "../libs/tiptap.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-rich-text",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      initField(this);
      dom("label", {
        for: id,
        html: schema.label,
        onclick: () => this.editor.chain().focus().run(),
      }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );

      const hiddenInput = dom("textarea", {
        id,
        name,
        value: isNew ? value ?? schema.value : value,
        hidden: true,
        oninvalid,
      }, this);

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <link rel="stylesheet" href="${asset("styles", "rich-text.css")}">
      <slot></slot>
      `;

      const helpers = dom("div", { class: "tools is-sticky" }, this);
      const custom = dom("div", { class: "tools-group" }, helpers);

      const editorContainer = dom("div", { id, class: "rich-text" }, shadow);

      if (schema.upload) {
        const name = schema.upload;

        dom("button", {
          class: "button is-secondary",
          type: "button",
          onclick() {
            dom("u-modal", {
              data: { src: url("uploads", name) },
            }, document.body);
          },
          html: `<u-icon name="image-square-fill"></u-icon> ${labelify(name)}`,
        }, custom);
      }

      this.editor = init({
        element: editorContainer,
        content: isNew ? value ?? schema.value : value,
        attributes: {
          "aria-labelledby": `${id}_label`,
        },
        onUpdate: ({ editor }) => {
          hiddenInput.value = editor.getHTML();
        },
        pasteLink: fileType,
      });

      let tools;
      const chain = () => this.editor.chain().focus();

      tools = dom("div", { class: "tools-group" }, helpers);
      [
        [() => chain().toggleBold(), "text-b"],
        [() => chain().toggleItalic(), "text-italic"],
        [() => chain().toggleStrike(), "text-strikethrough"],
      ].forEach(([chain, icon]) => {
        dom("button", {
          class: "buttonIcon",
          type: "button",
          html: `<u-icon name="${icon}"></u-icon>`,
          onclick() {
            chain().run();
          },
        }, tools);
      });

      dom("button", {
        class: "buttonIcon",
        type: "button",
        onclick: () => {
          const currentValue = this.editor.getAttributes("link").href || "";
          const url = prompt("URL to link to:", currentValue);

          if (url) {
            chain().setLink({ href: url }).run();
          } else {
            chain().unsetLink().run();
          }
        },
        html: `<u-icon name="link-simple"></u-icon>`,
      }, tools);

      tools = dom("div", { class: "tools-group" }, helpers);
      [
        [() => chain().toggleHeading({ level: 1 }), "text-h-one"],
        [() => chain().toggleHeading({ level: 2 }), "text-h-two"],
        [() => chain().toggleHeading({ level: 3 }), "text-h-three"],
        [() => chain().toggleHeading({ level: 4 }), "text-h-four"],
      ].forEach(([chain, icon]) => {
        dom("button", {
          class: "buttonIcon",
          type: "button",
          html: `<u-icon name="${icon}"></u-icon>`,
          onclick() {
            chain().run();
          },
        }, tools);
      });
    }

    get currentValue() {
      return this.editor.getHTML();
    }

    update(schema, value) {
      const input = this.querySelector("textarea");
      if (input.value !== value) {
        input.value = value ?? null;
        this.editor.commands.setContent(value ?? "");
      }
      updateField(this, schema, input);
    }
  },
);
