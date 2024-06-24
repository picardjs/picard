import type { EventSystem } from './events';
import type { FragmentsService } from './fragments';
import type { LoaderService } from './loader';
import type { PiletService } from './pilet';
import type { RendererService } from './renderer';
import type { RouterService } from './router';
import type { PicardStore } from './state';
import type { LoadingQueue } from './utils';

export interface Services {
  config: Configuration;
  events: EventSystem;
  scope: PicardStore;
  loader: LoaderService;
  pilet?: PiletService;
  router: RouterService;
  renderer: RendererService;
  fragments: FragmentsService;
  feed: LoadingQueue;
}

export interface Configuration {}

export type ServiceCreator<TService extends keyof Services> = (injector: DependencyInjector) => Services[TService];

export interface DependencyInjector {
  get<TService extends keyof Services>(name: TService): Services[TService];
  getAll<TService extends keyof Services>(name: TService): Array<Required<Services>[TService]>;
  instantiate<TService extends keyof Services>(name: TService): DependencyInjector;
}
