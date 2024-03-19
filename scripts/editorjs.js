import EditorJS from "@editorjs/editorjs";
import header from "@editorjs/header";
import delimiter from "@editorjs/delimiter";
import nestedList from "@editorjs/nested-list";

export function init(parent, textarea) {
  const editor = new EditorJS({
    holder: parent,
    placeholder: textarea.placeholder,
    onChange: () => {
      editor.save().then((outputData) => {
        textarea.value = JSON.stringify(outputData);
      });
    },
    tools: {
      header,
      list: {
        class: nestedList,
        inlineToolbar: true,
        config: {
          defaultStyle: "unordered",
        },
      },
      delimiter,
    },
    data: textarea.value ? JSON.parse(textarea.value) : {},
  });

  return {
    editor,
  };
}
