import type { DependencyInjector } from '../types';

function modifyHistory(type: string) {
  const orig = history[type];
  return function (...args: Array<any>) {
    const rv = orig.apply(this, args);
    const ev = new Event(type.toLowerCase());
    window.dispatchEvent(ev);
    return rv;
  };
}

function navigate(route: string, state: any) {
  history.pushState(state, '', route);
}

const pageQualifier = 'page:';

export function createRouter(injector: DependencyInjector) {
  const scope = injector.get('scope');
  const { slotName } = injector.get('config');
  const routerSlot = `${slotName}[rel=router]`;

  function onHistory() {
    const target = location.pathname;
    const router = document.querySelector(routerSlot);

    if (router) {
      router.setAttribute('name', `${pageQualifier}${target}`);
    }
  }

  function onClick(e: MouseEvent) {
    let link = e.target instanceof Element && e.target.closest('a');

    if (
      link &&
      link instanceof HTMLAnchorElement &&
      link.href &&
      (!link.target || link.target === '_self') &&
      link.origin === location.origin &&
      !link.hasAttribute('download') &&
      e.button === 0 && // left clicks only
      !e.metaKey && // open in new tab (mac)
      !e.ctrlKey && // open in new tab (windows)
      !e.altKey && // download
      !e.shiftKey &&
      !e.defaultPrevented
    ) {
      e.preventDefault();
      navigate(link.href, {});
    }
  }

  history.pushState = modifyHistory('pushState');
  history.replaceState = modifyHistory('replaceState');

  window.addEventListener('popstate', onHistory);
  window.addEventListener('pushstate', onHistory);
  window.addEventListener('replacestate', onHistory);
  document.addEventListener('click', onClick);

  onHistory();

  return {
    navigate,
    findRoutes() {
      const state = scope.readState();
      return Object.keys(state.components)
        .filter((m) => m.startsWith(pageQualifier))
        .map((m) => m.substring(pageQualifier.length));
    },
    dispose() {
      window.removeEventListener('popstate', onHistory);
      window.removeEventListener('pushstate', onHistory);
      window.removeEventListener('replacestate', onHistory);
      document.removeEventListener('click', onClick);
    },
  };
}
