import type { DependencyInjector, ServiceCreator, Services } from '../types';

type ServiceInstances = {
  [TService in keyof Services]: Array<Services[TService]>;
};

function makeServices<TService extends keyof Services>(
  serviceDefinitions: ServiceDefinitions,
  name: TService,
  injector: DependencyInjector,
): Array<any> {
  const definition = serviceDefinitions[name];

  if (Array.isArray(definition)) {
    return definition.map((d) => d(injector));
  } else if (typeof definition === 'function') {
    return [definition(injector)];
  }

  return [];
}

export type ServiceDefinitions = {
  [TService in keyof Services]: ServiceCreator<TService> | Array<ServiceCreator<TService>>;
};

export function createInjector(serviceDefinitions: ServiceDefinitions) {
  const instances: Partial<ServiceInstances> = {};
  const injector: DependencyInjector = {
    get(name) {
      return injector.getAll(name)[0];
    },
    getAll(name) {
      const instance = instances[name];

      if (!instance) {
        const services = makeServices(serviceDefinitions, name, injector);
        instances[name] = services;
        return services;
      }

      return instance;
    },
    instantiate(name) {
      injector.getAll(name);
      return injector;
    }
  };

  return injector;
}
