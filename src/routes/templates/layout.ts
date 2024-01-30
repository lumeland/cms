import { src } from "../../utils/path.ts";

interface Props {
  jsImports: string[];
  content?: string;
}

export default function template({ jsImports, content }: Props) {
  return `
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="basepath" content="${src()}">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lume CMS</title>
          <link rel="stylesheet" href="${src("/styles.css")}">
          <script type="module" src="${src("/components/ui.js")}"></script>

          ${
    jsImports.map((file) =>
      `<script type="module" src="${src(file)}"></script>`
    ).join("\n")
  }
        </head>
        <body>
          <div class="app">
            ${content}
          </div>
        </body>
      </html>
    `;
}
