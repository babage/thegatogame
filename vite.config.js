import { defineConfig } from 'vite';
// base './' so the build works from any folder or static host path
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 900 } });
