import type { ZodType } from 'zod'

const FIELD_LABELS: Record<string, string> = {
  id: 'transação',
  caixinhaId: 'caixinha',
  amount: 'valor',
  day: 'dia',
  month: 'mês',
  year: 'ano',
  name: 'nome',
  targetAmount: 'meta',
  email: 'e-mail',
  password: 'senha',
  currentPassword: 'senha atual',
  newPassword: 'nova senha',
  orderedIds: 'ordem das caixinhas',
  page: 'página',
}

function fieldLabel(path: PropertyKey[]): string {
  const key = String(path[0] ?? '')
  return FIELD_LABELS[key] ?? key
}

function formatIssueMessage(path: PropertyKey[], message: string): string {
  const label = fieldLabel(path)

  if (
    message.includes('expected number') ||
    message.includes('Invalid input')
  ) {
    return `Campo "${label}" inválido`
  }

  if (message.includes('Too small')) {
    return `Campo "${label}" inválido`
  }

  if (message.includes('obrigat')) {
    return message
  }

  return message
}

export function formatZodIssues(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): string {
  const messages = issues.map((issue) =>
    formatIssueMessage(issue.path, issue.message),
  )

  return [...new Set(messages)].join('. ')
}

export function parseServerInput<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new Error(formatZodIssues(result.error.issues))
  }

  return result.data
}
