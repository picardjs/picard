# Picard.js Contributor Notes

## Project Shape

- `src/apps` defines the browser, client, Node, native, islands, and adapter builds. Each `app.json` is the source of truth for emitted formats and output directories.
- `src/common` holds shared runtime behavior. `src/types` defines the public and internal contracts.
- `examples` are also test fixtures. Playwright serves their local `dist` folders, which `npm run build` populates; run the full build before browser tests after source changes.
- `tests` contains browser end-to-end tests. The default `npm test` project is intentionally workspace-configurable; do not overwrite a user's existing script change.

## Useful Commands

- `npm run build` builds all runtime variants and copies browser output to applicable examples.
- `npm run test` runs the configured default Playwright project.
- `npm run test:all` runs all configured browser projects.

## Architecture Notes

- `LoaderService` uses Picard's small `System.register` runtime in `src/common/loader/system.ts` for shared resolver registration, URL registration, linking, import, evaluated-module lookup, and dependency listing.
- Module Federation uses the bundled `@module-federation/runtime` in `src/common/formats/module.ts` for remotes and share negotiation; preserve Picard loader interop for Pilets and Native Federation.
- Native Federation uses its manifest's shared dependency list to register ESM resolvers through the same loader; it does not provide a separate Picard dependency registry.
- Pilets use named and anonymous `System.register` modules. Keep registration, relative resolution, live export updates, dependency sharing, and Node SSR covered when changing the runtime.
- Package-version records store `name` and exact `version` once; use this metadata for listing and matching. Preserve exact IDs before selecting an evaluated compatible version for range requests.
- Keep lazy browser ESM shim imports of loader types type-only. A value import can introduce a shared chunk into the classic browser entry; validate the browser script after rebuilding examples.
- Custom-element lifecycle work belongs in `src/common/browser/elements.ts`. Cancel deferred work on reset/disconnect and guard callbacks against detached elements.

## Package and Release

- npm is the supported package registry. JSR configuration and publishing have been removed.
- Keep `package.json` exports consistent with the artifacts defined by `src/apps/*/app.json`. Browser script, client ESM, Node CJS/ESM, and native ESM are distinct outputs.
- The npm `files` allowlist intentionally excludes examples, tests, and source files.