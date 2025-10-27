import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Mathematics from '@tiptap/extension-mathematics';
import { Markdown } from 'tiptap-markdown';

import { isUrlLike } from './markup_util.js';

export function init({
  element,
  content,
  attributes,
  onUpdate,
}) {
  return new Editor({
    element, content, attributes, onUpdate,
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: 'Type something...',
      }),
      Markdown.configure({
        linkify: true,
        transformPastedText: true, // Allow to paste markdown text in the editor
        transformCopiedText: true, // Copied text is transformed to markdown
      }),
      Mathematics.configure({
        regex: /\$\$(([^\$]|\$[^\$])*)\$\$/gi,
      }),
    ],
    onCreate: ({ editor }) => {
      const dom = editor.view.dom;
      dom.addEventListener('paste', async (event) => {
        const clipboard = event.clipboardData; if (!clipboard) return;
        const text = clipboard.getData('text/plain')?.trim()
        if (text && isUrlLike(text) && fileType(text) == "image") {
          event.preventDefault()
          const state = editor.editorState;
          const selectedText = state.doc.textBetween(state.selection.from, state.selection.to, ' ')
          editor.chain()
            .setImage({ src: text, alt: selectedText || undefined })
            .setTextSelection(state.selection.to)
            .run()
          return
        }
      }, true);
      editor.on('destroy', () => dom.removeEventListener('paste', onPaste));
    },
  })
}
