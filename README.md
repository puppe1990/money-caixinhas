# Caixinhas — Metas Financeiras

App de metas por caixinha com **TanStack Start**, **Turso (libSQL)** e **TDD**.

## Funcionalidades

- Criar caixinhas com **meta total** vinculada a um **mês/ano**
- Registrar **depósitos** com valor e data (dia/mês/ano)
- Visualizar progresso e **agrupamento por período** (ex: Junho/2026, Março/2026)

## Setup

```bash
npm install
npm run db:push
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco (Turso)

Desenvolvimento local usa SQLite via libSQL:

```env
TURSO_DATABASE_URL="file:local.db"
TURSO_AUTH_TOKEN=""
```

Para produção com Turso Cloud:

```bash
turso db create project-money
turso db show project-money --url
turso db tokens create project-money
```

Atualize `.env.local` com a URL e o token.

## Testes (TDD)

```bash
npm run test
```

Cobertura atual:

- Domínio: parse de valores, validação de data, cálculo de progresso, agrupamento por mês/ano
- Repositório: criação de caixinha, depósitos e listagem com progresso

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run test` | Testes Vitest |
| `npm run db:push` | Sincroniza schema com o banco |
| `npm run db:studio` | Drizzle Studio |

## Estrutura

```
src/
  db/              # schema Turso + conexão
  lib/caixinhas/   # domínio, repositório, server functions, testes
  components/      # UI principal
  routes/          # rotas TanStack Start
```
