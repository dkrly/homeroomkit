const ITERATIONS = 100_000
const HASH_SALT = new TextEncoder().encode('homeroomkit-password-hash-salt')

export async function hashPassword(password: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: HASH_SALT, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function decryptStudents(encryptedBuf: ArrayBuffer, password: string): Promise<string> {
  const data = new Uint8Array(encryptedBuf)
  const salt = data.slice(0, 16)
  const iv = data.slice(16, 28)
  const tag = data.slice(28, 44)
  const ciphertext = data.slice(44)

  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.length)

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key, combined
  )
  return new TextDecoder().decode(decrypted)
}
