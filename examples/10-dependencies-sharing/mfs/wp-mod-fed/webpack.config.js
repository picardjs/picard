const webpack = require('webpack');

module.exports = {
  output: {
    uniqueName: 'test1',
  },
  experiments: {
    outputModule: true,
  },
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      name: 'test1',
      filename: 'remoteEntry.mjs',
      exposes: {
        'example': './src/remote.js',
      },
      library: {
        type: 'module',
      },
      shared: ['emojis-list'],
    }),
  ],
};
