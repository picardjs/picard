import { loadScript, registerModule } from './utils';
import type {
  ModuleFederationEntry,
  ModuleFederationContainer,
  ModuleFederationFactoryScope,
  ComponentGetter,
} from '../types';

const appShell = 'app';

function populateKnownDependencies(scope: ModuleFederationFactoryScope) {
  // SystemJS to MF
  for (const [entry] of System.entries()) {
    const index = entry.lastIndexOf('@');

    if (index > 0 && !entry.match(/^https?:\/\//)) {
      const entryName = entry.substring(0, index);
      const entryVersion = entry.substring(index + 1);

      if (!(entryName in scope)) {
        scope[entryName] = {};
      }

      scope[entryName][entryVersion] = {
        from: appShell,
        eager: false,
        get: () => System.import(entry).then((result) => () => result),
      };
    }
  }
}

function extractSharedDependencies(scope: ModuleFederationFactoryScope) {
  // MF to SystemJS
  for (const entryName of Object.keys(scope)) {
    const entries = scope[entryName];

    for (const entryVersion of Object.keys(entries)) {
      const entry = entries[entryVersion];

      if (entry.from !== appShell) {
        registerModule(`${entryName}@${entryVersion}`, () => entry.get().then((factory) => factory()));
      }
    }
  }
}

function loadFactory(name: string) {
  const varName = name.replace(/^@/, '').replace('/', '-').replace(/\-/g, '_');
  const container: ModuleFederationContainer = window[varName];
  const scope: ModuleFederationFactoryScope = {};
  container.init(scope);
  populateKnownDependencies(scope);
  extractSharedDependencies(scope);
  return container;
}

/**
 * Loads the micro frontend from module federation.
 * @param entry The module federation entry to fully load.
 * @returns The factory to retrieve exposed components.
 */
export async function withModuleFederation(entry: ModuleFederationEntry): Promise<ComponentGetter> {
  await loadScript(entry.url);
  const container = loadFactory(entry.id);
  return {
    async load(name) {
      try {
        const factory = await container.get(name);
        const component = factory();
        return component.default || component;
      } catch {
        return undefined;
      }
    },
  };
}
