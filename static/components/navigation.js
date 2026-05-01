navigation.addEventListener("navigate", (event) => {
  if (!event.canIntercept || event.hashChange || event.downloadRequest !== null) {
    return;
  }

  const url = new URL(event.destination.url);
  console.log(event)
  event.intercept({
    async handler() {
      const response = await fetch(url);
      const html = await response.text();
      const dom = parseHtml(html);
      const currentContent = document.querySelector(".app-container");
      const newContent = dom.querySelector(".app-container");
      currentContent.replaceWith(newContent);
      document.title = dom.title;
    }
  })
});

function parseHtml(html) {
  html = html.trim().replace(/^\<!DOCTYPE html\>/i, "");
  const doc = document.implementation.createHTMLDocument();
  doc.documentElement.innerHTML = html;

  return doc;
}
