import { asset, getPath } from "../utils/path.ts";
import { getCurrentVersion } from "../utils/env.ts";

interface Props {
  jsImports: string[];
  content?: string;
}

export default function template({ jsImports, content }: Props) {
  return `
<!DOCTYPE html>
<html lang="en" data-baseassets="${asset()}" data-baseurls="${getPath()}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lume CMS</title>
  <link rel="stylesheet" href="${asset("/styles.css")}">
  <link rel="icon" href="${asset("/favicon.ico")}" type="image/x-icon">
  <script type="importmap">
    {
      "imports": {
        "lume_cms/": "${asset("/")}"
      }
    }
  </script>
<script type="module">
import "lume_cms/components/ui.js";
${jsImports.map((file) => `import "${file}";`).join("\n")}
</script>
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
