const rspack = require('@rspack/core');

module.exports = {
  output: {
    // set uniqueName explicitly to make HMR works
    uniqueName: 'green',
  },
  resolve: {
    extensions: ['.jsx', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.png$/,
        type: 'asset',
      },
      {
        test: /\.jpg$/,
        type: 'asset',
      },
      {
        test: /\.jsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      // options
      name: 'green',
      filename: 'remoteEntry.js',
      exposes: {
        './Recommendations': './src/remote.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
};
