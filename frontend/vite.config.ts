import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/shorten': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '^/[A-Za-z0-9]{7}$': 'http://localhost:3000',
    },
  },
});
