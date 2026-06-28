import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto'

/**
 * AES-256-GCM encryption for credentials stored in Clerk privateMetadata.
 *
 * Format of an encrypted value:  v1:<ivHex>:<tagHex>:<cipherHex>
 *
 * The symmetric key is derived from the ENCRYPTION_KEY env var. Rotating
 * ENCRYPTION_KEY invalidates previously stored values — callers detect that
 * via DecryptionFailedError and prompt the user to re-enter credentials.
 *
 * NOTE: reconstructed from the deployed build's call sites (encrypt /
 * safeDecrypt / DecryptionFailedError). Behavior matches what the routes
 * expect; verify against your original ENCRYPTION_KEY before relying on it to
 * read previously-stored values.
 */

export class DecryptionFailedError extends Error {
  constructor(message = 'Decryption failed') {
    super(message)
    this.name = 'DecryptionFailedError'
  }
}

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) {
    throw new Error('ENCRYPTION_KEY env var is not set.')
  }
  // Derive a stable 32-byte key from the secret.
  return scryptSync(secret, 'kalshibot-static-salt', 32)
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decrypt(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new DecryptionFailedError('Unrecognized ciphertext format')
  }
  const [, ivHex, tagHex, dataHex] = parts
  try {
    const key = getKey()
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ])
    return dec.toString('utf8')
  } catch {
    throw new DecryptionFailedError('Could not decrypt value (key may have rotated)')
  }
}

/**
 * Decrypt that throws DecryptionFailedError on any failure. Used everywhere
 * the routes need to surface a friendly "re-enter your credentials" message.
 */
export function safeDecrypt(payload: string): string {
  if (!payload) throw new DecryptionFailedError('Empty value')
  return decrypt(payload)
}
