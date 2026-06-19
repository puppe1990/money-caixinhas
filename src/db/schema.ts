import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const caixinhas = sqliteTable('caixinhas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAmountCents: integer('target_amount_cents').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const depositos = sqliteTable('depositos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caixinhaId: integer('caixinha_id')
    .notNull()
    .references(() => caixinhas.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  day: integer('day').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})
