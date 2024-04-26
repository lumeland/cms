import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { BlockCanvas, BlockEditorProvider } from "@wordpress/block-editor";
import { parse, serialize, setDefaultBlockName } from "@wordpress/blocks";

// Register the core blocks.
import "@wordpress/format-library";
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

setDefaultBlockName("core/paragraph");

// Default styles that are needed for the editor.
import "@wordpress/components/build-style/style.css";
import "@wordpress/block-editor/build-style/style.css";

export function init(parent, textarea) {
  function setBlocks(newBlocks) {
    textarea.value = serialize(newBlocks);
  }

  const editor = createElement(BlockEditorProvider, {
    value: parse(textarea.value),
    settings: {
      styles: [
        {
          css: `
            body {
              font-family: Arial;
              font-size: 16px;
            }
      
            p {
              font-size: inherit;
              line-height: inherit;
            }
      
            ul {
              list-style-type: disc;
            }
      
            ol {
              list-style-type: decimal;
            }
          `,
        },
      ],
    },
    onChange: setBlocks,
    onInput: setBlocks,
  }, createElement(BlockCanvas, { height: "500px" }));

  const root = createRoot(parent);
  root.render(editor);
}
