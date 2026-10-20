import lumeCMS from "./mod.ts";
import Memory from "./storage/memory.ts";

const cms = lumeCMS({
  site: {
    name: "CMS demo",
    url: "https://example.com",
  },
});

cms.auth({
  foo: "bar",
  admin: {
    name: "Administrator",
    password: "123",
    // language: "pt",
    permissions: {
      people: {
        edit: true,
      },
    },
  },
});

// Create a in memory storage
cms.storage("src", Memory.create());

// Create a document to edit the homepage (index.md file)
cms.document({
  name: "homepage",
  description: "This is the homepage of my blog",
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

// cms.git()

// Create a collection to edit some posts
cms.collection({
  // previewUrl: () => "https://lume.land",
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
          field.description =
            data.title.length > 100 ? "This title is too long!" : "This title is perfect!";
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
      transform: (_value) => {
        return "#333444";
      },
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
      fields: ["title: text", "image: file"],
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

cms.collection({
  name: "notes",
  label: "My notes",
  store: "src:notes/**/*.md",
  type: "choose",
  fields: [
    {
      name: "text",
      type: "object",
      label: "Note text",
      fields: ["title: text", "content: markdown"],
    },
    {
      name: "image",
      type: "object",
      label: "Image note",
      fields: [
        "title: text",
        {
          name: "imaxe",
          type: "file-list",
          fields: ["title: text", "file: file"],
        },
      ],
    },
  ],
});

// Create a collection of people and store the data in the Kv database
cms.collection({
  name: "people",
  type: "object-list",
  store: "src:people",
  fields: ["name: text!", "birthdate: date", "birthdate2: datetime", "bio: markdown"],
  documentName: (data) => {
    console.log({ data });

    return data[0]?.name?.toLowerCase().replace(/\s+/g, "-");
  },
  // edit: false,
  rename: false,
});

// Configure a folder to upload files
cms.upload("my_uploads", "src:uploads");

const app = cms.init();

// Run a local server with your CMS
app.serve();
