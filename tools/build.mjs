import { buildOne } from './build-one.mjs';

const app = process.argv.pop();
await buildOne(app);
