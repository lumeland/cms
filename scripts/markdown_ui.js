import { EditorSelection, Transaction } from "@codemirror/state";

export function toggleTag(start, end) {
  const startLength = start.length;
  const endLength = end.length;

  return function ({ state, dispatch }) {
    if (state.selection.ranges.every((range) => range.from === range.to)) {
      return false;
    }
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

export function toggleHeader(count) {
  const start = "#".repeat(count) + " ";

  return function ({ state, dispatch }) {
    const changes = state.changeByRange((range) => {
      const line = state.doc.lineAt(range.from);
      let text = line.text;
      if (line.text.startsWith(start)) {
        text = text.slice(start.length);
      } else if (line.text.match(/^\#+\s/)) {
        text = text.replace(/\#+\s/, "");
        text = start + text;
      } else {
        text = start + text;
      }

      return {
        changes: [
          {
            from: line.from,
            to: line.to,
            insert: text,
          },
        ],
        range: EditorSelection.range(
          range.from,
          range.to,
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

export function insertLink() {
  return function ({ state, dispatch }, url) {
    const changes = state.changeByRange((range) => {
      const changes = [];

      changes.push(
        {
          from: range.from,
          insert: "[",
        },
      );

      changes.push(
        {
          from: range.to,
          insert: url ? `](${url})` : "]()",
        },
      );

      return {
        changes,
        range: EditorSelection.range(
          range.to + 2,
          range.to + (url ? url.length + 3 : 3),
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
