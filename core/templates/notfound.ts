import { getPath } from "../utils/path.ts";
import type { CMSContent } from "../../types.ts";

interface Props {
  options: CMSContent;
}

export default function template({ options }: Props) {
  return `
<header class="header">
  <h1 class="header-title">
    Not found
  </h1>
</header>

<div class="not-found">
  <p>
    The page you are looking for does not exist.
  </p>

  <a class="button is-primary" href="${getPath(options.basePath)}">
    Back to the home
  </a>
</div>
`;
}
