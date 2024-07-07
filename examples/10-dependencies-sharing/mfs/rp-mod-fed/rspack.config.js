const rspack = require('@rspack/core');

module.exports = {
  output: {
    uniqueName: 'test2',
  },
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: 'test2',
      filename: 'remoteEntry.js',
      exposes: {
        'example': './src/remote.js',
      },
      shared: ['emojis-list', 'fireworks-js'],
    }),
  ],
};
