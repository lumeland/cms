import { Component } from "./component.js";

customElements.define(
  "u-edit",
  class Preview extends Component {
    async init() {
      const { api } = this.dataset;
      let currentPath = window.location.pathname;
      if (currentPath.endsWith("/index.html")) {
        currentPath = currentPath.slice(0, -10);
      }

      const url = new URL(api, window.location.origin);
      url.searchParams.set("url", currentPath);

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (data.edit) {
          const shadow = this.attachShadow({ mode: "open" });
          shadow.innerHTML = `<style>
          a {
            position: fixed;
            bottom: 0;
            right: 0;
            text-decoration: none;
            padding: 1rem 2rem;
            background: white;
            color: hsl(220, 20%, 15%);
            z-index: 999;
            border-radius: 6px 0 0 0;
            box-shadow: 0 0 10px #3333;
            font-family: -apple-system, system-ui, sans-serif;
            font-weight: 600;
            line-height: 1;
            transition: background 0.2s ease;
          }
          a:hover {
            background: hsl(220, 20%, 94%);
          }
          </style>
          <a href="${data.edit}" target="top">Edit this page</a>
          `;
        }
      }
    }
  },
);
