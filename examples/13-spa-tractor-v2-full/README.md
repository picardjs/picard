# The Tractor Store - Picard.js, Native Federation & Preact

A micro frontends sample implementation of [The Tractor Store](https://micro-frontends.org/tractor-store/) built with Picard.js, Preact, and Native Federation. It's based on the [Blueprint](https://github.com/neuland/tractor-store-blueprint).

**Live Demo:** [TBA](#)

## About This Implementation

### Technologies

List of techniques used in this implementation.

| Aspect                     | Solution                                  |
| -------------------------- | ----------------------------------------- |
| 🛠️ Frameworks, Libraries   | [preact], [Picard.js], [esbuild]         |
| 📝 Rendering               | SPA                                      |
| 🐚 Application Shell       | None                                      |
| 🧩 Client-Side Integration | Custom Elements (`pi-component`)          |
| 🧩 Server-Side Integration | *none* / (could render SSR, too)          |
| 📣 Communication           | Custom Events, HTML Attributes            |
| 🗺️ Navigation              | SPA, One MF per Team, Picard.js routing   |
| 🎨 Styling                 | Self-Contained CSS (No Global Styles)     |
| 🍱 Design System           | None                                      |
| 🔮 Discovery               | Native Federation Manifest                |
| 🚚 Deployment              | Static Page                               |
| 👩‍💻 Local Development       | [http-server]                             |

[preact]: https://preactjs.com/
[Picard.js]: https://picard.js.org/
[esbuild]: https://esbuild.github.io/
[http-server]: https://www.npmjs.com/package/http-server

### Limitations

This implementation is deliberately kept simple to focus on the micro frontends aspects. URLs are hardcoded, components could be more DRY and no linting, testing or type-safety is implemented. In a real-world scenario, these aspects should be addressed properly.

## How to run locally

Clone this repository and run the following commands:

```bash
npm i
npm run build
cd examples/13-spa-tractor-v2-full/mfs
./prepare-mfs.sh
cd ..
```

Now that everything is prepared you can start a local web server to check out the demo (importantly, you are still in the `13-spa-tractor-v2-full` directory):

```bash
npx http-server
```

Open http://localhost:8080 in your browser to see the integrated application.

## About The Authors

[smapiot](https://smapiot.com/) is a growing company specialized in delivering IT solutions and services for the emerging space of digital transformation and IoT. smapiot was founded in 2014 and is located in Munich. We are the core maintainers of the [Piral](https://www.piral.io) framework and the [Picard.js](https://picard.js.org) library.
