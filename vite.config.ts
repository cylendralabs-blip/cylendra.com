import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        manualChunks: (id) => {
          // CRITICAL FIX: Keep ALL React-dependent libraries in main bundle
          // This prevents initialization errors in production builds
          if (id.includes('node_modules')) {
            // Keep React and all React-dependent libraries in main bundle
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react/jsx-runtime') || 
              id.includes('react-router') ||
              id.includes('recharts') ||
              id.includes('@radix-ui') ||
              id.includes('@tanstack/react-query') ||
              id.includes('react-hook-form') ||
              id.includes('react-day-picker') ||
              id.includes('react-resizable-panels') ||
              id.includes('react-tradingview-embed') ||
              id.includes('embla-carousel-react') ||
              id.includes('qrcode.react')
            ) {
              return undefined; // Part of main bundle
            }
            
            // Only split non-React libraries
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Other vendor libraries
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
          
          // Admin chunks - Keep in main bundle to ensure React is available
          // if (id.includes('/admin/') || id.includes('/pages/Admin')) {
          //   return 'admin';
          // }
          
          // Large pages - Keep in main bundle to ensure React is available
          // Don't split pages that use React components
          // if (id.includes('/pages/Dashboard')) {
          //   return 'dashboard';
          // }
          // if (id.includes('/pages/Trading')) {
          //   return 'trading';
          // }
          // if (id.includes('/pages/Analytics')) {
          //   return 'analytics';
          // }
          
          // Services chunks
          if (id.includes('/services/admin/')) {
            return 'admin-services';
          }
          if (id.includes('/services/billing/')) {
            return 'billing-services';
          }
          if (id.includes('/services/payments/')) {
            return 'payment-services';
          }
          if (id.includes('/services/automatedTrading/')) {
            return 'trading-services';
          }
          if (id.includes('/services/riskManagement/')) {
            return 'risk-services';
          }
          
          // Core chunks
          if (id.includes('/core/plans/')) {
            return 'core-plans';
          }
          if (id.includes('/core/copy-trading')) {
            return 'core-copy';
          }
          
          // Components chunks - Keep in main bundle to ensure React is available
          // if (id.includes('/components/charts/')) {
          //   return 'chart-components';
          // }
          // if (id.includes('/components/admin/')) {
          //   return 'admin-components';
          // }
          
          return undefined;
        },
      },
    },
  },
}));
