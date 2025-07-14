import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
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
  completionKeymap,
} from "@codemirror/autocomplete";
import { languages } from "@codemirror/language-data";
import theme from "./codemirror_theme.js";
import { html } from "@codemirror/lang-html";
import { yamlFrontmatter } from "@codemirror/lang-yaml";

export function init(parent, textarea) {
  const themeConfig = new Compartment();
  const languageConfig = new Compartment();
  const initTheme = document.documentElement.dataset.theme == "dark" ? theme.dark : theme.light;
  const state = EditorState.create({
    doc: textarea.value,
    code: languages,
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
        indentWithTab,
      ]),
      languageConfig.of(html()),
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

  async function changeLanguage(extension) {
    const lang = await getLanguage(extension);
    if (lang) {
      editor.dispatch({
        effects: languageConfig.reconfigure(lang),
      });
    }
  }

  const allLanguages = languages.map((lang) => lang.name).sort();

  return { editor, changeLanguage, allLanguages };
}

async function getLanguage(name) {
  const lang = languages.find((lang) => lang.name === name);
  if (lang) {
    if (name === "Markdown") {
      return yamlFrontmatter({ content: await lang.load() });
    }
    return await lang.load();
  }
}
