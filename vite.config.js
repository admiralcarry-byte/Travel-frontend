import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: "::",
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-icons', 'lucide-react'],
          charts: ['recharts'],
          utils: ['axios', 'html2canvas', 'jspdf']
        }
      }
    }
  },
  define: {
    'import.meta.env.PROD': JSON.stringify(mode === 'production'),
    'import.meta.env.DEV': JSON.stringify(mode === 'development')
  }
}));
