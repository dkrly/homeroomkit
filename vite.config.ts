import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { pbkdf2Sync } from 'node:crypto'

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

function makePasswordHash(password: string): string {
  const salt = Buffer.from('homeroomkit-password-hash-salt')
  return pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const password = env.VITE_ENCRYPTION_PASSWORD ?? ''

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
      __PASSWORD_HASH__: JSON.stringify(password ? makePasswordHash(password) : ''),
    },
  }
})
