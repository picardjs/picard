System.register([], (_export, _context) => {
  function setup(api) {
    api.registerComponent('component', {
      mount(container) {
        container.innerHTML = '<div>From <b>ONE</b>!</div>';
      },
      unmount(container) {
        container.innerHTML = '';
      },
    });
  }

  _export('setup', setup);

  return {
    setters: [],
    execute() {},
  };
});
