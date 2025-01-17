import { getPath } from "../utils/path.ts";

import type { CMSContent, Version } from "../../types.ts";

type Link = [string, string] | string;

export default function breadcrumb(
  options: CMSContent,
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
      }"><a title="${version.name}" href="${
        getPath(options.basePath)
      }#versions">${version.name}</a></li>`
      : ""
  }
    <li><a href="${
    getPath(options.basePath)
  }"><u-icon name="house-fill"></u-icon> Home</a></li>
    ${
    links.map((link) =>
      typeof link === "string"
        ? `<li><a>${link}</a></li>`
        : `<li><a href="${link[1]}">${link[0]}</a></li>`
    ).join("")
  }
  </ul>
</nav>
  `;
}
