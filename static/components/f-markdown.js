import {
  asset,
  fileType,
  labelify,
  oninvalid,
  pushOptions,
  updateField,
  url,
  view,
} from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/markdown.js";
import dom from "dom";

customElements.define(
  "f-markdown",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("label", { for: id, html: schema.label }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );

      const textarea = dom("textarea", {
        id,
        name,
        value: isNew ? value ?? schema.value : value,
        hidden: true,
        oninvalid,
      }, this);

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <link rel="stylesheet" href="${asset("styles", "code.css")}">
      <slot></slot>
      `;

      const helpers = dom("div", { class: "tools is-sticky" }, this);
      const custom = dom("div", { class: "tools-group" }, helpers);

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

      const code = dom("div", { class: "code" }, shadow);
      const md = init(code, textarea, pasteLink);
      let tools;

      tools = dom("div", { class: "tools-group" }, helpers);
      [
        [md.makeBold, "text-b"],
        [md.makeItalic, "text-italic"],
        [md.makeStrikethrough, "text-strikethrough"],
      ].forEach(([fn, icon]) => {
        dom("button", {
          class: "buttonIcon",
          type: "button",
          html: `<u-icon name="${icon}"></u-icon>`,
          onclick() {
            fn(md.editor);
            md.editor.focus();
          },
        }, tools);
      });

      tools = dom("div", { class: "tools-group" }, helpers);
      [
        [md.makeH1, "text-h-one"],
        [md.makeH2, "text-h-two"],
        [md.makeH3, "text-h-three"],
        [md.makeH4, "text-h-four"]
      ].forEach(([fn, icon]) => {
        dom("button", {
          class: "buttonIcon",
          type: "button",
          html: `<u-icon name="${icon}"></u-icon>`,
          onclick() {
            fn(md.editor);
            md.editor.focus();
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
            md.insertLink(md.editor, url);
            md.editor.focus();
          }
        },
        html: `<u-icon name="link-simple"></u-icon>`,
      }, tools);

      dom("a", {
        class: "buttonIcon",
        href: "https://www.markdownguide.org/basic-syntax/",
        target: "_blank",
        html: `<u-icon name="question"></u-icon>`,
      }, tools);

      this.editor = md.editor;
    }

    get currentValue() {
      return this.editor.state.doc.toString();
    }

    update(schema, value) {
      const input = this.querySelector("textarea");
      if (input.value !== value) {
        input.value = value ?? null;
        const editor = this.editor;
        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: value ?? "",
          },
          selection: {
            anchor: 0,
          },
        });
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
