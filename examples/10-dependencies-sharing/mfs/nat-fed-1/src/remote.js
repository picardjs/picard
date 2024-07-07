import emojis from 'emojis-list';
import ky from 'ky';

const component = {
  mount(container) {
    container.innerHTML = `Hello from "test3": ${emojis[5]}. <button class="btn btn-primary">Make request</button>`;
    container.querySelector('button').addEventListener('click', async () => {
      const res = await ky.get('https://jsonplaceholder.typicode.com/todos/1');
      const todo = await res.json();
      console.log('Received result', todo);
      alert(todo.title);
    });
  },
  update() {},
  unmount() {},
};

export default component;
