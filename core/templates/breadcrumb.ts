import { labelify } from "../utils/string.ts";
import { getPath } from "../utils/path.ts";

import type { Version } from "../../types.ts";
import { Context } from "../../deps/hono.ts";

type Link = [string, string] | string;

export default function breadcrumb(
  context: Context,
  version?: Version,
  ...links: Link[]
) {
  return `
<nav aria-label="You are here:">
  <ul class="breadcrumb">
    ${
    version
      ? `<li class="breadcrumb-version ${
        version.isProduction ? "is-production" : ""
      }"><a href="${getPath(context)}#versions">${version.name}</a></li>`
      : ""
  }
    <li><a href="${
    getPath(context)
  }"><u-icon name="house-fill"></u-icon> Home</a></li>
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
