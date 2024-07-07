import { defineConfig } from "vite";
import { federation } from "@module-federation/vite";
import { createEsBuildAdapter } from "@softarc/native-federation-esbuild";

export default defineConfig(async ({ command }) => ({
  plugins: [
    await federation({
      options: {
        workspaceRoot: __dirname,
        outputPath: "dist",
        federationConfig: "src/federation.js",
        verbose: false,
        dev: command === "serve",
      },
      adapter: createEsBuildAdapter({
        plugins: [],
      }),
    }),
  ],
}));