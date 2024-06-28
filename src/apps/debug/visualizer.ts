import type { EventSystem, PicardStore } from '@/types';

const visualizerName = 'piral-inspector-visualizer';

const colors = [
  '#001F3F',
  '#0074D9',
  '#7FDBFF',
  '#39CCCC',
  '#3D9970',
  '#2ECC40',
  '#01FF70',
  '#FFDC00',
  '#FF851B',
  '#FF4136',
  '#85144B',
  '#F012BE',
  '#B10DC9',
];

function getTarget(element: Element) {
  const row = element.childNodes;
  return [...row]
    .map((item) => {
      if (item instanceof Element) {
        return item.getBoundingClientRect();
      } else if (item instanceof Text) {
        const range = document.createRange();
        range.selectNode(item);
        return range.getBoundingClientRect();
      } else {
        return new DOMRectReadOnly(0, 0, 0, 0);
      }
    })
    .filter((m) => m.height !== 0 && m.width !== 0)
    .reduce((a, b) => {
      const x = Math.min(a.left, b.left);
      const y = Math.min(a.top, b.top);
      const width = Math.max(a.right, b.right) - x;
      const height = Math.max(a.bottom, b.bottom) - y;
      return new DOMRectReadOnly(x, y, width, height);
    });
}

export function attachVisualizer(scope: PicardStore, events: EventSystem, componentName: string) {
  const mfColorMap: Record<string, string> = {};
  const getMicrofrontend = (element: Element) => {
    const origin = element.getAttribute('origin');

    if (origin) {
      return origin;
    }

    const cid = element.getAttribute('cid');

    if (cid) {
      const state = scope.readState();
      const mf = state.microfrontends.find((m) => cid in m.components);
      return mf?.name || '';
    }

    const source = element.getAttribute('source');

    if (source) {
      const state = scope.readState();
      const mf = state.microfrontends.find((m) => m.source === source);
      return mf?.name || '';
    }

    return '';
  };

  class PiralInspectorVisualizer extends HTMLElement {
    update = () => {
      this.innerText = '';
      document.querySelectorAll(componentName).forEach((element) => {
        const mf = getMicrofrontend(element);
        const vis = this.appendChild(document.createElement('div'));
        const info = vis.appendChild(document.createElement('div'));
        const targetRect = getTarget(element);
        vis.style.position = 'absolute';
        vis.style.left = targetRect.left + 'px';
        vis.style.top = targetRect.top + 'px';
        vis.style.width = targetRect.width + 'px';
        vis.style.height = targetRect.height + 'px';
        vis.style.pointerEvents = 'none';
        vis.style.zIndex = '99999999999';
        vis.style.border = '1px solid #ccc';
        info.style.color = 'white';
        info.textContent = mf;
        info.style.position = 'absolute';
        info.style.right = '0';
        info.style.top = '0';
        info.style.fontSize = '8px';
        info.style.background =
          mfColorMap[mf] || (mfColorMap[mf] = colors[Object.keys(mfColorMap).length % colors.length]);
      });
    };

    connectedCallback() {
      this.style.position = 'absolute';
      this.style.top = '0';
      this.style.left = '0';
      this.style.width = '0';
      this.style.height = '0';

      window.addEventListener('resize', this.update);
      events.on('mounted-component', this.update);
      events.on('unmounted-component', this.update);
      this.update();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.update);
      events.off('mounted-component', this.update);
      events.off('unmounted-component', this.update);
    }
  }

  customElements.define(visualizerName, PiralInspectorVisualizer);

  return {
    toggle() {
      const visualizer = document.querySelector(visualizerName);

      if (visualizer) {
        visualizer.remove();
      } else {
        document.body.appendChild(document.createElement(visualizerName));
      }
    },
  };
}
