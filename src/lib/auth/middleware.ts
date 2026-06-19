import { createMiddleware } from '@tanstack/react-start'

import { db } from '#/db'

import { findValidSession } from './repository'
import { readSessionToken } from './session'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const token = readSessionToken()
    const session = token ? await findValidSession(db, token) : null

    if (!session) {
      throw new Error('Não autenticado')
    }

    return next({
      context: {
        session,
        userId: session.userId,
      },
    })
  },
)
