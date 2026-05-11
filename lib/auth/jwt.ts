import { SignJWT, jwtVerify } from 'jose'

const ALG = 'HS256'
const EXPIRY = '12h'
const IDLE_EXPIRY = 4 * 60 * 60 // 4h in seconds

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export interface AdminJWTPayload {
  sub: string   // 'admin'
  iat: number
  exp: number
  jti?: string
}

export async function signAdminToken(jti?: string): Promise<string> {
  const builder = new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)

  if (jti) builder.setJti(jti)

  return builder.sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<AdminJWTPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [ALG],
  })
  return payload as AdminJWTPayload
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/admin_token=([^;]+)/)
  return match ? match[1] : null
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: IDLE_EXPIRY,
  path: '/',
}
