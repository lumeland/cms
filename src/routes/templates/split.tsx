interface Options {
  src: string;
}

export default function ({ src }: Options) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Preview</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div id="app" class="app is-preview">
          <iframe name="cms_window" src="/"></iframe>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
          const preview = document.createElement("iframe");
          preview.name = "preview_window";
          document.getElementById("app").append(preview);

          function changePreview(url) {
            preview.src = url;
          }
          changePreview("${src}");
        `,
          }}
        >
        </script>
      </body>
    </html>
  );
}
