import emojis from 'emojis-list';

const component = {
  mount(container) {
    container.innerHTML = `Hello from "test1": ${emojis[1]}.`;
  },
  update() {},
  unmount() {},
};

export default component;
