import { EditorSelection, EditorState, Transaction } from "@codemirror/state";
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

const markdownBinding = [
  {
    key: "Mod-b",
    run: toggleTag("**", "**"),
  },
  {
    key: "Mod-i",
    run: toggleTag("*", "*"),
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

  return new EditorView({
    state,
    parent,
  });
}

function toggleTag(start, end) {
  const startLength = start.length;
  const endLength = end.length;

  return function ({ state, dispatch }) {
    const changes = state.changeByRange((range) => {
      const existsBefore =
        state.sliceDoc(range.from - startLength, range.from) === start;
      const existsAfter =
        state.sliceDoc(range.to, range.to + endLength) === end;
      const changes = [];

      changes.push(
        existsBefore
          ? {
            from: range.from - startLength,
            to: range.from,
            insert: "",
          }
          : {
            from: range.from,
            insert: start,
          },
      );

      changes.push(
        existsAfter
          ? {
            from: range.to,
            to: range.to + endLength,
            insert: "",
          }
          : {
            from: range.to,
            insert: end,
          },
      );

      const extendBefore = existsBefore ? -startLength : startLength;
      const extendAfter = existsAfter ? -endLength : endLength;

      return {
        changes,
        range: EditorSelection.range(
          range.from + extendBefore,
          range.to + extendAfter,
        ),
      };
    });

    dispatch(
      state.update(changes, {
        scrollIntoView: true,
        annotations: Transaction.userEvent.of("input"),
      }),
    );

    return true;
  };
}
