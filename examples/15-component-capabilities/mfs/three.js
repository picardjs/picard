System.register([], (_export, _context) => {
  function setup(api) {
    api.registerComponent('component', () => _context.import('./three-component.js'));
  }

  _export('setup', setup);

  return {
    setters: [],
    execute() {},
  };
});
