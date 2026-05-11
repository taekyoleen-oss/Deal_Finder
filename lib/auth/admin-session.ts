// Node runtime only — do NOT import in Edge (middleware)
import bcrypt from 'bcryptjs'
import { signAdminToken, verifyAdminToken, COOKIE_OPTIONS } from './jwt'

export async function verifyAdminPassword(plaintext: string): Promise<boolean> {
  const raw = process.env.ADMIN_PASSWORD_HASH
  if (!raw) throw new Error('ADMIN_PASSWORD_HASH is not set')
  const hash = raw.startsWith('b64:')
    ? Buffer.from(raw.slice(4), 'base64').toString('utf8')
    : raw
  return bcrypt.compare(plaintext, hash)
}

export async function createSessionCookie(): Promise<{ cookieValue: string; token: string }> {
  const token = await signAdminToken()
  const cookieValue = serializeCookie('admin_token', token, COOKIE_OPTIONS)
  return { cookieValue, token }
}

export async function validateSession(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false
  const match = cookieHeader.match(/admin_token=([^;]+)/)
  if (!match) return false
  try {
    await verifyAdminToken(match[1])
    return true
  } catch {
    return false
  }
}

function serializeCookie(
  name: string,
  value: string,
  opts: typeof COOKIE_OPTIONS
): string {
  let str = `${name}=${value}`
  if (opts.httpOnly) str += '; HttpOnly'
  if (opts.secure) str += '; Secure'
  if (opts.sameSite) str += `; SameSite=${opts.sameSite}`
  if (opts.maxAge) str += `; Max-Age=${opts.maxAge}`
  if (opts.path) str += `; Path=${opts.path}`
  return str
}

export function clearSessionCookie(): string {
  return 'admin_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
}
