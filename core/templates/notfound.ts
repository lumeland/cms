import { getPath } from "../utils/path.ts";
import { Context } from "../../deps/hono.ts";

interface Props {
  context: Context;
}

export default function template({ context }: Props) {
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

  <a class="button is-primary" href="${getPath(context)}">
    Back to the home
  </a>
</div>
`;
}
