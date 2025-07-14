import { Compartment, EditorState } from "@codemirror/state";
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
import theme from "./codemirror_theme.js";

export function init(parent, textarea) {
  const themeConfig = new Compartment();
  const initTheme = document.documentElement.dataset.theme == "dark" ? theme.dark : theme.light;
  const state = EditorState.create({
    doc: textarea.value,
    extensions: [
      themeConfig.of(initTheme),
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

  const editor = new EditorView({
    state,
    parent,
  });

  textarea.form.addEventListener("submit", () => {
    textarea.value = editor.state.doc.toString();
  });

  addEventListener("themeChange", (event) => {
    const themeName = event.detail.theme === "dark" ? "dark" : "light";
    editor.dispatch({
      effects: themeConfig.reconfigure(theme[themeName]),
    });
  });

  return { editor };
}
