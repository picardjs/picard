import emojis from 'emojis-list';
import Fireworks from 'fireworks-js';

const component = {
  mount(container) {
    const options = {
      gravity: 1.4,
      opacity: 0.4,
      autoresize: false,
      acceleration: 1.0,
    };

    const fireworks = new Fireworks(document.querySelector('.container'), options);
    container.innerHTML = `Hello from "test6": ${emojis[0]}. <button class="btn btn-warning">Fireworks ${emojis[489]}</button>`;
    container.querySelector('button').addEventListener('click', () => {
      if (fireworks.isRunning) {
        fireworks.stop();
      } else {
        fireworks.start();
      }
    });
  },
  update() {},
  unmount() {},
};

export default component;
