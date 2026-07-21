import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      insertTypesEntry: true,
      include: ['src/components/**/*', 'src/index.ts', 'src/types.ts'],
      compilerOptions: {
        noEmit: false,
      }
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'XiaoluoVRPanorama',
      formats: ['es', 'umd'],
      fileName: (format) => `xiaoluo-vr-panorama.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'motion',
        'motion/react',
        'lucide-react',
        'pannellum',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          motion: 'Motion',
          'motion/react': 'MotionReact',
          'lucide-react': 'LucideReact',
          pannellum: 'pannellum',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: false, // Ensure we don't clear pre-built server or web files in dist
  },
});
