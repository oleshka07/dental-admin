import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Served under /admin/ in production (nginx path routing); keep it at
  // root for a normal localhost:5173 dev experience.
  base: command === 'build' ? '/admin/' : '/',
  server: { port: 5173 },
}));
