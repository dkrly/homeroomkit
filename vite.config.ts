import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

function getBuildVersion(): string {
  try {
    const dirty = execSync('git status --porcelain').toString().trim()
    if (dirty) return 'dirty'
    const date = execSync('git log -1 --format=%cd --date=format:%Y-%m-%d\\ %H:%M:%S').toString().trim()
    return date
  } catch {
    return 'unknown'
  }
}


export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
        manifest: {
          name: '담임 운영 키트',
          short_name: '담임키트',
          description: '교실 운영 도구',
          theme_color: '#1E2A1E',
          background_color: '#F6F7F2',
          display: 'standalone',
          start_url: '/homeroomkit/',
          scope: '/homeroomkit/',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    base: '/homeroomkit/',
    define: {
      __BUILD_VERSION__: JSON.stringify(getBuildVersion()),
    },
  }
})
