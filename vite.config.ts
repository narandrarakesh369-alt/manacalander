import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mana/types': path.resolve(__dirname, './packages/types/src'),
      '@mana/config': path.resolve(__dirname, './packages/config/src'),
      '@mana/ui': path.resolve(__dirname, './packages/ui/src'),
      '@mana/services': path.resolve(__dirname, './packages/services/src'),
      '@mana/utils': path.resolve(__dirname, './packages/utils/src'),
      '@customer': path.resolve(__dirname, './apps/customer/src'),
      '@business': path.resolve(__dirname, './apps/business/src'),
      '@admin': path.resolve(__dirname, './apps/admin/src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react-router') || id.includes('react')) return 'vendor';
          }
        },
      },
    },
  },
});
