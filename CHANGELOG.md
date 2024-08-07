# Picard.js Changelog

## 0.3.0 (tbd)

- Renamed `picard-js/server` to `picard-js/node` (#9)
- Improved released package on JSR (only considering native output)
- Added more inline documentation / type declarations
- Added `loading-template-id` to attributes of `pi-component` and `pi-slot` (#8)
- Added slot ordering attributes to `pi-slot` (#7)

**Note**: ⚠️ Early preview: Not suitable for production yet

## 0.2.3 (July 15, 2024)

- Improved automatic releases of CI/CD pipeline
- Improved the generated TypeScript declarations

**Note**: ⚠️ Early preview: Not suitable for production yet

## 0.2.2 (July 14, 2024)

- Fixed initialization from existing state
- Fixed dependency map structure for Native Federation in debug adapter
- Fixed dependency map structure for pilets in debug adapter
- Improved loading performance of components

**Note**: ⚠️ Early preview: Not suitable for production yet

## 0.2.1 (July 14, 2024)

- Updated CI/CD pipelines to make automatic releases
- Added scroll reset on history replace/push in the router

**Note**: ⚠️ Early preview: Not suitable for production yet

## 0.2.0 (July 13, 2024)

- Renamed `getExport` to `getComponent`
- Extended and aligned event names and arguments
- Improved lazy loading of components
- Updated the lifecycle model for consistency
- Added support for Module Federation v2 manifest
- Added support for dynamic route matching
- Added extensible `rel` behavior services for `pi-slot` (`slotRel.{name}`)
- Added extensible part services for the SSR decorator (`part.{name}`)

**Note**: ⚠️ Early preview: Not suitable for production yet

## 0.1.0 (July 8, 2024)

- Initial release

**Note**: ⚠️ Early preview: Not suitable for production yet
