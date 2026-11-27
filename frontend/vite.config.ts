import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

/*
 * Code splitting. Screens are lazy-loaded in App.tsx; this groups them into one chunk per area so a
 * guest downloads only the guest pages, a resident only the resident portal, and so on.
 * Files the app needs at startup (nav configs, publicNav, guest/access, the resident kit that the
 * welcome page's legal sheet uses) must stay out of these groups, or their whole group would load
 * at startup too. Guests use the resident app, so guest pages share the resident chunk.
 */
const STARTUP_FILES = /components\/(resident\/residentNav|resident\/useResidentActivity|resident\/kit|resident\/GuidedTour|admin\/adminNav|admin\/adminNotices|public\/publicNav|guest\/access)\./;
const AREA_CHUNKS: [RegExp, string][] = [
  [/components\/(resident|guest)\//, 'area-resident'],
  [/components\/admin\//, 'area-admin'],
  [/components\/official\//, 'area-shared'],
  [/components\/shared\/OfficialDocumentTemplate\./, 'certificate'],
  [/components\/shared\//, 'area-shared'],
];

const manualChunks = (rawId: string) => {
  const id = rawId.split(path.sep).join('/');
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
  if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'vendor-motion';
  if (/node_modules\/lucide-react\//.test(id)) return 'vendor-icons';
  // Everything else in src (context, data, ui, shells, login) is startup code. Naming it explicitly
  // stops Rollup from tucking it into an area chunk, which would make that area load at startup.
  if (!id.includes('/src/')) return undefined;
  if (STARTUP_FILES.test(id)) return 'app-core';
  return AREA_CHUNKS.find(([re]) => re.test(id))?.[1] ?? 'app-core';
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin()],
    build: {
      rollupOptions: { output: { manualChunks } },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
  };
});
