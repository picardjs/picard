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

export function createRouter(injector: DependencyInjector) {
  const { slotName } = injector.get('config');
  const routerSlot = `${slotName}[rel=router]`;

  function navigate(target: string) {
    const router = document.querySelector(routerSlot);

    if (router) {
      router.setAttribute('name', `page:${target}`);
    }
  }

  function onHistory() {
    navigate(location.pathname);
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
      history.pushState({}, '', link.href);
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
    navigate(route: string, state: any) {
      history.pushState(state, '', route);
    },
    dispose() {
      window.removeEventListener('popstate', onHistory);
      window.removeEventListener('pushstate', onHistory);
      window.removeEventListener('replacestate', onHistory);
      document.removeEventListener('click', onClick);
    },
  };
}
