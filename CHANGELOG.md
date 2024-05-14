# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

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
