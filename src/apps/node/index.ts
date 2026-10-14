import { createEsm } from './esm';
import { createListener } from './events';
import { createPlatform } from './platform';
import { createFeed } from '@/common/feed';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createRouter } from '@/common/server/router';
import { createDecorator } from '@/common/server/decorator';
import { createStylePart } from '@/common/server/style-part';
import { createScriptPart } from '@/common/server/script-part';
import { createSheet } from '@/common/ui/styles';
import { createRenderer } from '@/common/ui/renderer';
import { createModuleFederation } from '@/common/formats/module';
import { createNativeFederation } from '@/common/formats/native';
import { createPilet } from '@/common/formats/pilet';
import { createDefaultConverter } from '@/common/frameworks/default';
import { createHtmlConverter } from '@/common/frameworks/html';
import { createSlotBehaviorForRouter } from '@/common/slot-rels/router';
import islandsFiles from 'embedded:islands';
import type { DecoratorService, FeedDefinition, FeedService, PartService } from '@/types';

export interface PicardClientOptions {
  /**
   * The services to add when resuming in the browser. Maps the name of
   * the service (e.g., "framework.react") to the URL of an ES module,
   * which default exports the service creator.
   */
  services?: Record<string, string>;
  /**
   * The centrally shared dependencies to use when resuming in the browser.
   * Maps the dependency (e.g., "react@18.3.1") to the URL of an ES module.
   */
  dependencies?: Record<string, string>;
}

export interface PicardOptions {
  /**
   * The name of the pi-component.
   * @default pi-component
   */
  componentName?: string;
  /**
   * The name of the pi-slot.
   * @default pi-slot
   */
  slotName?: string;
  /**
   * The name of the pi-part.
   * @default pi-part
   */
  partName?: string;
  /**
   * The URL of the fragment service, if any.
   */
  fragmentUrl?: string;
  /**
   * The URL of the script for interactive sessions.
   * If not given the islands variant from unpkg will be used.
   * Use `getIslandsFile` to serve it from this process instead.
   */
  scriptUrl?: string;
  /**
   * The micro frontend discovery service URL,
   * data from calling it, or callback function
   * to call it manually.
   */
  feed?: FeedDefinition;
  /**
   * The initial state of Picard.js - if resumed.
   */
  state?: any;
  /**
   * The additional services to register.
   */
  services?: Record<string, any>;
  /**
   * The centrally shared dependencies to use.
   */
  dependencies?: Record<string, () => Promise<any>>;
  /**
   * Indicates that the rendering should be interactive, i.e.,
   * going into an islands architecture application.
   */
  interactive?: boolean;
  /**
   * The configuration for resuming in the browser. Only
   * used if the rendering is interactive.
   */
  client?: PicardClientOptions;
}

const defaultOptions = {
  componentName: 'pi-component',
  slotName: 'pi-slot',
  partName: 'pi-part',
  fragmentUrl: '',
  scriptUrl: `https://unpkg.com/picard-js@${process.env.PICARD_VERSION}/dist/islands/picard.js`,
  services: {},
  dependencies: {},
  interactive: false,
};

declare module '@/types/injector' {
  interface Services {
    decorator: DecoratorService;
    feed: FeedService;
    [part: `part.${string}`]: PartService;
  }

  interface Configuration {
    feed?: FeedDefinition;
    scriptUrl?: string;
    client?: PicardClientOptions;
    state?: any;
    fragmentUrl?: string;
    dependencies: Record<string, () => Promise<any>>;
  }
}

export {
  createModuleFederation,
  createNativeFederation,
  createPilet,
  createDefaultConverter,
  createSlotBehaviorForRouter,
  createHtmlConverter,
};

/**
 * Gets the content of a file of the islands variant, i.e., the lightweight
 * client resuming the server-rendered page. Serve the files from the
 * directory of the `scriptUrl` to resume without any external resource.
 * @param name The name of the file, e.g., "picard.js".
 * @returns The JavaScript content or undefined if no such file exists.
 */
export function getIslandsFile(name: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(islandsFiles, name) ? islandsFiles[name] : undefined;
}

/**
 * Gets the names of the files of the islands variant, e.g., to write them
 * next to statically generated pages.
 * @returns The names of the files, e.g., "picard.js" and its chunks.
 */
export function getIslandsFileNames(): Array<string> {
  return Object.keys(islandsFiles);
}

export function initializePicard(options?: PicardOptions): DecoratorService {
  const {
    feed,
    state,
    scriptUrl = defaultOptions.scriptUrl,
    services = defaultOptions.services,
    dependencies = defaultOptions.dependencies,
    fragmentUrl = defaultOptions.fragmentUrl,
    componentName = defaultOptions.componentName,
    slotName = defaultOptions.slotName,
    partName = defaultOptions.partName,
    interactive = defaultOptions.interactive,
    client,
  } = options || {};

  const serviceDefinitions = {
    events: createListener,
    scope: createPicardScope,
    feed: createFeed,
    esm: createEsm,
    renderer: createRenderer,
    router: createRouter,
    platform: createPlatform,
    loader: createLoader,
    decorator: createDecorator,
    sheet: createSheet,
    'format.module': createModuleFederation,
    'format.native': createNativeFederation,
    'format.pilet': createPilet,
    'framework.default': createDefaultConverter,
    'framework.html': createHtmlConverter,
    'part.style': createStylePart,
    'slotRel.router': createSlotBehaviorForRouter,
    ...(interactive ? { 'part.script': createScriptPart } : {}),
    ...services,
    config: () => ({
      feed,
      state,
      componentName,
      partName,
      slotName,
      fragmentUrl,
      dependencies,
      scriptUrl,
      client,
      services,
    }),
  };

  return createInjector(serviceDefinitions).instantiate('loader').instantiate('feed').get('decorator');
}
