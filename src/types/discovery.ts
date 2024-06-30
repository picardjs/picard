import type { PiletDefinition, PiletResponse } from './pilet';

export type StaticFeed = Array<PiletDefinition> | DiscoveryResponse | PiletResponse | Record<string, string>;

export type FeedDefinition = string | StaticFeed | (() => Promise<StaticFeed>);

export interface DiscoveryResponse {
  schema: string;
  microFrontends: {
    [name: string]: Array<MicroFrontendDefinition>;
  };
}

export interface MicroFrontendDefinition {
  url: string;
  fallbackUrl?: string;
  metadata?: {
    integrity?: string;
    version?: string;
  };
  extras?: any;
}
