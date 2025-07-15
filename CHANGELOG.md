# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.12.4] - 2025-07-15
### Fixed
- Error creating new documents in a collection.

## [0.12.3] - 2025-07-15
### Added
- Support to configure the path in `GitHub::create()`.
- Allow to edit documents in code mode.
- Allow to customize the language of `code` field with `attributes.data.language`.
- Support for front matter in the `code` field.
- When the parsing of a document fails, show the error and allow to edit the raw code.

### Changed
- Shorter hash when using a development version [#62].
- Indent using `tab` key in `markdown` and `code` fields.

### Fixed
- Layout shift caused by some components.
- Improved syntax colors of markdown and code fields.

## [0.12.2] - 2025-07-13
### Added
- When the changes are saved, the edit form updates accordingly.
- Buttons `Now` and `Today` to `datetime` and `date` fields respectively.

### Fixed
- Updated dependencies to the latest version

## [0.12.1] - 2025-07-12
### Added
- New option `rename` to prevent to rename a document in a collection by hidding the text input.

### Fixed
- Publish version: delete the branch only after pushing changes.
- Passed the current data to the `init()` callback of fields on edit a document.
- Netlify support:
  - Failing on caches API. [#59]
  - Don't run `Deno.cwd()` if it's not needed
- `required autofocus` attributes to the field to set/edit the document name in a collection.

## [0.12.0] - 2025-06-12
### Added
- Allow to edit documents in code mode.

### Changed
- Internal: use Vento templates instead of template strings.
- Uploads icon.

### Fixed
- Updated dependencies and vendor libs.
- Apply a min-height to code and markdown fields.
- Imagick lib error in Deno 2.3.6.

## [0.11.5] - 2025-04-25
### Fixed
- Upload option for `file` field.

## [0.11.4] - 2025-04-20
### Added
- New `choose` field, similar to `choose-list` but for only one element.

### Fixed
- `number` field [#53].

## [0.11.3] - 2025-04-14
### Fixed
- `object-list` fields [#52].
- Updated dependencies.

## [0.11.2] - 2025-04-10
### Added
- `collection.views` and `document.views` accepts a function to return the initial views depending on the data [#51].

## [0.11.1] - 2025-04-04
### Fixed
- Restored `transform` function.
- Some fields don't save the value.

## [0.11.0] - 2025-04-03
### Added
- 3rd argument to `field.init()` with the data to edit or undefined for new creations.

### Changed
- Refactored fields. Now every field is in an individual file.

### Removed
- `uploads` property for *file* and *markdown*. Use `upload` (in singular).
- `nameField` property for collections. Use `documentName`.
- `field.details` property.

### Fixed
- Fields have been refactored to improve types
- Initial field views
- Updated dependencies (hono and std)

## [0.10.5] - 2025-03-27
### Fixed
- Types for fields [#37]

## [0.10.4] - 2025-03-17
### Fixed
- GitHub storage when the root folder is empty.

## [0.10.3] - 2025-03-17
### Fixed
- GitHub storage bugs [#46].

## [0.10.2] - 2025-03-14
### Fixed
- Sync prod branch [#41].

## [0.10.1] - 2025-03-11
### Fixed
- Preview AVIF images [#45].

## [0.10.0] - 2025-03-05
### Added
- Snippets option to markdown field.
- New `cms:versionCreated`, `cms:versionChanged`, `cms:versionPublished` and `cms:versionDeleted` events.

### Changed
- Refactor git versioning class and make the commands sync.
- Remove autocomplete keymap in markdown because it prevents to type `[` in some keyboards.

### Removed
- Option `onPublish` to git. It was replaced with `cms:versionPublished` event.

### Fixed
- Improved buttons in markdown field
- Updated dependencies.

## [0.9.4] - 2025-02-24
### Added
- Allow to upload multiple files.

## [0.9.3] - 2025-02-22
### Added
- New option `onPublish` to git.
- New core field `file-list`. It's like an `object-list` but allows to upload multiple files at once.

## [0.9.2] - 2025-01-21
### Added
- New static functions `Fs.create()`, `GitHub.create()` and `Kv.create()` to simplify the storage instantations.

### Fixed
- Refactor Github storage to support recursive listing.
- Apply default values creating new items in a collection.

## [0.9.1] - 2025-01-19
### Added
- New option `listed` for uploads to don't show the upload in the homepage.
- In *markdown* set the `upload` property to `false` to disable the upload button.
- `collection.documentName` allows to customize the name of the new documents created in a collection. You can use a pattern (`{title}/index.yml`) or a function.
- `collection.documentLabel` allows to customize the label (public name) of the documents in a collection.
- `{document_dirname}` placeholder to `upload` property. This allows to save a file in the same directory of the page. Example:
  ```js
  {
    name: "image",
    type: "file",
    upload: "media:{document_dirname}",
  }
  ```
- Added `label` option to collections, documents and uploads.
- Allow to define uploads using an options object.

### Deprecated
- `uploads` property for *file* and *markdown* fields. Use `upload` (in singular).
- `nameField` property for collections. Use `documentName`.

### Removed
- Unused `field.publicPath` option.

## [0.9.0] - 2025-01-15
### Added
- New `git()` function to configure git repository.
- New `auth()` function to configure the authentication after the CMS instantation.

### Fixed
- Don't show the logout button if no auth is configured.
- Logout code.

## [0.8.3] - 2025-01-10
### Fixed
- Rename files if the collection path is a glob with multiple extensions.

## [0.8.2] - 2025-01-10
### Changed
- In collections, folders and files are sorted alphabetically together (instead of folders first and then files).
- Download button in upload detail.

### Fixed
- List of folders containing dots.
- Better alignment of files and folders.

## [0.8.1] - 2025-01-02
### Added
- You can define default values when creating a new document passing query parameters in the URL. Example: `http://localhost:8000/collection/Articles/create?_id=hello-world.md&title=Hello+world`.

### Fixed
- Git publish action: pull changes before push.
- Replaced Sharp with Imagick (sharp doesn't work on Deno Deploy).

## [0.8.0] - 2024-12-30
### Added
- Allow to duplicate object-list and choose-list elements.
- Allow to crop images.
- Allow to change the formats of images (i.e. `jpeg` => `webp`).
- Initial e2e tests.

### Fixed
- UI tweaks.
- Upload files in a subfolder.
- Updated dependencies.

## [0.7.7] - 2024-12-22
### Security
- Normalize documents and upload names before save.

## [0.7.6] - 2024-12-14
### Fixed
- Styles of `u-bar` component.

## [0.7.5] - 2024-12-11
### Fixed
- `u-bar` component.

## [0.7.4] - 2024-12-11
### Changed
- Home body moved below the menu, and changed styles.
- Internal: replace `push` with `oscarotero/dom` library.
- Show the collection items and uploads sorted alphabetically.

### Fixed
- Improved collection filter with accents.

## [0.7.3] - 2024-11-22
### Added
- Static server on Windows [#34].
- Updated dependencies.

## [0.7.2] - 2024-11-03
### Added
- Input fields allow to paste images or URLs.

### Changed
- Removed icons folder and fetch them from JsDelivr.
- Make the views more clicable.
- Improved some styles.

## [0.7.1] - 2024-10-31
### Fixed
- Some style issues.
- Description in `list` field is not shown [#30].
- GitHub adapter doesn't show files bigger than 1Mb [#31].

## [0.7.0] - 2024-10-11
### Added
- Support for arrays without keys [#28].

### Changed
- Internal changes but potentially breaking (related with [#29]):
  - Removed `Field.cmsContent` property.
  - Changed the type of `Field.applyChanges` and `Field.init` functions.
  - Added `Field.details` property to pass extra data from back to front.

## [0.6.8] - 2024-10-05
### Fixed
- Form redirect after submit.

## [0.6.7] - 2024-10-05
### Fixed
- Form submit using AJAX.

## [0.6.6] - 2024-10-05
### Added
- New option `view` to show/hide fields under specific views.
- `nameField` accepts a function to generate the filename dynamically [#26].

### Fixed
- Show invalid fields on submit, even if they are hidden.

## [0.6.5] - 2024-09-28
### Fixed
- Hono static server breaking change introduced in 4.6.3.

## [0.6.4] - 2024-09-28
### Added
- New option `site.body` to include random HTML code in the homepage.
- Allow html code in field descriptions.

### Changed
- The CMS bar is less invasive:
  - It's smaller.
  - Merged "Go to home" and "Edit page" in just one link.

### Fixed
- Updated dependencies: `codemirror`, `hono`, `std`.
- Removed internal code smell.
- Styles tweaks.

## [0.6.3] - 2024-09-18
### Fixed
- Default values.

## [0.6.2] - 2024-09-16
### Added
- Button to logout.
- Allow to upload files in subfolders.

### Changed
- Improved footer styles.

## [0.6.1] - 2024-09-12
### Changed
- UI and behavior of the `current-datetime` field [#23].

### Fixed
- Renamed `current_datetime` to `current-datetime`.
- Updated deps: `hono` and `std`.

## [0.6.0] - 2024-09-11
### Added
- Allow to create collection items in subfolders.
- New field `current_datetime`, to set always the current datetime on save.

### Removed
- `mode` option introduced in `0.5.10`.
  - Use the new `current_datetime` field for `update` mode.
  - Use the `field.value` option for `create` mode.

### Fixed
- `field.value` is used as the default value for new entries [#22].

## [0.5.10] - 2024-08-14
### Added
- Markdown field: create links on paste url-like content.
- New option `mode` for `date` and `datetime` fields with the options "create" and "update":
  - create: Add the current time if the value is empty
  - update: Update always the value to the current time

### Fixed
- Updated Codemirror and dev libraries (rollup, terser).
- Datetime field doesn't load the previous value

## [0.5.9] - 2024-08-12
### Fixed
- Updated deps: `hono`, `std`.
- Show URL preview in Document edit view.

## [0.5.8] - 2024-08-06
### Fixed
- Back to `hono` 4.4.3 due https://github.com/honojs/hono/issues/3238

## [0.5.7] - 2024-08-03
### Fixed
- YAML generation with weird linebreaks.
- Removed auth for websockets in the proxy.
- Upload files bug.
- Updated deps: `hono`, `std`.

## [0.5.6] - 2024-07-17
### Fixed
- Auth throught server/proxy.ts.
- Removed auth for websockets.
- Width of the preview iframe.
- Removed preview link.
- Updated deps: `hono`, `std`.

## [0.5.5] - 2024-07-10
### Added
- Button to duplicate a page in a collection.
- New option `nameField` for collections to use the value of a field as the document name [#19].
- New option `create` and `delete` for collections to customize permissions [#20].

### Fixed
- Allow to set empty values to `select` by default.
- Updated `hono` and `std` dependencies.

## [0.5.4] - 2024-07-03
### Fixed
- Preview with no credentials.
- `object-list` must show the value of the first field.
- `object-list` and `object-choose` duplicated data on reorder items.

## [0.5.3] - 2024-06-26
### Changed
- Documents are created if they don't exist [#16].

### Fixed
- Auth credentials in Safari [#18].
- Updated dependencies: `hono`, `std`.

## [0.5.2] - 2024-06-16
### Changed
- choose-list: Replace the buttons to add new items with a select.

### Fixed
- Updated dependencies: `hono`.
- Updated libs.
- Markdown and Code fields doesn't work well in nested fields.

## [0.5.1] - 2024-06-13
### Added
- Close the proxied server after some inactivity.

### Fixed
- The `value` property of the `date` field was readonly [#15].
- Updated dependencies: `hono`, `std`.

## [0.5.0] - 2024-06-01
### Added
- New `server/proxy.ts` script to run the CMS in a server.
  - It includes the ability to configure a git client.
- Support for `deno serve` command.

### Changed
- Lume adapter shows always the draft pages.

### Removed
- Not documented `cms.versioning` option.

## [0.4.3] - 2024-05-30
### Added
- New option `transform` to field, to pass an arbitrary function to transform the value before saving it. For example, to ensure all urls ends with `/`:
  ```js
  cms.collection("posts", "src/posts/*.md", [
    {
      name: "url",
      type: "string",
      transform: (value) => value && !value.endsWith("/") ? `${value}/` : value
    }
  ])
  ```

### Fixed
- Updated dependencies: `std`.

## [0.4.2] - 2024-05-24
### Fixed
- Updated dependencies: `hono`, `std`.
- Some dependencies have been migrated to `jsr` because are not longer updated on `land/x`.
- Error removing elements in `choose-list` and `object-list` fields.

## [0.4.1] - 2024-05-15
### Added
- Allow to create documents and collections using a single object instead of arguments.
- New option `url` to documents and collections. It allows to set/override the preview URL.
- Allow to resize the preview window.

### Fixed
- Version color in the breadcrumb in dark mode.
- Removed unused script.
- Updated Hono to the latest version.

## [0.4.0] - 2024-05-14
### Changed
- More compact UI.
- `object` fields are closed by default. Use `attributes.open = true` to change it.
- Removed `x` button of popovers.

### Fixed
- `file` field when the value is an URL.
- Removed the numbers in the choose-list items.

## [0.3.12] - 2024-05-13
### Changed
- object-list improvements:
  - The inner objects are collapsed by default.
  - Use the first field value as the label of each object.
- choose-list improvements:
  - The inner objects are collapsed by default.

## [0.3.11] - 2024-05-09
### Added
- New `blocks` field to embed Gutenberg block editor (disabled by default).
- File field: allow to specify subfolders in the uploads option.

### Changed
- Removed popover polyfill since it's supported by all modern browsers.

### Fixed
- Updated dependencies.

## [0.3.10] - 2024-04-17
### Added
- Added dark mode UI.
- Added field type `radio`.

### Fixed
- Updated dependencies.

## [0.3.9] - 2024-03-28
### Fixed
- Error with empty datetime
- Automatic extension of paths starting with `*`.
- Remove conflicting characters on slugify file names.
- Error on rename pages.

## [0.3.8] - 2024-03-18
### Changed
- Internal: Added `Upload.get`, `Upload.delete` and `Upload.rename` functions.

### Fixed
- Improved value formatting.
- Unify line endings.
- UI (draggable): improved drag over hints.
- UI (object-list, choose-list): open/close on click in the main label.
- UI (accordion): Make the header 100% width.

## [0.3.7] - 2024-03-13
### Added
- Glob patterns to GitHub storage [#10].

### Changed
- Commit message function for GitHub storage [#10].

### Fixed
- Initializes hidden input value to the schema when creating a new document/collection [#9].
- Updated Hono to the latest version.

## [0.3.6] - 2024-03-11
### Changed
- Internal: Replace `Field.transformData` with `Field.applyChanges`.

### Fixed
- Throw an exception when a file field doesn't have a upload target.
- Don't shrink the icon buttons.
- Break long words on list view.

## [0.3.5] - 2024-03-09
### Added
- `code` field type.
- Allow to create multiple instances of the CMS [#7], [#8]

### Fixed
- Updated `std` to the latest version.

## [0.3.4] - 2024-03-06
### Added
- Improved default commit message of GitHub storage and added an option to to customize it [#5].

### Fixed
- Updated `Hono` to the latest version.

## [0.3.3] - 2024-03-02
### Fixed
- Basic auth error.

## [0.3.2] - 2024-03-02
### Fixed
- GitHub storage adapter [#1], [#2].

## [0.3.1] - 2024-03-01
### Fixed
- Previewer on mobile.
- Updated `std`.

## [0.3.0] - 2024-02-29
### Added
- `options` option to `list` field.
- New `init` option to all fields.
- Allow to include descriptions for collections, documents and uploads.
- New CMS bar for previews.
- Preview improvements.
- New option `extraHead` to include extra styles or scripts.
- New files get the extension automatically

### Fixed
- Updated `Hono` to the latest version.
- Lume adapter: don't override the site url.

## [0.2.11] - 2024-02-27
### Added
- Types for `Field.toJSON`.
- New option `data` to pass arbitrary data to the CMS.
- New `log` option to store error logs in a file.

### Fixed
- Updated `Hono` to the latest version.

## [0.2.10] - 2024-02-24
### Fixed
- Preview link target.
- Improvements in the versioning system.
- Update deps: `hono`.

## [0.2.9] - 2024-02-22
### Added
- Footer with the LumeCMS version

### Fixed
- `f-date` error with null value.
- Removed Lume dependency

## [0.2.8] - 2024-02-18
### Added
- Markdown: syntax highlight fenced code.
- A field definition string ending with "!" makes the field required.
  For example: `title: string!`.
- Register `lume_cms` import map.

### Fixed
- Updated dependencies.
- UI improvements and fixes.

## [0.2.7] - 2024-02-14
### Changed
- Markdown: removed h5 and h6 buttons

### Fixed
- Format of pages without front matter.
- Markdown:
  - Field doesn't send changes.
  - Improved link insertion.

## [0.2.6] - 2024-02-13
### Added
- Toolbar to the markdown editor with buttons for bold, italic, headers, links, etc.

## [0.2.5] - 2024-02-12
### Added
- Tree view in collections list.

### Fixed
- Lume adapter when the src folder is a subfolder.
- Uploads public path detection with globs paths.
- Min height to popover.

## [0.2.4] - 2024-02-11
### Changed
- Use the Lume native watcher in the Lume adapter.

### Removed
- Documents and Files events.

## [0.2.3] - 2024-02-11
### Added
- Ctr/Cmd + B and Ctr/Cmd + I to markdown editor to apply bold and italic to the selection.

### Fixed
- Update live-reload after uploading a file.

## [0.2.2] - 2024-02-10
### Fixed
- More Windows path fixes.

## [0.2.1] - 2024-02-10
### Fixed
- Windows path normalization.

## [0.2.0] - 2024-02-10
### Changed
- Rename `/src` to `/core`.
- Moved `/storage` to the root folder.
- Moved `/src/routes/templates` to `/core/templates`.
- Moved `/src/types.ts` to the root folder.

### Fixed
- Favicon error.
- Scroll position after live-reload.
- `f-date` field.

## [0.1.0] - 2024-02-08
First version

[#1]: https://github.com/lumeland/cms/issues/1
[#2]: https://github.com/lumeland/cms/issues/2
[#5]: https://github.com/lumeland/cms/issues/5
[#7]: https://github.com/lumeland/cms/issues/7
[#8]: https://github.com/lumeland/cms/issues/8
[#9]: https://github.com/lumeland/cms/issues/9
[#10]: https://github.com/lumeland/cms/issues/10
[#15]: https://github.com/lumeland/cms/issues/15
[#16]: https://github.com/lumeland/cms/issues/16
[#18]: https://github.com/lumeland/cms/issues/18
[#19]: https://github.com/lumeland/cms/issues/19
[#20]: https://github.com/lumeland/cms/issues/20
[#22]: https://github.com/lumeland/cms/issues/22
[#23]: https://github.com/lumeland/cms/issues/23
[#26]: https://github.com/lumeland/cms/issues/26
[#28]: https://github.com/lumeland/cms/issues/28
[#29]: https://github.com/lumeland/cms/issues/29
[#30]: https://github.com/lumeland/cms/issues/30
[#31]: https://github.com/lumeland/cms/issues/31
[#34]: https://github.com/lumeland/cms/issues/34
[#37]: https://github.com/lumeland/cms/issues/37
[#41]: https://github.com/lumeland/cms/issues/41
[#45]: https://github.com/lumeland/cms/issues/45
[#46]: https://github.com/lumeland/cms/issues/46
[#51]: https://github.com/lumeland/cms/issues/51
[#52]: https://github.com/lumeland/cms/issues/52
[#53]: https://github.com/lumeland/cms/issues/53
[#59]: https://github.com/lumeland/cms/issues/59
[#62]: https://github.com/lumeland/cms/issues/62

[0.12.4]: https://github.com/lumeland/cms/compare/v0.12.3...v0.12.4
[0.12.3]: https://github.com/lumeland/cms/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/lumeland/cms/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/lumeland/cms/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/lumeland/cms/compare/v0.11.5...v0.12.0
[0.11.5]: https://github.com/lumeland/cms/compare/v0.11.4...v0.11.5
[0.11.4]: https://github.com/lumeland/cms/compare/v0.11.3...v0.11.4
[0.11.3]: https://github.com/lumeland/cms/compare/v0.11.2...v0.11.3
[0.11.2]: https://github.com/lumeland/cms/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/lumeland/cms/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/lumeland/cms/compare/v0.10.5...v0.11.0
[0.10.5]: https://github.com/lumeland/cms/compare/v0.10.4...v0.10.5
[0.10.4]: https://github.com/lumeland/cms/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/lumeland/cms/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/lumeland/cms/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/lumeland/cms/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/lumeland/cms/compare/v0.9.4...v0.10.0
[0.9.4]: https://github.com/lumeland/cms/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/lumeland/cms/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/lumeland/cms/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/lumeland/cms/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/lumeland/cms/compare/v0.8.3...v0.9.0
[0.8.3]: https://github.com/lumeland/cms/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/lumeland/cms/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/lumeland/cms/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/lumeland/cms/compare/v0.7.7...v0.8.0
[0.7.7]: https://github.com/lumeland/cms/compare/v0.7.6...v0.7.7
[0.7.6]: https://github.com/lumeland/cms/compare/v0.7.5...v0.7.6
[0.7.5]: https://github.com/lumeland/cms/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/lumeland/cms/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/lumeland/cms/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/lumeland/cms/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/lumeland/cms/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/lumeland/cms/compare/v0.6.8...v0.7.0
[0.6.8]: https://github.com/lumeland/cms/compare/v0.6.7...v0.6.8
[0.6.7]: https://github.com/lumeland/cms/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/lumeland/cms/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/lumeland/cms/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/lumeland/cms/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/lumeland/cms/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/lumeland/cms/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/lumeland/cms/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/lumeland/cms/compare/v0.5.10...v0.6.0
[0.5.10]: https://github.com/lumeland/cms/compare/v0.5.9...v0.5.10
[0.5.9]: https://github.com/lumeland/cms/compare/v0.5.8...v0.5.9
[0.5.8]: https://github.com/lumeland/cms/compare/v0.5.7...v0.5.8
[0.5.7]: https://github.com/lumeland/cms/compare/v0.5.6...v0.5.7
[0.5.6]: https://github.com/lumeland/cms/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/lumeland/cms/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/lumeland/cms/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/lumeland/cms/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/lumeland/cms/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/lumeland/cms/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/lumeland/cms/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/lumeland/cms/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/lumeland/cms/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/lumeland/cms/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/lumeland/cms/compare/v0.3.12...v0.4.0
[0.3.12]: https://github.com/lumeland/cms/compare/v0.3.11...v0.3.12
[0.3.11]: https://github.com/lumeland/cms/compare/v0.3.10...v0.3.11
[0.3.10]: https://github.com/lumeland/cms/compare/v0.3.9...v0.3.10
[0.3.9]: https://github.com/lumeland/cms/compare/v0.3.8...v0.3.9
[0.3.8]: https://github.com/lumeland/cms/compare/v0.3.7...v0.3.8
[0.3.7]: https://github.com/lumeland/cms/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/lumeland/cms/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/lumeland/cms/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/lumeland/cms/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/lumeland/cms/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/lumeland/cms/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/lumeland/cms/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/lumeland/cms/compare/v0.2.11...v0.3.0
[0.2.11]: https://github.com/lumeland/cms/compare/v0.2.10...v0.2.11
[0.2.10]: https://github.com/lumeland/cms/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/lumeland/cms/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/lumeland/cms/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/lumeland/cms/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/lumeland/cms/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/lumeland/cms/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/lumeland/cms/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/lumeland/cms/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/lumeland/cms/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/lumeland/cms/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/lumeland/cms/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lumeland/cms/releases/tag/v0.1.0
