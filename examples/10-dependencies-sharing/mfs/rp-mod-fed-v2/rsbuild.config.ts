import { defineConfig } from '@rsbuild/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

export default defineConfig({
  server: {
    port: 6006,
  },
  dev: {
    assetPrefix: 'http://localhost:6006',
  },
  tools: {
    rspack: (config, { appendPlugins }) => {
      config.output!.publicPath = 'auto';
      config.output!.uniqueName = 'test6';
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'test6',
          exposes: {
            'example': './src/remote.js',
          },
          shared: ['emojis-list', 'fireworks-js'],
        }),
      ]);
    },
  },
  plugins: [],
});
