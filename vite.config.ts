import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      modulePreload: {
        // The PDF export stack is loaded only when a report is requested, so do not preload it.
        resolveDependencies: (_url: string, deps: string[]) => deps.filter((d) => !d.includes("export-vendor")),
      },
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react-vendor";
            if (id.includes("recharts") || id.includes("/d3-") || id.includes("victory-vendor")) return "charts-vendor";
            if (id.includes("lucide-react")) return "icons-vendor";
            if (id.includes("/motion") || id.includes("framer-motion")) return "motion-vendor";
            if (id.includes("katex") || id.includes("react-katex")) return "katex-vendor";
            if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("canvg") || id.includes("purify")) return "export-vendor";
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
