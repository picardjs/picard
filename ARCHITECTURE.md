# Picard.js Architecture Documentation

This documentation is only relevant for people that either want to know more about the internal architecture of Picard.js or want to contribute to the codebase.

## Contributing

The main purpose of this repository is to continue to evolve Picard.js and its core ecosystem, making it faster, more powerful, and easier to use. Development of Picard.js happens in the open on [GitHub](https://github.com/picardjs/picard), and we are grateful to the community for contributing bugfixes, ideas, and improvements.

Read below to learn how you can take part in improving Picard.js.

### [Code of Conduct](.github/CODE_OF_CONDUCT.md)

We adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](.github/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

### [Contributing Guide](.github/CONTRIBUTING.md)

Read our [contributing guide](.github/CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Piral.

### Good First Issues

To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first issues](https://github.com/smapiot/piral/labels/good%20first%20issue) that contain bugs which have a relatively limited scope. This is a great place to get started.

## Prerequisites

To build and run the code you'll need to have at least **Node v22** installed. The repository uses npm as package manager (we recommend using at least **npm v10**).

Before running the tests you need to make sure Playwright is fully installed. Run the following command to establish a working Playwright installation:

```sh
npx playwright install
```

## Basic Principles

### Directories

The code base is divided into three primary folders:

- `examples` contains basic examples of the available functionality, which runs against the local code base and is used for the tests, too
- `src` contains the actual code base - more details below
- `tests` contains tests for the library; using the `examples` as source

The `src` folder itself is divided into three regions:

- `apps` contains the actual variants of the library, as well as helper modules that should be produced
- `common` contains functionality that might be reused across the different variants
- `types` contains the TypeScript type declarations for the whole code base

### App Definitions

Each "app" must be placed as a folder inside the `src/apps` directory. The most important file for the build system is called *app.json*. It contains information that is then used by `esbuild` to produce some output. Example:

```json
{
  "name": "picard-ia",
  "platform": "browser",
  "minify": true,
  "entry": "index.ts",
  "formats": ["cjs"],
  "outDirs": ["server"]
}
```

The `name` remarks how the resulting file should be called. The `platform` tells `esbuild` what the target platform of the file is. `minify` is used to optimize the file for length (good if the file is intended as direct consumption inside a browser - otherwise if another pre-processing tool is supposed to be used with the file this is usually set to `false`). The `entry` property tells `esbuild` which module should be considered for deriving the build inputs. Finally, through `formats` and `outDirs` the actual outputs are steered. Possible formats include `cjs` (CommonJS - will produce `*.js` files) and `esm` (ESModule - will produce `*.mjs` files).

### Dependency Injection

To decouple the code base and allow different functionality to be available in different contexts a system referred to as "dependency injection" (DI) is used - which is not a full dependency injection as known by, e.g., Angular.

One advantage of this system (as compared to working with path aliases in the bundler) is that it allows extensibility out of the box.

The essential definition (inside an app's entry point) looks like this:

```js
const serviceDefinitions = {
  config: () => config,
  events: createListener,
  scope: createPicardScope,
  loader: createLoader,
};

createInjector(serviceDefinitions)
```

The provided `serviceDefinitions` for the `createInjector` call expect an object with properties resolving to the initializer functions of the different services. An initializer function is a function that will return the service instance - taking one argument: The dependency injector. This way, when initialized a service may use other services (which are then initialized by the DI system).
