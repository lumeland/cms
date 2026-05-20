const { baseurls } = document.documentElement.dataset;

navigation.addEventListener("navigate", (event) => {
  const url = new URL(event.destination.url);

  if (
    !event.canIntercept ||
    event.hashChange ||
    event.downloadRequest !== null ||
    event.navigationType === "reload" ||
    !document.startViewTransition ||
    (url.pathname !== baseurls && !url.pathname.startsWith(`${baseurls}/`))
  ) {
    return;
  }

  event.intercept({
    handler() {
      return document.startViewTransition(async () => {
        const response = await fetch(
          url,
          event.formData ? { body: event.formData, method: "POST" } : {},
        );
        const html = await response.text();
        const dom = parseHtml(html);
        const currentContent = document.querySelector(".app-container");
        const newContent = dom.querySelector(".app-container");
        currentContent.replaceWith(newContent);
        document.title = dom.title;
        const previewUrl = dom.querySelector("u-pagepreview")?.dataset.url;

        if (previewUrl) {
          document.querySelector("u-pagepreview")?.setAttribute(
            "data-url",
            previewUrl,
          );
        }
      }).finished;
    },
  });
});

function parseHtml(html) {
  html = html.trim().replace(/^\<!DOCTYPE html\>/i, "");
  const doc = document.implementation.createHTMLDocument();
  doc.documentElement.innerHTML = html;

  return doc;
}
