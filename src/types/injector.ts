import type { EventEmitter } from './events';
import type { PicardStore } from './state';

export interface Services {
  config: Configuration;
  events: EventEmitter;
  scope: PicardStore;
}

export interface Configuration {}

export type ServiceCreator<TService extends keyof Services> = (injector: DependencyInjector) => Services[TService];

export interface DependencyInjector {
  get<TService extends keyof Services>(name: TService): Services[TService];
  getAll<TService extends keyof Services>(name: TService): Array<Services[TService]>;
  instantiate<TService extends keyof Services>(name: TService): DependencyInjector;
}
