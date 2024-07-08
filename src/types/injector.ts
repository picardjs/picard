import type { ContainerService } from './container';
import type { ConverterService } from './converter';
import type { EsmService } from './esm';
import type { EventSystem } from './events';
import type { SheetService } from './sheet';
import type { LoaderService } from './loader';
import type { PlatformService } from './platform';
import type { PiletService } from './pilet';
import type { RendererService } from './renderer';
import type { RouterService } from './router';
import type { PicardStore } from './state';

export interface Services {
  config: Configuration;
  events: EventSystem;
  scope: PicardStore;
  loader: LoaderService;
  pilet?: PiletService;
  esm: EsmService;
  router: RouterService;
  platform: PlatformService;
  renderer: RendererService;
  sheet?: SheetService;
  [framework: `framework.${string}`]: ConverterService;
  [format: `format.${string}`]: ContainerService;
}

export interface Configuration {
  partName: string;
  slotName: string;
  componentName: string;
  meta?: any;
}

export type ServiceCreator<TService extends keyof Services> = (injector: DependencyInjector) => Services[TService];

export interface DependencyInjector {
  get<TService extends keyof Services>(name: TService): Services[TService];
  getAll<TService extends keyof Services>(name: TService): Array<Required<Services>[TService]>;
  instantiate<TService extends keyof Services>(name: TService): DependencyInjector;
}
