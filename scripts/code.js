import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { html } from "@codemirror/lang-html";
import {
  dropCursor,
  highlightSpecialChars,
  keymap,
  rectangularSelection,
} from "@codemirror/view";

import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { languages } from "@codemirror/language-data";

export function init(parent, doc) {
  const state = EditorState.create({
    doc,
    extensions: [
      highlightSpecialChars(),
      history(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
      ]),
      html({
        codeLanguages: languages,
      }),
      EditorView.lineWrapping,
    ],
  });

  return {
    editor: new EditorView({
      state,
      parent,
    }),
  };
}
