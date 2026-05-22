// vite.config.js — Chef's Diary Frontend
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],

    // Path alias — lets you import from "@/components/..." instead of "../../components/..."
    // We will configure this properly once we build the frontend.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173, // Explicit Vite dev server port — must match your CORS whitelist in server.js
    },
  };
});