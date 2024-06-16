import * as React from 'react';
import { createRoot } from 'react-dom/client';

export function fromReact(Component, api) {
  return {
    mount(container, params, locals) {
      locals.root = createRoot(container);
      locals.root.render(<Component params={params} piral={api} />);
    },
    unmount(container, locals) {
      locals.root.unmount();
    },
    update(params, locals) {
      locals.root.render(<Component params={params} piral={api} />);
    },
  };
}

export function withPiletState(Component, store, actions) {
  return (props) => {
    const [state, setState] = React.useState(store.getState);

    React.useEffect(() => {
      return store.subscribe((current) => {
        setState(current);
      });
    }, []);

    return <Component state={state} actions={actions} {...props} />;
  };
}
