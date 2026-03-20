import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { pbkdf2Sync } from 'node:crypto'

function getBuildVersion(): string {
  try {
    const dirty = execSync('git status --porcelain').toString().trim()
    if (dirty) return 'dirty'
    const hash = execSync('git rev-parse --short HEAD').toString().trim()
    const date = execSync('git log -1 --format=%cd --date=format:%Y%m%d%H%M%S').toString().trim()
    return `${date}-${hash}`
  } catch {
    return 'unknown'
  }
}

function makePasswordHash(password: string): string {
  const salt = Buffer.from('homeroomkit-password-hash-salt')
  return pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex')
}

export default defineConfig(() => {
  const password = process.env.VITE_ENCRYPTION_PASSWORD ?? ''

  return {
    plugins: [react(), tailwindcss()],
    base: '/homeroomkit/',
    define: {
      __BUILD_VERSION__: JSON.stringify(getBuildVersion()),
      __PASSWORD_HASH__: JSON.stringify(password ? makePasswordHash(password) : ''),
    },
  }
})
