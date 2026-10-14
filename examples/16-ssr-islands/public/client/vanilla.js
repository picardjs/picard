/**
 * A tiny framework converter used on the server and - loaded via its URL - in the browser.
 * A vanilla component is an object with a `render(props)` function returning HTML and an
 * optional `attach(container, props)` function adding interactivity to the rendered HTML.
 */
export default function createVanillaConverter() {
  return {
    convert(component) {
      return {
        async load() {},
        async unload() {},
        async bootstrap() {},
        async stringify(props) {
          return component.render(props);
        },
        mount(container, props, locals) {
          if (!locals.hydrate) {
            container.innerHTML = component.render(props);
          }

          container.dataset.mode = locals.hydrate ? 'hydrated' : 'rendered';
          locals.detach = component.attach?.(container, props);
        },
        update() {},
        unmount(container, locals) {
          locals.detach?.();
          delete container.dataset.mode;
        },
      };
    },
  };
}
