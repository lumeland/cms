import { src } from "../../utils/path.ts";
import type { Child } from "hono/jsx/index.ts";

interface Options {
  jsImports: string[];
}

interface Props {
  children?: Child;
}

export default function ({ jsImports }: Options) {
  return function ({ children }: Props) {
    return (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="basepath" content={src()} />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Lume CMS</title>
          <link
            rel="stylesheet"
            href={src("/styles.css")}
          />
          <script
            type="module"
            src={src("/components/ui.js")}
          >
          </script>

          {jsImports.map((file) => (
            <script type="module" src={src(file)}>
            </script>
          ))}
        </head>
        <body>
          <div class="app">
            {children}
          </div>
        </body>
      </html>
    );
  };
}
