import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind v4 runs as a Vite plugin rather than through PostCSS. That's why
  // there is no longer a postcss.config.js here: v4 handles vendor prefixing
  // itself via Lightning CSS, so the old tailwindcss + autoprefixer pair it
  // used to declare became redundant.
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      // Matches the "@/*" paths entry in tsconfig.json / tsconfig.app.json.
      // Components pulled from the Watermelon registry import each other and
      // the cn() helper through this alias, so the bundler has to know it too
      // or the build fails on the first copied component.
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  server: {
    // Lets the dev server accept requests through a tunnel's public
    // hostname (e.g. localtunnel/ngrok), which Vite otherwise rejects by
    // default since the Host header won't match localhost.
    allowedHosts: true,
  },
})
