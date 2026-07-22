import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/core.ts'),
      formats: ['es'],
      fileName: () => 'core.js',
      cssFileName: 'core',
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'pannellum',
      ],
    },
    sourcemap: true,
    emptyOutDir: false,
  },
});
