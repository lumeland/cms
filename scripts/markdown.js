import { EditorView, minimalSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";

export function init(parent, doc) {
  return new EditorView({
    doc,
    extensions: [minimalSetup, markdown()],
    parent,
  });
}
