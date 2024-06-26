[![Picard.js Logo](https://picard.js.org/picard-logo-256.png)](https://picard.js.org)

# [Picard.js](https://picard.js.org) &middot; [![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/picardjs/picard/blob/main/LICENSE)

[![Build Status](https://github.com/picardjs/picard/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/picardjs/picard/actions)
[![npm](https://img.shields.io/npm/v/picard-js.svg)](https://www.npmjs.com/package/picard-js)
[![GitHub tag](https://img.shields.io/github/tag/picardjs/picard.svg)](https://github.com/picardjs/picard/releases)
[![GitHub issues](https://img.shields.io/github/issues/picardjs/picard.svg)](https://github.com/picardjs/picard/issues)
[![Community Chat](https://dcbadge.vercel.app/api/server/kKJ2FZmK8t?style=flat)](https://discord.gg/kKJ2FZmK8t)

The next generation of micro frontend orchestrators.

> A micro frontend *orchestrator* is a library that helps you loading, mounting, and unmounting micro frontends incl. their exposed functionality such as components.

What Picard.js allows you to do is to include micro frontends in any web application that you create - from server-side pages rendered with PHP to progressive web applications using Next.js.

## Getting Started

Include a script in your website:

```html
<script src="https://unpkg.com/picard-js"></script>
```

Alternatively, if you don't like *unpkg* you can also use *jsdelivr*:

```html
<script src="https://cdn.jsdelivr.net/npm/picard-js"></script>
```

Now start creating regions for the components of the micro frontends you'd like to display:

```html
<pi-component
  name="column"
  source="https://feed.piral.cloud/api/v1/pilet/picard-demos/latest/mf-simple-html/"
  kind="module"
  container="simplehtml">
</pi-component>
```

The `name` denotes the name of the exposed component, while the `source` is used to tell Picard where the micro frontend resides. In the previous example we tell Picard that we want to use a micro frontend using Module Federation (`kind` attribute set to `module`) with the container named `simplehtml`.

For Native Federation a similar syntax is used:

```html
<pi-component
  name="column"
  source="https://feed.piral.cloud/api/v1/pilet/picard-demos/latest/nfsimplehtml/"
  kind="native">
</pi-component>
```

The major difference is that the `kind` is set to `native` for Native Federation.

Note: Here we don't need to know any `container`.

## Further Information

👉 For more information visit the [documentation](https://picard.js.org).

You can also reach us in the [Piral community chat](https://discord.gg/kKJ2FZmK8t) 💻.

## License

Picard.js is released using the MIT license. For more information see the [license file](./LICENSE).
