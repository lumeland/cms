import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
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
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { languages } from "@codemirror/language-data";

import theme from "./codemirror_theme.js";
import * as ui from "./markdown_ui.js";
import { isUrlLike } from "./markup_util.js"

const makeBold = ui.toggleTag("**", "**");
const makeItalic = ui.toggleTag("*", "*");
const makeStrikethrough = ui.toggleTag("~~", "~~");
const makeH1 = ui.toggleHeader(1);
const makeH2 = ui.toggleHeader(2);
const makeH3 = ui.toggleHeader(3);
const makeH4 = ui.toggleHeader(4);
const makeH5 = ui.toggleHeader(5);
const makeH6 = ui.toggleHeader(6);
const insertLink = ui.insertLink();
const insertSnippet = ui.insertSnippet();

const markdownBinding = [
  {
    key: "Mod-b",
    run: makeBold,
  },
  {
    key: "Mod-i",
    run: makeItalic,
  },
  {
    key: "Mod-l",
    run: insertLink,
  },
];

export function init(parent, textarea, pasteLink = createLink) {
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
      autocompletion({
        defaultKeymap: false,
      }),
      rectangularSelection(),
      keymap.of([
        ...markdownBinding,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      markdown({
        codeLanguages: languages,
      }),
      EditorView.lineWrapping,
      EditorView.domEventHandlers({
        paste(event, view) {
          const text = event.clipboardData.getData("text/plain");
          const selectedText = view.state.doc.sliceString(
            view.state.selection.main.from,
            view.state.selection.main.to,
          );
          const insert = isUrlLike(text) ? pasteLink(text, selectedText) : text;

          view.dispatch({
            changes: {
              from: view.state.selection.main.from,
              to: view.state.selection.main.to,
              insert,
            },
            selection: {
              anchor: view.state.selection.main.from + insert.length,
            },
          });
          return true;
        },
      }),
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

  return {
    makeBold,
    makeItalic,
    makeStrikethrough,
    makeH1,
    makeH2,
    makeH3,
    makeH4,
    makeH5,
    makeH6,
    insertLink,
    insertSnippet,
    editor,
  };
}

function createLink(url, selectedText) {
  return selectedText ? `[${selectedText}](${url})` : url;
}
