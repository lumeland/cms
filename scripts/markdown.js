import { minimalSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";

export function init(parent, doc) {
  const state = EditorState.create({
    doc,
    extensions: [
      minimalSetup,
      markdown(),
      EditorView.lineWrapping,
    ],
  });

  return new EditorView({
    state,
    parent,
  });
}
