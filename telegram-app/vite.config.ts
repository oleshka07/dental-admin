import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(dirname, './src') },
  },
  // Served under /app/ in production (nginx path routing + Telegram
  // WEBAPP_URL); keep it at root for a normal localhost:5174 dev experience.
  base: command === 'build' ? '/app/' : '/',
  server: { port: 5174 },
}));
