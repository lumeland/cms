import { labelify } from "../utils/string.ts";
import { getPath } from "../utils/path.ts";

import type { Version } from "../../types.ts";

type Link = [string, string] | string;

export default function breadcrumb(version?: Version, ...links: Link[]) {
  return `
<nav aria-label="You are here:">
  <ul class="breadcrumb">
    ${
    version
      ? `<li class="breadcrumb-version ${
        version.isProduction ? "is-production" : ""
      }"><a href="${getPath()}#versions">${version.name}</a></li>`
      : ""
  }
    <li><a href="${getPath()}"><u-icon name="house-fill"></u-icon> Home</a></li>
    ${
    links.map((link) =>
      typeof link === "string"
        ? `<li><a>${labelify(link)}</a></li>`
        : `<li><a href="${link[1]}">${labelify(link[0])}</a></li>`
    ).join("")
  }
  </ul>
</nav>
  `;
}
