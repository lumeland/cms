# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.8] - Unreleased
### Added
- Markdown: syntax highlight fenced code.
- A field definition string ending with "!" makes the field required.
  For example: `title: string!`.

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

[0.2.8]: https://github.com/lumeland/cms/compare/v0.2.7...HEAD
[0.2.7]: https://github.com/lumeland/cms/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/lumeland/cms/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/lumeland/cms/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/lumeland/cms/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/lumeland/cms/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/lumeland/cms/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/lumeland/cms/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/lumeland/cms/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lumeland/cms/releases/tag/v0.1.0
