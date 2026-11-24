import { defineConfig } from 'vite';

// Builds one small file: dist/v1.js -> served at https://widget.botfolks.in/v1.js
export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts', name: 'Botfolks', formats: ['iife'], fileName: () => 'v1.js' },
    minify: true,
    target: 'es2018',
  },
});
