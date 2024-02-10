import { getPath } from "../utils/path.ts";

export default function template() {
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

  <a class="button is-primary" href="${getPath()}">
    Back to the home
  </a>
</div>
`;
}
