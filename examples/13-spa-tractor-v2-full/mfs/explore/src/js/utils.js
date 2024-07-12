import { h, render } from 'preact';

export function src(image, size) {
  return image.replace('[size]', `${size}`);
}

export function srcset(image, sizes = []) {
  return sizes.map((size) => `${src(image, size)} ${size}w`).join(', ');
}

export function fmtprice(price) {
  return `${price},00 Ø`;
}

export function getLifecycle(Component) {
  return {
    mount(container, props, locals) {
      locals.container = container;
      render(h(Component, props), container);
    },
    update(props, locals) {
      const { container } = locals;
      render(h(Component, props), container);
    },
    unmount(container) {
      render(null, container);
    },
  };
}
