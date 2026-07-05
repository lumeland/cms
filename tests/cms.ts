import lumeCMS from "../mod.ts";
import Memory from "../storage/memory.ts";

const cms = lumeCMS({
  root: Deno.cwd() + "/probas/demo",
  site: {
    name: "My awesome blog",
    url: "https://example.com",
  },
});

// Create a in memory storage
cms.storage("src", Memory.create());

// Create a document to edit a file
cms.document({
  name: "Homepage",
  description: "This is the Home page",
  store: "src:index.md",
  previewUrl: () => "https://lume.land",
  fields: [
    {
      name: "title",
      type: "text",
      label: "Please, write a title here",
      description: "A catchy title works better. Be creative!!",
      attributes: {
        required: true,
        placeholder: `Example: "The best blog in the world"`,
      },
    },
    "description: textarea",
    "content: markdown",
    {
      name: "extra",
      type: "code",
      attributes: {
        data: {
          language: "CSS",
        },
      },
    },
  ],
});

// Create a collection for posts
cms.collection({
  previewUrl: () => "https://lume.land",
  name: "posts",
  label: "My posts",
  store: "src:posts/**/*.md",
  fields: [
    {
      name: "title",
      type: "text",
      label: "Post title",
      description: "Write a catchy title for your post.",
      view: "title",
      attributes: {
        required: true,
        placeholder: `Example: "How to create a blog with LumeCMS"`,
      },
      init(field, _, data) {
        if (data?.title) {
          field.description = data.title.length > 100
            ? "This title is too long!"
            : "This title is perfect!";
        }
      },
    },
    "tags: list",
    "date: current-datetime",
    "so_data: date",
    "so_datatime: datetime",
    {
      name: "color",
      type: "color",
    },
    {
      name: "cover",
      type: "file",
      relativePath: true,
      upload: "my_uploads:img/covers",
    },
    {
      name: "image",
      type: "object",
      label: "Image note",
      fields: [
        "title: text",
        "image: file",
      ],
    },
    {
      name: "content",
      type: "markdown",
      label: "Post content",
      relativePath: true,
      transform: (value) => {
        return value.toUpperCase(); // Example transformation
      },
    },
  ],
  rename: true,
  delete: true,
  create: true,
});

// Configure a folder to upload files
cms.upload("my_uploads", "src:uploads");

export default cms;
