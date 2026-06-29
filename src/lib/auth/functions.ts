import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db'
import { parseServerInput } from '#/lib/server/parse-input'

import { authMiddleware } from './middleware'
import {
  changeUserPassword,
  createSession,
  createUser,
  findUserByEmail,
  findValidSession,
  revokeAllSessionsForUser,
  revokeSession,
  verifyUserCredentials,
} from './repository'
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from './session'

const credentialsSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => parseServerInput(credentialsSchema, data))
  .handler(async ({ data }) => {
    const user = await verifyUserCredentials(db, data)

    if (!user) {
      throw new Error('E-mail ou senha inválidos')
    }

    await revokeAllSessionsForUser(db, user.id)
    const token = await createSession(db, user.id)
    setSessionCookie(token)

    return {
      email: user.email,
    }
  })

export const signupFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => parseServerInput(credentialsSchema, data))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase()
    const existing = await findUserByEmail(db, email)

    if (existing) {
      throw new Error('Este e-mail já está cadastrado')
    }

    const user = await createUser(db, {
      email,
      password: data.password,
    })

    const token = await createSession(db, user.id)
    setSessionCookie(token)

    return {
      email: user.email,
    }
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await revokeSession(db, context.session.id)
    clearSessionCookie()
    return { ok: true }
  })

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
})

export const changePasswordFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(changePasswordSchema, data))
  .handler(async ({ data, context }) => {
    await changeUserPassword(db, context.userId, data)

    await revokeAllSessionsForUser(db, context.userId)
    const token = await createSession(db, context.userId)
    setSessionCookie(token)

    return { ok: true }
  })

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const token = readSessionToken()
    const session = token ? await findValidSession(db, token) : null

    if (!session) {
      return null
    }

    return {
      email: session.user.email,
    }
  },
)
