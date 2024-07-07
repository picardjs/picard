import emojis from 'emojis-list';

const component = {
  mount(container) {
    container.innerHTML = `Hello from "test5": ${emojis[81]}.`;
  },
  update() {},
  unmount() {},
};

export default component;


export function setup(app: any) {
  app.registerComponent('example', component);
}
