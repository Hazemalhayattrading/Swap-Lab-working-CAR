import { defineConfig } from 'vite';
import { catalogue } from './scripts/vite-plugin-catalogue';

// GitHub Pages serves the site from /<repo>/, so production builds for Pages set
// BASE_PATH (the deploy workflow does). Local dev and tests default to '/'.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  // The simulation's data, provenance stripped (src/data/loader.ts).
  plugins: [catalogue()],
  build: {
    target: 'es2022',
    sourcemap: true,
    rolldownOptions: {
      output: {
        // three.js goes in its own chunk, so a change to the app doesn't make every
        // returning visitor download the 1 MB renderer again.
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }],
        },
      },
    },
    // That chunk is one large module by design; the default 500 kB warning is noise.
    chunkSizeWarningLimit: 1600,
  },
  worker: {
    format: 'es',
    // The simulation worker imports the catalogue too; worker bundles take their own plugins.
    plugins: () => [catalogue()],
  },
});
