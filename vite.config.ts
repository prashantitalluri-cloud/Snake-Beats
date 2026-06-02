import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/snake-beats/', // Preserves your clean GitHub Pages sub-path routing maps
  server: {
    hmr: true,
    watch: {}
  }
});
