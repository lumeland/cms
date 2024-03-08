import { asset, getPath } from "../utils/path.ts";
import { getCurrentVersion } from "../utils/env.ts";
import { Context } from "../../deps/hono.ts";

interface Props {
  context: Context;
  jsImports: string[];
  extraHead?: string;
  content?: string;
}

export default function template(
  { context, jsImports, content, extraHead }: Props,
) {
  return `
<!DOCTYPE html>
<html lang="en" data-baseassets="${asset(context)}" data-baseurls="${
    getPath(context)
  }">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lume CMS</title>
  <link rel="stylesheet" href="${asset(context, "/styles.css")}">
  <link rel="icon" href="${asset(context, "/favicon.ico")}" type="image/x-icon">
  <script type="importmap">
    {
      "imports": {
        "lume_cms/": "${asset(context, "/")}"
      }
    }
  </script>
<script type="module">
import "lume_cms/components/ui.js";
${jsImports.map((file) => `import "${file}";`).join("\n")}
</script>
${extraHead ?? ""}
</head>
<body>
  <div class="app">
    ${content}
  </div>
  <footer class="app-footer">
    Powered by <a href="https://lume.land/cms/">LumeCMS ${getCurrentVersion()}</a>
  </footer>
</body>
</html>
    `;
}
