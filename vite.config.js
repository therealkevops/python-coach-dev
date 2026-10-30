import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  // The Python worker is an ES module worker that imports the runner's .py sources.
  worker: { format: 'es' },
  build: {
    rollupOptions: {
      output: {
        // React and CodeMirror change far less often than the app, so they get long-cached files of their own.
        manualChunks: {
          react: ['react', 'react-dom'],
          editor: ['@codemirror/state', '@codemirror/view', '@codemirror/language', '@codemirror/lang-python', '@codemirror/commands'],
        },
      },
    },
  },
  server: { port: 8998, host: '0.0.0.0', strictPort: true },
});
