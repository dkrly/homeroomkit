import { writeFileSync, mkdirSync } from 'node:fs'
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto'
import { config } from 'dotenv'

config()

const password = process.env.VITE_ENCRYPTION_PASSWORD
const studentsJson = process.env.STUDENTS_JSON
if (!password || !studentsJson) {
  console.error('Missing VITE_ENCRYPTION_PASSWORD or STUDENTS_JSON')
  process.exit(1)
}

JSON.parse(studentsJson) // validate

const salt = randomBytes(16)
const key = pbkdf2Sync(password, salt, 100_000, 32, 'sha256')
const iv = randomBytes(12)
const cipher = createCipheriv('aes-256-gcm', key, iv)
const encrypted = Buffer.concat([cipher.update(studentsJson, 'utf8'), cipher.final()])
const tag = cipher.getAuthTag()

// Pack: salt(16) + iv(12) + tag(16) + ciphertext
const packed = Buffer.concat([salt, iv, tag, encrypted])

mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/students.enc', packed)
console.log(`Encrypted ${studentsJson.length} bytes -> public/data/students.enc (${packed.length} bytes)`)
