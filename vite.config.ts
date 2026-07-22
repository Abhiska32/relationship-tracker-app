import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function localAssetResolver() {
  return {
    name: 'local-asset-resolver',
    resolveId(id) {
      const prefixes = ['asset:']
      for (const prefix of prefixes) {
        if (id.startsWith(prefix)) {
          const filename = id.slice(prefix.length)
          return path.resolve(__dirname, 'src/assets', filename)
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    localAssetResolver(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
