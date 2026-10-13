# Picard.js Changelog

## 0.3.0 (tbd)

- Improved the `browser` and `client` variants to load the Module Federation runtime on demand (browser script reduced from 106 kB to 33 kB)
- Improved the interactive script to load after the first paint, keeping it off the critical rendering path
- Improved `client="visible"` to observe server-rendered children instead of changing the element's layout
- Improved the error message for components that could not be loaded
- Updated the interactive script to be included as an ES module
- Fixed the default `scriptUrl` of the `node` variant
- Fixed loading the on-demand chunks of the `browser` variant when the script is cross-origin (e.g., from unpkg or jsdelivr)
- Fixed the `browser` variant leaking its top-level names into the global scope
- Fixed the `node` variant failing to load without the `--experimental-vm-modules` flag (e.g., in bundled ESM servers such as Angular SSR); only loading ES modules requires the flag
- Fixed loading ES modules (e.g., Native Federation) in the `node` variant by creating all linked VM modules in the same context
- Fixed unhandled rejection reports (e.g., by zone.js) when probing Module Federation v1 containers
- Fixed console errors when probing Module Federation v1 containers for modules they do not expose
- Fixed deferred component activation after disconnection and canceled pending idle/visibility work
- Fixed concurrent imports returning unfinished exports and circular live-export notification loops
- Replaced the SystemJS dependency with Picard's focused `System.register` runtime
- Replaced the Module Federation container and share-scope handling with `@module-federation/runtime`
- Removed JSR publishing configuration and workflow
- Restricted npm package contents and aligned exports with generated formats
- Renamed `picard-js/server` to `picard-js/node` (#9)
- Added support for loading the `browser` variant with `defer` or `async`
- Added package name/version metadata to module records and delegated unresolved version ranges to Module Federation
- Added more inline documentation / type declarations
- Added `loading-template-id` to attributes of `pi-component` and `pi-slot` (#8)
- Added `@softarc/native-federaton` stub to the native federation format (#6)
- Added slot ordering attributes to `pi-slot` (#7)
- Added lightweight resumption via the `islands` variant, which loads the Module Federation runtime on demand (#5)
- Added `getIslandsFile` and the `client` option to the `node` variant for serving and configuring the resuming client
- Added the `hydrate` attribute to server-rendered `pi-component` elements and `locals.hydrate` to `mount`

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
