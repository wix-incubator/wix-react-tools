# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- the three decor APIs (class, function and react) are nuw exported as objects.
- meta API to the decor APIs
   - isDecorated
   - normalize
   - getOriginal
   - getDecoration
   - makeFeature (replaces previous `decor*` functions)
   - makeFeatureFactory
- function hooks now gets the wrapped function as an extra argument 

### Changed
- naming changed in effort to have single terminology
- all decor APIs uses same type of resiult : `Feature<T>`
- class decor uses function decor hooks type
- class decor generics API simplified
- function wrapping metadata now using private state (so it's visible on function to debugger in dev-mode)
- react decor now has a single hook type, which is informed if the argument is root.
- lodash no longer a runtime dependency

### Removed
- deprecated `root` export

### Fixed
- devMode subtle bug which silenced tests logging
- react decor bug with multiple root decorators on SFC
- react-decor no longer double-wraps components
