import { createRouteMatcher } from '@/common/utils/matcher';
import type { DependencyInjector, RouterService } from '@/types';

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

function scrollToTop() {
  window.scrollTo(0, 0);
}

const pageQualifier = 'page:';

export function createRouter(injector: DependencyInjector): RouterService {
  const scope = injector.get('scope');
  const { slotName } = injector.get('config');
  const routerSlot = `${slotName}[rel=router]`;

  function onHistory(ev?: Event) {
    const router = document.querySelector(routerSlot);

    if (router) {
      const target = location.pathname;
      const forward = ev && ev.type !== 'popstate';
      router.setAttribute('name', `${pageQualifier}${target}`);
      forward && scrollToTop();
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

  function findRoutes() {
    const state = scope.readState();
    return Object.entries(state.components)
      .filter(([k, v]) => v.length && k.startsWith(pageQualifier))
      .map(([k]) => k.substring(pageQualifier.length));
  }

  history.pushState = modifyHistory('pushState');
  history.replaceState = modifyHistory('replaceState');

  window.addEventListener('popstate', onHistory);
  window.addEventListener('pushstate', onHistory);
  window.addEventListener('replacestate', onHistory);
  document.addEventListener('click', onClick);

  onHistory();

  const matcher = createRouteMatcher(findRoutes);

  return {
    dispose() {
      window.removeEventListener('popstate', onHistory);
      window.removeEventListener('pushstate', onHistory);
      window.removeEventListener('replacestate', onHistory);
      document.removeEventListener('click', onClick);
    },
    findRoutes,
    navigate,
    matchRoute(name) {
      if (name.startsWith(pageQualifier)) {
        const route = name.substring(pageQualifier.length);
        const result = matcher(route);

        if (result) {
          const [path, data] = result;
          return {
            name: `${pageQualifier}${path}`,
            data,
          };
        }
      }

      return undefined;
    },
  };
}
