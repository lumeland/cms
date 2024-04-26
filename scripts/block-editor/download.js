import fs from "fs";

// Node function to download a file in a directory
async function downloadFile(url, filename) {
  const response = await fetch(url);
  const content = await response.text();
  fs.writeFileSync(filename, content);
}

const mods = [
  "table",
  "separator",
  "quote",
  "pullquote",
  "list",
  "preformatted",
  "heading",
  "code",
  "paragraph",
];

mods.forEach((mod) => {
  downloadFile(
    `https://unpkg.com/@wordpress/block-library/build-style/${mod}/style.css`,
    `../../static/libs/wp-${mod}.css`,
  );
});

downloadFile(
  "https://unpkg.com/@wordpress/components/build-style/style.css",
  "../../static/libs/wp-components.css",
);
