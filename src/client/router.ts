function modifyHistory(type: string) {
  const orig = history[type];
  return function (...args: Array<any>) {
    const rv = orig.apply(this, args);
    const ev = new Event(type.toLowerCase());
    window.dispatchEvent(ev);
    return rv;
  };
}

export function createRouter(slotName = 'pi-slot') {
  const routerSlot = `${slotName}[rel=router]`;

  function onHistory() {
    const target = location.pathname;
    const slot = document.querySelector(routerSlot);

    if (slot) {
      slot.setAttribute('name', `page:${target}`);
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
      history.pushState({}, '', link.href);
      const target = link.href;
      const slot = document.querySelector(routerSlot);

      if (slot) {
        slot.setAttribute('name', `page:${target}`);
      }
    }
  }

  history.pushState = modifyHistory('pushState');
  history.replaceState = modifyHistory('replaceState');

  window.addEventListener('popstate', onHistory);
  window.addEventListener('pushstate', onHistory);
  window.addEventListener('replacestate', onHistory);
  document.addEventListener('click', onClick);

  return () => {
    window.removeEventListener('popstate', onHistory);
    window.removeEventListener('pushstate', onHistory);
    window.removeEventListener('replacestate', onHistory);
    document.removeEventListener('click', onClick);
  };
}
