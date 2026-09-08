import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// Relative assets work under a GitHub Pages repository path or a custom domain.
export default defineConfig({
  root: fromRoot('./docs'),
  base: './',
  publicDir: false,
  build: {
    outDir: fromRoot('./dist-site'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        index: fromRoot('./docs/index.html'),
        privacy: fromRoot('./docs/privacy.html'),
        support: fromRoot('./docs/support.html'),
      },
    },
  },
})
