import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/snake-beats/', // Preserves your clean GitHub Pages sub-path mapping
  build: {
    outDir: '.', // Tells Vite to render the compiled index.html right into the root folder!
  },
  server: {
    hmr: true,
    watch: {}
  }
});
