import { Component } from "./component.js";

customElements.define(
  "u-dropdown",
  class Views extends Component {
    init() {
      this.attachShadow({ mode: "open" });

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: relative;
            display: block;
          }
          .menu-selector {
            display: flex;
            white-space: nowrap;
            flex-direction: column;
          }
          .menu-selector-button {
            background: var(--color-line-light);
            color: var(--color-text);
            border: none;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--border-radius);
            cursor: pointer;
            transition-property: color, background;
            transition-duration: var(--animation-duration);

            &[aria-expanded="true"],
            &:hover {
              background: var(--color-line);
            }
          }
          .menu-selector-button svg {
            display: block;
            fill: currentColor;
            width: 24px;
            height: 24px;
          }
          .menu-selector-list:not([hidden]) {
            --padding: 6px;
            position: absolute;
            bottom: calc(100% + var(--padding));
            right: 0;
            display: flex;
            gap: 0px;
            flex-direction: column;
            padding: var(--padding);
            border-radius: calc(var(--border-radius) + var(--padding));
            box-shadow: var(--shadow);
            background: var(--color-line-light);
          }
        </style>
        <div class="menu-selector" part="dropdown">
          <button aria-label="Options" aria-controls="options-list" class="menu-selector-button" type="button" part="dropdown-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM128,72a12,12,0,1,0-12-12A12,12,0,0,0,128,72Zm0,112a12,12,0,1,0,12,12A12,12,0,0,0,128,184Z"></path></svg>
          </button>
          <div id="options-list" class="menu-selector-list" hidden part="dropdown-links">
            <slot></slot>
          </div>
        </div>
      `;

      const button = this.shadowRoot.querySelector(".menu-selector-button");
      const list = this.shadowRoot.querySelector(".menu-selector-list");

      button.addEventListener("click", (ev) => {
        const expanded = button.ariaExpanded === "true" ? "false" : "true";
        button.ariaExpanded = expanded;
        list.hidden = expanded === "false";
        ev.stopPropagation();
      });

      this.ownerDocument.body.addEventListener("click", () => {
        setTimeout(() => {
          button.ariaExpanded = "false";
          list.hidden = true;
        }, 10);
      });

      this.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") {
          button.ariaExpanded = "false";
          list.hidden = true;
        }
      });
    }
  },
);
