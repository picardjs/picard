const webpack = require('webpack');

module.exports = {
  output: {
    uniqueName: 'test1',
  },
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      name: 'test1',
      filename: 'remoteEntry.js',
      exposes: {
        'example': './src/remote.js',
      },
      shared: ['emojis-list'],
    }),
  ],
};
