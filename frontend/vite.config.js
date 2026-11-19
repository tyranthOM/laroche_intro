import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    host: true, // Listen on all local IP addresses (0.0.0.0)
    allowedHosts: true, // Allow all tunnel hosts like .loca.lt, ngrok, etc.
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (['ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(err.code)) return;
            console.warn('[vite] api proxy error:', err.message);
          });
        },
      },
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Silence normal mobile phone sleep / tab close disconnects (EPIPE, ECONNRESET)
            if (['ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(err.code)) return;
            console.warn('[vite] ws proxy error:', err.message);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err) => {
              if (['ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(err.code)) return;
            });
          });
        },
      },
    },
  },
});
