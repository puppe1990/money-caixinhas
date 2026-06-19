import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

export const SESSION_COOKIE = 'pm_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

export function readSessionToken(): string | null {
  return getCookie(SESSION_COOKIE) ?? null
}

export function setSessionCookie(token: string) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export function clearSessionCookie() {
  deleteCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString()
}
