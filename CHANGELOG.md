# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- a changelog (this file)
- the three decor APIs (class, function and react) are nuw exported as objects.
- meta API to the decor APIs
   - isDecorated
   - normalize
   - getOriginal
   - getDecoration
   - makeFeature (replaces previous `decor*` functions)
   - makeFeatureFactory
- meta API for features
   - forceFeatureOrder
   - markFeatureWith
- function hooks now gets the wrapped function as an extra argument 

### Changed
- stylable now gracefully works with root decorators in any order
- naming changed in effort to have single terminology
- all decor APIs uses same type of resiult : `Feature<T>`
- class decor uses function decor hooks type
- class decor generics API simplified
- class decor hooks arguments schema changed
- class decor hooks can now change arguments object in-place without returning it
- class decor hooks now work on cloneElement
- function wrapping metadata now using private state (so it's visible on function to debugger in dev-mode)
- react decor now has a single hook type, which is informed if the argument is root.
- aggressive caching of class-private-state (affects all inherited class decorations)
- lodash no longer a runtime dependency

### Removed
- deprecated `root` export

### Fixed
- devMode subtle bug which silenced tests logging
- react decor bug with multiple root decorators on SFC
- react-decor no longer double-wraps components
