import { EditorState } from "@codemirror/state";
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
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { languages } from "@codemirror/language-data";

import * as ui from "./markdown_ui";

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

export function init(parent, textarea) {
  const state = EditorState.create({
    doc: textarea.value,
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
        ...markdownBinding,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
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
          const insert = isUrlLike(text) && selectedText
            ? `[${selectedText}](${text})`
            : text;

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
    editor,
  };
}

function isUrlLike(text) {
  if (URL.canParse(text)) {
    return true;
  }

  if (text.includes(" ")) {
    return false;
  }

  // It's a path
  return text.startsWith("./") || text.startsWith("/") ||
    text.startsWith("#") || text.startsWith("?");
}
