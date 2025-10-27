import {
  asset,
  fileType,
  initField,
  labelify,
  oninvalid,
  pushOptions,
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
        id: `${id}_label`,
        html: schema.label,
        onclick: () => this.editor.chain().focus().run(),
      }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );
      
      const hiddenInput = dom("input", {
        name,
        type: "hidden",
        value: isNew ? value ?? schema.value : value,
        oninvalid,
      }, this);

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <link rel="stylesheet" href="${asset("styles", "rich-text.css")}">
      <slot></slot>
      `;

      const helpers = dom("div", { class: "tools is-sticky" }, this);
      const custom = dom("div", { class: "tools-group" }, helpers);

      const editorContainer = dom("div", { id, class: 'rich-text' }, shadow);

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

      if (schema.snippets) {
        const select = dom("select", {
          class: "select is-secondary",
          style: "width:7em",
          html: "<option value=''>Insert…</option>",
          onchange() {
            if (this.value) {
              md.insertSnippet(md.editor, this.value);
              md.editor.focus();
            }
            this.value = "";
          },
        }, custom);
        pushOptions(select, schema.snippets);
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
      });
      
      let tools;
      let chain = () => this.editor.chain().focus()

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

      tools = dom("div", { class: "tools-group" }, helpers);
      dom("button", {
        class: "buttonIcon",
        type: "button",
        onclick() {
          const url = prompt("URL to link to:");

          if (url) {
            chain().setLink({ href: url }).run();
          }
        },
        html: `<u-icon name="link-simple"></u-icon>`,
      }, tools);
    }

    get currentValue() {
      return this.editor.getHTML();
    }

    update(schema, value) {
      const input = this.querySelector("input[type=hidden]");
      if (input.value !== value) {
        input.value = value ?? null;
        const editor = this.editor;
        editor.setHTML(value ?? "");
      }
      updateField(this, schema, input);
    }
  },
);

function pasteLink(url, selectedText = "") {
  switch (fileType(url)) {
    case "image":
      return `![${selectedText || "Image"}](${url})`;

    case "video":
      return `<video src="${url}" controls>${selectedText}</video>`;

    case "audio":
      return `<audio src="${url}" controls>${selectedText}</audio>`;

    default:
      return `[${selectedText || "Link"}](${url})`;
  }
}
