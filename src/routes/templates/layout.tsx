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
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Lume CMS</title>
          <link rel="stylesheet" href="/styles.css" />
          <script type="module" src="/components/ui.js"></script>
          {jsImports.map((src) => <script type="module" src={src}></script>)}
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
