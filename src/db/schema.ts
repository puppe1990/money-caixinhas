import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const caixinhas = sqliteTable('caixinhas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
