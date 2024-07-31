System.register([], (_export, _context) => {
  const component = {
    mount(container, _, locals) {
      let count = 0;

      if (!container.hasChildNodes()) {
        container.innerHTML = '<div>Count (THREE): <b>0</b></div>';
      }

      const o = container.querySelector('b');

      locals.id = setInterval(() => {
        o.textContent = (++count).toString();
      }, 1000);
    },
    unmount(container, locals) {
      container.innerHTML = '';
      clearInterval(locals.id);
    },
  };

  _export('default', component);

  return {
    setters: [],
    execute() {},
  };
});
