import { resolve } from 'path';

export default {
  resolve: {
    alias: {
      'picard-js/client': resolve(__dirname, '../../dist/client/picard.mjs'),
    },
  },
};
