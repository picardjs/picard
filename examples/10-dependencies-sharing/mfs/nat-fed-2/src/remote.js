import emojis from 'emojis-list';

const component = {
  mount(container) {
    container.innerHTML = `Hello from "test4": ${emojis[61]}.`;
  },
  update() {},
  unmount() {},
};

export default component;
