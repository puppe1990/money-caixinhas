import { and, eq, gt } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { randomBytes } from 'node:crypto'

import { sessions, users } from '#/db/schema'
import type * as schema from '#/db/schema'

import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from './password'
import { sessionExpiresAt } from './session'

type Database = LibSQLDatabase<typeof schema>

export type AuthUser = {
  id: number
  email: string
}

export type AuthSession = {
  id: string
  userId: number
  user: AuthUser
}

function createSessionToken() {
  return randomBytes(32).toString('hex')
}

export async function findUserByEmail(db: Database, email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))

  return user ?? null
}

export async function createUser(
  db: Database,
  input: { email: string; password: string },
) {
  const email = input.email.trim().toLowerCase()
  const passwordHash = await hashPassword(input.password)

  const [created] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning()

  return created
}

export async function verifyUserCredentials(
  db: Database,
  input: { email: string; password: string },
) {
  const user = await findUserByEmail(db, input.email)
  const hashToCheck = user?.passwordHash ?? DUMMY_PASSWORD_HASH
  const passwordMatches = await verifyPassword(input.password, hashToCheck)

  if (!user || !passwordMatches) {
    return null
  }

  return user
}

export async function revokeAllSessionsForUser(db: Database, userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}

export async function createSession(db: Database, userId: number) {
  const token = createSessionToken()

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt: sessionExpiresAt(),
  })

  return token
}

export async function revokeSession(db: Database, sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export async function findValidSession(
  db: Database,
  token: string,
): Promise<AuthSession | null> {
  const now = new Date().toISOString()
  const [row] = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      email: users.email,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, now)))

  if (!row) {
    return null
  }

  return {
    id: row.sessionId,
    userId: row.userId,
    user: {
      id: row.userId,
      email: row.email,
    },
  }
}

export async function findUserById(db: Database, userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId))

  return user ?? null
}

export async function changeUserPassword(
  db: Database,
  userId: number,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await findUserById(db, userId)

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  const passwordMatches = await verifyPassword(
    input.currentPassword,
    user.passwordHash,
  )

  if (!passwordMatches) {
    throw new Error('Senha atual incorreta')
  }

  const passwordHash = await hashPassword(input.newPassword)

  await db.update(users).set({ passwordHash }).where(eq(users.id, userId))

  return user
}

export async function ensureSeedUser(
  db: Database,
  input: { email: string; password: string },
) {
  const existing = await findUserByEmail(db, input.email)

  if (existing) {
    return existing
  }

  return createUser(db, input)
}
