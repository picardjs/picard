System.register([], function (_export) {
  // shows where the markup has been produced
  function origin() {
    return typeof window === 'undefined' ? 'server' : 'client';
  }

  var counter = {
    render(props) {
      var start = props.start || 0;
      return `<button type="button" class="counter">Count: ${start}</button><span class="origin">${origin()}</span>`;
    },
    attach(container, props) {
      var button = container.querySelector('.counter');
      var count = props.start || 0;
      var increment = function () {
        button.textContent = `Count: ${++count}`;
      };
      button.addEventListener('click', increment);
      return function () {
        button.removeEventListener('click', increment);
      };
    },
  };

  return {
    execute: function () {
      _export('setup', function (api) {
        // rendered on the server and hydrated on the client
        api.registerComponent('counter', counter, { type: 'vanilla' });
        // only rendered on the client
        api.registerComponent('client-only', counter, { type: 'vanilla', server: 'none' });
        // only rendered on the server; never interactive
        api.registerComponent('server-only', counter, { type: 'vanilla', client: 'none' });
        // rendered on the server and hydrated on the client once visible
        api.registerComponent('visible', counter, { type: 'vanilla', client: 'visible' });
      });
    },
  };
});
