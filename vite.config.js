import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015',
  },
  server: { port: 5173 },
});
