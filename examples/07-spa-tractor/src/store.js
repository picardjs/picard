import { createStore } from 'zustand/vanilla';

export function createContainer(initialState, fns, api) {
  const store = createStore(() => initialState);
  const cb = (dispatch) => store.setState(dispatch);
  const actions = {};

  Object.entries(fns).forEach(([key, action]) => {
    actions[key] = (...args) => action.call(api, cb, ...args);
  });

  return [store, actions];
}
