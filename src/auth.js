// 后台认证：密码登录 + HMAC 签名会话 Cookie
// - 登录后签发 cookie：payload.signature（HMAC-SHA256(SESSION_SECRET, payload)）
// - 每次请求校验签名与有效期
// - API 写操作支持 Cookie 或 X-API-Key（env.API_KEYS 逗号分隔列表）

const COOKIE_NAME = 'ftb_session'
const SESSION_TTL_SECONDS = 7 * 24 * 3600 // 7 天

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64url')
}
function b64urlDecode(str) {
  return Buffer.from(str, 'base64url')
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return new Uint8Array(sig)
}

export async function issueSession(env) {
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify({ v: 1, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })))
  const sig = b64urlEncode(await hmac(env.SESSION_SECRET, payload))
  return `${payload}.${sig}`
}

export async function verifySession(env, cookieHeader) {
  if (!cookieHeader || !env.SESSION_SECRET) return false
  const cookies = parseCookies(cookieHeader)
  const token = cookies[COOKIE_NAME]
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot < 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = b64urlEncode(await hmac(env.SESSION_SECRET, payload))
  if (sig !== expected) return false
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)))
    if (data.exp && data.exp > Math.floor(Date.now() / 1000)) return true
  } catch {
    /* invalid payload */
  }
  return false
}

export function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

export function cookieHeaderFor(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function checkPassword(env, password) {
  if (!env.ADMIN_PASSWORD) return false
  // 恒定时间比较
  const a = new TextEncoder().encode(password || '')
  const b = new TextEncoder().encode(env.ADMIN_PASSWORD)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export function isApiKeyValid(env, key) {
  if (!key || !env.API_KEYS) return false
  return env.API_KEYS.split(',').map((k) => k.trim()).includes(key)
}
