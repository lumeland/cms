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
import { highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";

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
      highlightSelectionMatches(),
      keymap.of([
        ...markdownBinding,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
      ]),
      markdown(),
      EditorView.lineWrapping,
    ],
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
    editor: new EditorView({
      state,
      parent,
    }),
  };
}
