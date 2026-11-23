import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Стилі, шрифти й зображення віддає сервер Express (src/public/assets),
// тому під час розробки проксуємо /api та /assets на нього.
export default defineConfig({
  plugins: [react()],
  build: { assetsDir: 'app' }, // щоб не конфліктувати зі статикою сервера в /assets
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/assets': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
  },
});
