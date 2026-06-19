import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

export const DUMMY_PASSWORD_HASH =
  'dummy:8f3c2e1a9b7d4f6e0c8a2b5d7e9f1a3c5b7d9e1f3a5c7b9d1e3f5a7c9b1d3e5f7a9c1b3d5e7f9a1c3b5d7e9f1a3c5b7d9e1f3a5c7b9d1e3f5a7c9b1d3e5f7a9'

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) {
    return false
  }

  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  const keyBuffer = Buffer.from(key, 'hex')

  if (derived.length !== keyBuffer.length) {
    return false
  }

  return timingSafeEqual(derived, keyBuffer)
}
