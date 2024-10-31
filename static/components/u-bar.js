import { Component } from "./component.js";
import { push } from "./utils.js";

customElements.define(
  "u-bar",
  class Preview extends Component {
    async init() {
      const { api } = this.dataset;
      let currentPath = location.pathname;
      if (currentPath.endsWith("/index.html")) {
        currentPath = currentPath.slice(0, -10);
      }

      const url = new URL(api, location.origin);
      url.searchParams.set("url", currentPath);

      const response = await fetch(url);

      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const shadow = this.attachShadow({ mode: "open" });
      const bar = push(shadow, "div", { class: "bar" });

      push(
        shadow,
        "style",
        null,
        `
        .bar {
          position: fixed;
          bottom: 0;
          left: 0;
          z-index: 999;
          display: flex;
          background: white;
          box-shadow: 0 0 10px #3333;
          font-size: 14px;
          font-family: -apple-system, system-ui, sans-serif;
          line-height: 1;
          border-top-right-radius: 6px;
          overflow: hidden;
          > * {
            padding: 1em;
          }
          > * + * {
            border-left: 1px solid hsl(220, 20%, 94%);
          }
        }
        a {
          text-decoration: none;
          color: hsl(220, 20%, 15%);
          font-weight: 600;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;

          & svg {
            position: relative;
            top: -0.1em;
          }
        }

        a:hover {
          background: hsl(220, 20%, 96%);
        }
        .version {
          background: gold;
          padding: .3rem .5em;
          border-radius: 6px;
          font-size: .9rem;
          align-self: center;

          &.is-production {
            background: lightgreen;
          }
        }
      `,
      );

      const home = push(
        bar,
        "a",
        { href: data.editURL || data.homeURL, target: "_top" },
        `<svg width="24" height="24" viewBox="0 0 204 204" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M90.079.018V0l.018.04-.018-.022ZM90.097.04c5.038 5.96 9.249 8.881 13.016 11.492l.003.002c5.548 3.848 10.132 7.028 14.975 18.274 4.147 9.626 3.532 15.459 2.857 21.873l-.001.006c-.65 6.168-1.357 12.876 2.054 24.008-25.003-21.504-25.278-30.95-25.646-43.594V32.1c-.234-8.065-.507-17.431-7.258-32.06ZM56.128 53.261c-7.416 7.557-5.803 29.59 2.724 48.937 8.014 18.177-1.445 32.131-12.619 48.614l-.466.689c-.56.827-1.125 1.66-1.691 2.501 2.095-23.835-.091-29.498-10.339-47.835-10.239-18.336 3.789-42.609 22.391-52.906ZM138.205 35.083l.02.016c10.481 8.565 14.708 12.02 16.222 24.417.848 7.014-.404 12.329-1.721 17.918l-.001.005c-1.598 6.778-3.291 13.962-1.448 25.068-20.955-17.203-19.801-27.857-18.371-41.053v-.005c.988-9.124 2.108-19.465-3.857-34.026 3.486 3.026 6.518 5.504 9.156 7.66Z"/><path d="M88.403 27.294c-6.465 26.258 5.961 37.676 20.698 51.216h.001c16.101 14.794 34.96 32.121 34.96 74.108 9.86-11.323 11.956-24.363 14.18-38.202v-.002c2.878-17.919 5.972-37.179 26.412-55.799 0 26.74 8.965 43.51 19.346 58.684V204H0v-31.682c1.896-3.467 3.923-6.794 6.016-10.085l1.932-3.005 2.379-3.634c7.426-11.349 15.128-23.12 20.494-39.658-2.823 28.406 0 44.203 13.71 60.7 2.733-8.119 7.95-15.789 13.214-23.529l.009-.013.002-.003c10.31-15.158 20.799-30.577 13.166-50.138C59.38 73.41 60.483 61.93 88.403 27.294Z"/></svg>`,
        "LumeCMS",
      );

      if (data.version) {
        push(home, "span", {
          class: [
            "version",
            data.version.isProduction ? "is-production" : "",
          ],
        }, data.version.name);
      }
    }
  },
);
