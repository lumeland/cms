import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { BlockCanvas, BlockEditorProvider } from "@wordpress/block-editor";
import { parse, serialize, setDefaultBlockName } from "@wordpress/blocks";

// Register the core blocks.
import "@wordpress/block-library/build-module/paragraph/init";
import "@wordpress/block-library/build-style/paragraph/style.css";
import "@wordpress/block-library/build-style/paragraph/editor.css";

import "@wordpress/block-library/build-module/code/init";
import "@wordpress/block-library/build-style/code/style.css";
import "@wordpress/block-library/build-style/code/editor.css";

import "@wordpress/block-library/build-module/heading/init";
import "@wordpress/block-library/build-style/heading/style.css";

import "@wordpress/block-library/build-module/html/init";
import "@wordpress/block-library/build-style/html/editor.css";

import "@wordpress/block-library/build-module/preformatted/init";
import "@wordpress/block-library/build-style/preformatted/style.css";

import "@wordpress/block-library/build-module/list/init";
import "@wordpress/block-library/build-module/list-item/init";
import "@wordpress/block-library/build-style/list/style.css";

import "@wordpress/block-library/build-module/pullquote/init";
import "@wordpress/block-library/build-style/pullquote/style.css";
import "@wordpress/block-library/build-style/pullquote/editor.css";

import "@wordpress/block-library/build-module/quote/init";
import "@wordpress/block-library/build-style/quote/style.css";

import "@wordpress/block-library/build-module/separator/init";
import "@wordpress/block-library/build-style/separator/style.css";
import "@wordpress/block-library/build-style/separator/editor.css";

import "@wordpress/block-library/build-module/table/init";
import "@wordpress/block-library/build-style/table/style.css";
import "@wordpress/block-library/build-style/table/editor.css";

import "@wordpress/block-library/build-module/details/init";
import "@wordpress/block-library/build-style/details/style.css";
import "@wordpress/block-library/build-style/details/editor.css";

import "@wordpress/block-library/build-module/verse/init";
import "@wordpress/block-library/build-style/verse/style.css";

setDefaultBlockName("core/paragraph");

// Register format types
import { registerFormatType } from "@wordpress/rich-text";
import { bold } from "@wordpress/format-library/build-module/bold";
import { italic } from "@wordpress/format-library/build-module/italic";
import { strikethrough } from "@wordpress/format-library/build-module/strikethrough";
import { code } from "@wordpress/format-library/build-module/code";
import { link } from "@wordpress/format-library/build-module/link";

[bold, code, italic, link, strikethrough].forEach(({ name, ...settings }) =>
  registerFormatType(name, settings)
);

// Default styles that are needed for the editor.
import "@wordpress/block-library/build-style/common.css";
import "@wordpress/components/build-style/style.css";
import "@wordpress/block-editor/build-style/style.css";
import "@wordpress/block-editor/build-style/content.css";
import "@wordpress/block-editor/build-style/default-editor-styles.css";

export function init(parent, textarea, cssFiles, height = "500px") {
  function setBlocks(newBlocks) {
    textarea.value = serialize(newBlocks);
  }

  const styles = [
    { css: cssFiles.map((css) => `@import "${css}";`).join("\n") },
  ];

  const editor = createElement(BlockEditorProvider, {
    value: parse(textarea.value),
    onChange: setBlocks,
    onInput: setBlocks,
  }, createElement(BlockCanvas, { height, styles }));

  const root = createRoot(parent);
  root.render(editor);
}
