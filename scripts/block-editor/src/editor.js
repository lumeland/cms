import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { BlockCanvas, BlockEditorProvider } from "@wordpress/block-editor";
import { registerCoreBlocks } from "@wordpress/block-library";
import { parse, serialize } from "@wordpress/blocks";

// Default styles that are needed for the editor.
import "@wordpress/components/build-style/style.css";
import "@wordpress/block-editor/build-style/style.css";

// Default styles that are needed for the core blocks.
import "@wordpress/block-library/build-style/common.css";
import "@wordpress/block-library/build-style/style.css";
import "@wordpress/block-library/build-style/editor.css";

// Register the default core block types.
registerCoreBlocks();

export function init(parent, textarea) {
  function setBlocks(newBlocks) {
    textarea.value = serialize(newBlocks);
  }

  const editor = createElement(BlockEditorProvider, {
    value: parse(textarea.value),
    onChange: setBlocks,
    onInput: setBlocks,
  }, createElement(BlockCanvas, { height: "500px" }));

  const root = createRoot(parent);
  root.render(editor);
}
