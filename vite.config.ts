import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  build: {
    rollupOptions: {
      input: {
        index: new URL('./index.html', import.meta.url).pathname,
        'auto-title-background': new URL(
          './src/auto-title-background.ts',
          import.meta.url,
        ).pathname,
      },
      output: {
        entryFileNames: ({ name }) =>
          name === 'auto-title-background'
            ? 'auto-title-background.js'
            : 'assets/[name]-[hash].js',
      },
    },
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
  ],
})

export default config
