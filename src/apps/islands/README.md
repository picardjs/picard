# Apps: Islands

This variant of Picard is a lightweight client that resumes a page rendered by the `node` variant in interactive mode. It does not load a feed or index slots - micro frontends are only loaded when one of their components is hydrated or rendered on the client. The Module Federation runtime is only loaded on demand. The script must be included as an ES module (`type="module"`); it can be served directly from the SSR process.
